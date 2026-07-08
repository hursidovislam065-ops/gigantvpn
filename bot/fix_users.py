import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('78.17.9.37', username='root', password='b2I3ixO98uHtRV24aU', timeout=30)

# Get fresh token
stdin, stdout, stderr = ssh.exec_command('curl -sk -X POST https://localhost/api/admin/token -H "Content-Type: application/x-www-form-urlencoded" -d "username=admin&password=admin123" | python3 -c "import sys,json; print(json.load(sys.stdin)[\"access_token\"])"', timeout=15)
token = stdout.read().decode().strip()
print(f"Token obtained")

# Delete all users
script = f'''#!/bin/bash
TOKEN="{token}"

# Get user list
echo "=== Getting users ==="
USERS=$(curl -sk -H "Authorization: Bearer $TOKEN" https://localhost/api/users 2>/dev/null | python3 -c "import sys; print('')" 2>/dev/null)

# Delete each user
for user in dict_user user1 user2 test_vless test_user dash_user final_user; do
    echo "Deleting $user..."
    curl -sk -X DELETE "https://localhost/api/user/$user" -H "Authorization: Bearer $TOKEN" -w " HTTP:%{{http_code}}\\n" 2>/dev/null
done

echo ""
echo "=== Create new user with Reality ==="
curl -sk -X POST https://localhost/api/user \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{{"username":"vpn_user","data_limit":1073741824,"expire":0,"proxies":{{"vless":{{}}}},"inbounds":{{"vless":["VLESS Reality"]}}}}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('Created:', d.get('username'))
print('Link:', d.get('links',[''])[0][:120])
print('Sub:', d.get('subscription_url'))
"

echo ""
echo "=== Check ports ==="
ss -tlnp | grep -E "443|8080|1080"
'''

sftp = ssh.open_sftp()
with sftp.file('/tmp/fix_users.sh', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('chmod +x /tmp/fix_users.sh && bash /tmp/fix_users.sh', timeout=60)
print(stdout.read().decode()[:3000])

ssh.close()
