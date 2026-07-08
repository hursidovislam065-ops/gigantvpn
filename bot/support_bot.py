"""
GigantVPN Support Bot
Polls Supabase for new support messages, sends notifications to admin.
Admin replies via Telegram are saved back to Supabase.
"""

import os
import time
import logging
import requests
from dotenv import load_dotenv
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

load_dotenv()

# Config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ijgzostzqpowlyllssjb.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')  # Service role key from Supabase dashboard
ADMIN_CHAT_ID = int(os.getenv('ADMIN_CHAT_ID', '0'))
BOT_TOKEN = os.getenv('SUPPORT_BOT_TOKEN', '')
POLL_INTERVAL = 5  # seconds

# State: which ticket admin is currently replying to
active_ticket_by_admin: dict[int, int] = {}  # admin_chat_id -> ticket_id

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
}


def supabase_get(table: str, params: str = '') -> list:
    url = f'{SUPABASE_URL}/rest/v1/{table}?{params}'
    r = requests.get(url, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()


def supabase_insert(table: str, data: dict) -> dict:
    url = f'{SUPABASE_URL}/rest/v1/{table}'
    r = requests.post(url, headers={**HEADERS, 'Prefer': 'return=representation'}, json=data, timeout=10)
    r.raise_for_status()
    return r.json()[0]


def supabase_update(table: str, data: dict, params: str) -> dict:
    url = f'{SUPABASE_URL}/rest/v1/{table}?{params}'
    r = requests.patch(url, headers={**HEADERS, 'Prefer': 'return=representation'}, json=data, timeout=10)
    r.raise_for_status()
    return r.json()


def get_user_info(telegram_id: int) -> dict:
    users = supabase_get('users', f'telegram_id=eq.{telegram_id}&select=username,first_name')
    return users[0] if users else {}


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        'GigantVPN Support Bot\n\n'
        'Команды:\n'
        '/list — открыть обращения\n'
        '/reply <id> — ответить на обращение\n'
        '/close <id> — закрыть обращение\n\n'
        'Или просто напишите сообщение — оно будет отправлено как ответ на активное обращение.'
    )


