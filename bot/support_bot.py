"""
GigantVPN Bot (aiogram + SOCKS proxy)
Support bot + Marzban VPN integration
"""

import os
import asyncio
import logging
import requests
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message
from aiogram.client.session.aiohttp import AiohttpSession

load_dotenv()

# Config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ijgzostzqpowlyllssjb.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')
ADMIN_CHAT_ID = int(os.getenv('ADMIN_CHAT_ID', '0'))
BOT_TOKEN = os.getenv('SUPPORT_BOT_TOKEN', '')
POLL_INTERVAL = 5

# Marzban config
MARZBAN_URL = os.getenv('MARZBAN_URL', 'https://78.17.9.37')
MARZBAN_USER = os.getenv('MARZBAN_USER', 'admin')
MARZBAN_PASS = os.getenv('MARZBAN_PASS', 'admin123')

# State
active_ticket_by_admin: dict[int, int] = {}
marzban_token: str = ''

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

# ============ Supabase helpers ============

def supabase_get(table: str, params: str = '') -> list:
    url = f'{SUPABASE_URL}/rest/v1/{table}?{params}'
    r = requests.get(url, headers=HEADERS, timeout=15)
    r.raise_for_status()
    return r.json()

def supabase_insert(table: str, data: dict) -> dict:
    url = f'{SUPABASE_URL}/rest/v1/{table}'
    r = requests.post(url, headers={**HEADERS, 'Prefer': 'return=representation'}, json=data, timeout=15)
    r.raise_for_status()
    return r.json()[0]

def supabase_update(table: str, data: dict, params: str) -> dict:
    url = f'{SUPABASE_URL}/rest/v1/{table}?{params}'
    r = requests.patch(url, headers={**HEADERS, 'Prefer': 'return=representation'}, json=data, timeout=15)
    r.raise_for_status()
    return r.json()

def get_user_info(telegram_id: int) -> dict:
    users = supabase_get('users', f'telegram_id=eq.{telegram_id}&select=username,first_name')
    return users[0] if users else {}

# ============ Marzban helpers ============

def get_marzban_token() -> str:
    global marzban_token
    if marzban_token:
        return marzban_token
    try:
        r = requests.post(
            f'{MARZBAN_URL}/api/admin/token',
            data={'username': MARZBAN_USER, 'password': MARZBAN_PASS},
            verify=False,
            timeout=10
        )
        r.raise_for_status()
        marzban_token = r.json()['access_token']
        return marzban_token
    except Exception as e:
        logger.error(f'Marzban auth error: {e}')
        return ''

def marzban_api(method: str, endpoint: str, data: dict = None) -> dict:
    token = get_marzban_token()
    if not token:
        return {'error': 'Marzban auth failed'}

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    url = f'{MARZBAN_URL}/api/{endpoint}'

    try:
        if method == 'GET':
            r = requests.get(url, headers=headers, verify=False, timeout=15)
        elif method == 'POST':
            r = requests.post(url, headers=headers, json=data, verify=False, timeout=15)
        elif method == 'PUT':
            r = requests.put(url, headers=headers, json=data, verify=False, timeout=15)
        elif method == 'DELETE':
            r = requests.delete(url, headers=headers, verify=False, timeout=15)
        else:
            return {'error': f'Unknown method: {method}'}

        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f'Marzban API error: {e}')
        return {'error': str(e)}

def create_vpn_user(username: str, data_limit: int = 1073741824) -> dict:
    """Create a VPN user in Marzban with VLESS protocol."""
    return marzban_api('POST', 'user', {
        'username': username,
        'data_limit': data_limit,
        'expire': 0,
        'proxies': {'vless': {}},
        'inbounds': {'vless': ['VLESS WS']},
    })

def get_vpn_user(username: str) -> dict:
    """Get VPN user info and subscription link."""
    return marzban_api('GET', f'user/{username}')

def get_vpn_users() -> list:
    """Get all VPN users."""
    result = marzban_api('GET', 'users')
    return result.get('users', [])

def reset_vpn_user(username: str) -> dict:
    """Reset VPN user subscription link."""
    return marzban_api('POST', f'user/{username}/revoke_sub')

# ============ Router ============

router = Router()

@router.message(CommandStart())
async def cmd_start(message: Message):
    if message.chat.id == ADMIN_CHAT_ID:
        await message.answer(
            '🔒 GigantVPN Admin\n\n'
            'Поддержка:\n'
            '/list — обращения\n'
            '/reply <id> <текст> — ответить\n'
            '/close <id> — закрыть\n\n'
            'VPN:\n'
            '/vpn — создать VPN для себя\n'
            '/vpnusers — список VPN пользователей\n'
            '/vpnlink <username> — ссылка подписки\n'
            '/vpnreset <username> — сбросить ссылку'
        )
    else:
        await message.answer(
            '🎧 Добро пожаловать в GigantVPN!\n\n'
            'Напишите ваш вопрос, и мы ответим.\n\n'
            'Для получения VPN напишите /vpn'
        )

