import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('78.17.9.37', username='root', password='b2I3ixO98uHtRV24aU', timeout=30)

# Check Marzban logs
stdin, stdout, stderr = ssh.exec_command('docker logs marzban-marzban-1 --tail 50', timeout=30)
print('Marzban logs:')
print(stdout.read().decode()[-2000:])

# Check if there's a marzban.json config
stdin, stdout, stderr = ssh.exec_command('ls -la /var/lib/marzban/ && cat /var/lib/marzban/marzban.json 2>/dev/null || echo "No marzban.json"', timeout=10)
print('Config files:')
print(stdout.read().decode())

ssh.close()