async def cmd_list(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.id != ADMIN_CHAT_ID:
        return

    tickets = supabase_get('support_tickets', 'status=neq.closed&order=updated_at.desc')
    if not tickets:
        await update.message.reply_text('Нет открытых обращений.')
        return

    lines = ['Открытые обращения:\n']
    for t in tickets[:10]:
        status = {'open': '🟢', 'in_progress': '🟡'}.get(t['status'], '⚪')
        lines.append(f'{status} #{t["id"]} — {t["subject"]}')
        lines.append(f'   user_id: {t["user_id"]}')

    await update.message.reply_text('\n'.join(lines))


async def cmd_reply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.id != ADMIN_CHAT_ID:
        return

    args = context.args
    if not args:
        await update.message.reply_text('Использование: /reply <ticket_id> <сообщение>')
        return

    try:
        ticket_id = int(args[0])
    except ValueError:
        await update.message.reply_text('Некорректный ID обращения.')
        return

    message = ' '.join(args[1:])
    if not message:
        await update.message.reply_text('Введите сообщение после ID.')
        return

    try:
        # Get ticket info
        tickets = supabase_get('support_tickets', f'id=eq.{ticket_id}')
        if not tickets:
            await update.message.reply_text(f'Обращение #{ticket_id} не найдено.')
            return

        ticket = tickets[0]

        # Save admin reply
        supabase_insert('support_messages', {
            'ticket_id': ticket_id,
            'sender': 'admin',
            'message': message,
            'telegram_id': 0,
        })

        # Update ticket status
        supabase_update('support_tickets', {'status': 'in_progress'}, f'id=eq.{ticket_id}')

        # Notify user via main bot (optional - can be done via Supabase Realtime)
        user = get_user_info(ticket['user_id'])
        username = user.get('username', 'unknown')

        await update.message.reply_text(
            f'Ответ отправлен на обращение #{ticket_id}\n'
            f'Пользователь: @{username}\n'
            f'Сообщение: {message}'
        )

        # Remember active ticket
        active_ticket_by_admin[update.effective_chat.id] = ticket_id

    except Exception as e:
        logger.error(f'Reply error: {e}')
        await update.message.reply_text(f'Ошибка: {e}')


async def cmd_close(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.id != ADMIN_CHAT_ID:
        return

    args = context.args
    if not args:
        await update.message.reply_text('Использование: /close <ticket_id>')
        return

    try:
        ticket_id = int(args[0])
        supabase_update('support_tickets', {'status': 'closed'}, f'id=eq.{ticket_id}')
        await update.message.reply_text(f'Обращение #{ticket_id} закрыто.')
    except Exception as e:
        await update.message.reply_text(f'Ошибка: {e}')


async def handle_admin_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle plain text from admin — reply to active ticket."""
    if update.effective_chat.id != ADMIN_CHAT_ID:
        return

    ticket_id = active_ticket_by_admin.get(update.effective_chat.id)
    if not ticket_id:
        await update.message.reply_text(
            'Нет активного обращения. Используйте /list и /reply <id>'
        )
        return

    message = update.message.text
    try:
        supabase_insert('support_messages', {
            'ticket_id': ticket_id,
            'sender': 'admin',
            'message': message,
            'telegram_id': 0,
        })
        supabase_update('support_tickets', {'status': 'in_progress'}, f'id=eq.{ticket_id}')

        tickets = supabase_get('support_tickets', f'id=eq.{ticket_id}')
        user = get_user_info(tickets[0]['user_id']) if tickets else {}
        username = user.get('username', 'unknown')

        await update.message.reply_text(
            f'Отправлено в #{ticket_id} (@{username})'
        )
    except Exception as e:
        logger.error(f'Message error: {e}')
        await update.message.reply_text(f'Ошибка: {e}')


async def poll_new_messages(bot: Bot):
    """Poll Supabase for new user messages and notify admin."""
    last_check_id = 0

    while True:
        try:
            # Get unread admin-bound messages
            messages = supabase_get(
                'support_messages',
                'sender=eq.user&is_read=false&id=gt.{0}&order=id.asc&limit=10'.format(last_check_id)
            )

            for msg in messages:
                last_check_id = max(last_check_id, msg['id'])

                # Get ticket info
                tickets = supabase_get('support_tickets', f'id=eq.{msg["ticket_id"]}')
                if not tickets:
                    continue

                ticket = tickets[0]
                user = get_user_info(msg.get('telegram_id', 0) or ticket['user_id'])

                username = user.get('username', 'unknown')
                first_name = user.get('first_name', '')
                tg_id = msg.get('telegram_id', ticket['user_id'])

                text = (
                    f'Новое сообщение #{msg["ticket_id"]}\n'
                    f'Тема: {ticket["subject"]}\n'
                    f'Пользователь: {first_name} (@{username})\n'
                    f'TG ID: {tg_id}\n'
                    f'User ID: {ticket["user_id"]}\n\n'
                    f'"{msg["message"]}"\n\n'
                    f'Ответить: /reply {msg["ticket_id"]} <текст>'
                )

                await bot.send_message(chat_id=ADMIN_CHAT_ID, text=text)

                # Mark as read
                supabase_update('support_messages', {'is_read': True}, f'id=eq.{msg["id"]}')

        except Exception as e:
            logger.error(f'Poll error: {e}')

        await asyncio.sleep(POLL_INTERVAL)


import asyncio


async def post_init(application: Application):
    """Start polling in background after bot is initialized."""
    asyncio.create_task(poll_new_messages(application.bot))


def main():
    if not BOT_TOKEN:
        logger.error('SUPPORT_BOT_TOKEN not set!')
        return
    if not SUPABASE_KEY:
        logger.error('SUPABASE_SERVICE_KEY not set!')
        return
    if not ADMIN_CHAT_ID:
        logger.error('ADMIN_CHAT_ID not set!')
        return

    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()

    app.add_handler(CommandHandler('start', cmd_start))
    app.add_handler(CommandHandler('list', cmd_list))
    app.add_handler(CommandHandler('reply', cmd_reply))
    app.add_handler(CommandHandler('close', cmd_close))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_admin_message))

    logger.info('Support bot started!')
    app.run_polling()


if __name__ == '__main__':
    main()