@router.message(Command('vpn'))
async def cmd_vpn(message: Message):
    """Create or get VPN access for user."""
    username = f'tg_{message.chat.id}'

    # Check if user already exists
    existing = get_vpn_user(username)
    if 'error' not in existing and existing.get('username'):
        # User exists, send subscription link
        sub_url = f'{MARZBAN_URL}{existing.get("subscription_url", "")}'
        links = existing.get('links', [])

        text = '🔒 Ваш VPN доступ:\n\n'
        if links:
            text += f'Ссылка для подключения:\n{links[0]}\n\n'
        text += f'Подписка: {sub_url}\n\n'
        text += 'Используйте ссылку в приложении Happ Proxy Utility.'

        await message.answer(text)
        return

    # Create new user
    result = create_vpn_user(username)
    if 'error' in result:
        await message.answer('Ошибка создания VPN. Попробуйте позже.')
        return

    # Get subscription link
    user_info = get_vpn_user(username)
    sub_url = f'{MARZBAN_URL}{user_info.get("subscription_url", "")}'
    links = user_info.get('links', [])

    text = '✅ VPN создан!\n\n'
    if links:
        text += f'Ссылка для подключения:\n{links[0]}\n\n'
    text += f'Подписка: {sub_url}\n\n'
    text += 'Используйте ссылку в приложении Happ Proxy Utility.'

    await message.answer(text)

@router.message(Command('vpnusers'))
async def cmd_vpnusers(message: Message):
    """List all VPN users (admin only)."""
    if message.chat.id != ADMIN_CHAT_ID:
        return

    users = get_vpn_users()
    if not users:
        await message.answer('Нет VPN пользователей.')
        return

    lines = ['VPN пользователи:\n']
    for u in users[:10]:
        status = '🟢' if u.get('status') == 'active' else '⚪'
        traffic = u.get('used_traffic', 0)
        traffic_mb = traffic // (1024 * 1024)
        lines.append(f'{status} {u["username"]} — {traffic_mb} МБ')

    await message.answer('\n'.join(lines))

@router.message(Command('vpnlink'))
async def cmd_vpnlink(message: Message):
    """Get VPN subscription link (admin only)."""
    if message.chat.id != ADMIN_CHAT_ID:
        return

    parts = message.text.split()
    if len(parts) < 2:
        await message.answer('Использование: /vpnlink <username>')
        return

    username = parts[1]
    user_info = get_vpn_user(username)
    if 'error' in user_info:
        await message.answer(f'Пользователь {username} не найден.')
        return

    sub_url = f'{MARZBAN_URL}{user_info.get("subscription_url", "")}'
    links = user_info.get('links', [])

    text = f'VPN для {username}:\n\n'
    if links:
        text += f'Ссылка: {links[0]}\n\n'
    text += f'Подписка: {sub_url}'

    await message.answer(text)

@router.message(Command('vpnreset'))
async def cmd_vpnreset(message: Message):
    """Reset VPN subscription link (admin only)."""
    if message.chat.id != ADMIN_CHAT_ID:
        return

    parts = message.text.split()
    if len(parts) < 2:
        await message.answer('Использование: /vpnreset <username>')
        return

    username = parts[1]
    result = reset_vpn_user(username)
    if 'error' in result:
        await message.answer(f'Ошибка: {result["error"]}')
        return

    await message.answer(f'Ссылка для {username} сброшена. Новая ссылка: /vpnlink {username}')

# ============ Support commands ============

@router.message(Command('list'))
async def cmd_list(message: Message):
    if message.chat.id != ADMIN_CHAT_ID:
        return

    tickets = supabase_get('support_tickets', 'status=neq.closed&order=updated_at.desc')
    if not tickets:
        await message.answer('Нет открытых обращений.')
        return

    lines = ['Открытые обращения:\n']
    for t in tickets[:10]:
        status = {'open': '🟢', 'in_progress': '🟡'}.get(t['status'], '⚪')
        lines.append(f'{status} #{t["id"]} — {t["subject"]}')
        lines.append(f'   user_id: {t["user_id"]}')

    await message.answer('\n'.join(lines))

@router.message(Command('reply'))
async def cmd_reply(message: Message):
    if message.chat.id != ADMIN_CHAT_ID:
        return

    parts = message.text.split(maxsplit=2)
    if len(parts) < 3:
        await message.answer('Использование: /reply <ticket_id> <сообщение>')
        return

    try:
        ticket_id = int(parts[1])
    except ValueError:
        await message.answer('Некорректный ID обращения.')
        return

    msg_text = parts[2]

    try:
        tickets = supabase_get('support_tickets', f'id=eq.{ticket_id}')
        if not tickets:
            await message.answer(f'Обращение #{ticket_id} не найдено.')
            return

        ticket = tickets[0]

        supabase_insert('support_messages', {
            'ticket_id': ticket_id,
            'sender': 'admin',
            'message': msg_text,
            'telegram_id': 0,
        })

        supabase_update('support_tickets', {'status': 'in_progress'}, f'id=eq.{ticket_id}')

        user = get_user_info(ticket['user_id'])
        username = user.get('username', 'unknown')

        await message.answer(
            f'Ответ отправлен на обращение #{ticket_id}\n'
            f'Пользователь: @{username}\n'
            f'Сообщение: {msg_text}'
        )

        active_ticket_by_admin[message.chat.id] = ticket_id

    except Exception as e:
        logger.error(f'Reply error: {e}')
        await message.answer(f'Ошибка: {e}')

