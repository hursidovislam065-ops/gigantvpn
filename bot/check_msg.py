import os, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
import requests

key = os.getenv('SUPABASE_SERVICE_KEY')
url = os.getenv('SUPABASE_URL')
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

r = requests.get(f'{url}/rest/v1/support_messages?select=id,is_read&order=id.desc&limit=1', headers=headers, timeout=10)
data = r.json()
if data:
    msg = data[0]
    mid = msg['id']
    read = msg['is_read']
    print(f'Message #{mid} is_read: {read}')
    if read:
        print('Bot picked up the message!')
    else:
        print('Bot has NOT picked up the message yet')
else:
    print('No messages found')