@router.message(Command('close'))
async def cmd_close(message: Message):
    if message.chat.id != ADMIN_CHAT_ID:
        return

    parts = message.text.split()
    if len(parts) < 2:
        await message.answer('Использование: /close <ticket_id>')
        return

    try:
        ticket_id = int(parts[1])
        supabase_update('support_tickets', {'status': 'closed'}, f'id=eq.{ticket_id}')
        await message.answer(f'Обращение #{ticket_id} закрыто.')
    except Exception as e:
        await message.answer(f'Ошибка: {e}')

@router.message(F.text)
async def handle_message(message: Message):
    if message.chat.id == ADMIN_CHAT_ID:
        ticket_id = active_ticket_by_admin.get(message.chat.id)
        if not ticket_id:
            await message.answer('Нет активного обращения. /list')
            return

        try:
            supabase_insert('support_messages', {
                'ticket_id': ticket_id,
                'sender': 'admin',
                'message': message.text,
                'telegram_id': 0,
            })
            supabase_update('support_tickets', {'status': 'in_progress'}, f'id=eq.{ticket_id}')

            tickets = supabase_get('support_tickets', f'id=eq.{ticket_id}')
            user = get_user_info(tickets[0]['user_id']) if tickets else {}
            username = user.get('username', 'unknown')

            await message.answer(f'Отправлено в #{ticket_id} (@{username})')
        except Exception as e:
            logger.error(f'Message error: {e}')
            await message.answer(f'Ошибка: {e}')
        return

    # User messages
    try:
        user = get_user_info(message.chat.id)
        user_id = user.get('id', 0) if user else 0

        if not user_id:
            users = supabase_get('users', f'telegram_id=eq.{message.chat.id}&select=id')
            user_id = users[0]['id'] if users else 0

        if not user_id:
            await message.answer('Пожалуйста, откройте приложение в Telegram для регистрации.')
            return

        ticket = supabase_insert('support_tickets', {
            'user_id': user_id,
            'subject': message.text[:50] + ('...' if len(message.text) > 50 else ''),
        })

        supabase_insert('support_messages', {
            'ticket_id': ticket['id'],
            'sender': 'user',
            'message': message.text,
            'telegram_id': message.chat.id,
        })

        username = user.get('username', 'unknown')
        first_name = user.get('first_name', '')
        await message.answer(
            '✅ Обращение создано!\n\n'
            'Мы ответим вам в ближайшее время.\n'
            'Также вы можете написать через приложение.'
        )

        try:
            admin_text = (
                f'Новое обращение #{ticket["id"]}\n'
                f'Пользователь: {first_name} (@{username})\n'
                f'TG ID: {message.chat.id}\n\n'
                f'"{message.text}"\n\n'
                f'Ответить: /reply {ticket["id"]} <текст>'
            )
            bot = message.bot
            await bot.send_message(chat_id=ADMIN_CHAT_ID, text=admin_text)
            active_ticket_by_admin[ADMIN_CHAT_ID] = ticket['id']
        except Exception as e:
            logger.error(f'Admin notify error: {e}')

    except Exception as e:
        logger.error(f'User message error: {e}')
        await message.answer('Произошла ошибка. Попробуйте позже.')


async def poll_new_messages(bot: Bot):
    """Poll Supabase for new user messages and notify admin."""
    last_check_id = 0

    while True:
        try:
            messages = supabase_get(
                'support_messages',
                'sender=eq.user&is_read=is.false&id=gt.{0}&order=id.asc&limit=10'.format(last_check_id)
            )

            for msg in messages:
                last_check_id = max(last_check_id, msg['id'])

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

                supabase_update('support_messages', {'is_read': True}, f'id=eq.{msg["id"]}')

        except Exception as e:
            logger.error(f'Poll error: {e}')

        await asyncio.sleep(POLL_INTERVAL)


async def main():
    if not BOT_TOKEN:
        logger.error('SUPPORT_BOT_TOKEN not set!')
        return
    if not SUPABASE_KEY:
        logger.error('SUPABASE_SERVICE_KEY not set!')
        return
    if not ADMIN_CHAT_ID:
        logger.error('ADMIN_CHAT_ID not set!')
        return

    # Get Marzban token on startup
    get_marzban_token()

    # Disable proxy env vars for httpx
    for var in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'all_proxy', 'SOCKS_PROXY']:
        os.environ.pop(var, None)

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)

    asyncio.create_task(poll_new_messages(bot))

    logger.info('GigantVPN bot started!')
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())
