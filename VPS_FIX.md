# Correction Urgente pour VPS

## Problème Identifié
Le frontend utilise encore `localhost:3031` au lieu de `38.242.233.32:3031`.

## Solution : Sur votre VPS, exécutez ces commandes

### 1. Vérifier la configuration actuelle
```bash
cd /var/www/wa-bot-manager/frontend
cat .env.local
# Doit afficher: NEXT_PUBLIC_API_URL=http://38.242.233.32:3031
```

### 2. Créer/Corriger le fichier .env.local
```bash
cd /var/www/wa-bot-manager/frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://38.242.233.32:3031
NEXT_PUBLIC_SOCKET_URL=http://38.242.233.32:3031
PORT=3030
EOF
```

### 3. Vérifier le backend
```bash
cd /var/www/wa-bot-manager/backend
cat > .env << 'EOF'
PORT=3031
HOST=0.0.0.0
NODE_ENV=production
VPS_IP=38.242.233.32
FRONTEND_URL=http://38.242.233.32:3030
SESSIONS_PATH=./sessions
DB_PATH=./data/db.json
EOF
```

### 4. IMPORTANT : Rebuild le frontend
```bash
cd /var/www/wa-bot-manager/frontend

# Supprimer le cache Next.js
rm -rf .next

# Rebuild avec les nouvelles variables
npm run build
```

### 5. Redémarrer les services
```bash
# Backend
cd /var/www/wa-bot-manager/backend
pm2 restart whatsapp-backend

# Frontend  
cd /var/www/wa-bot-manager/frontend
pm2 restart whatsapp-frontend

# Ou si vous n'utilisez pas PM2:
pm2 delete whatsapp-backend whatsapp-frontend 2>/dev/null || true
cd /var/www/wa-bot-manager/backend
pm2 start src/index.js --name whatsapp-backend

cd /var/www/wa-bot-manager/frontend
pm2 start npm --name whatsapp-frontend -- start

pm2 save
```

### 6. Vérifier les logs
```bash
pm2 logs whatsapp-backend --lines 20
pm2 logs whatsapp-frontend --lines 20
```

### 7. Tester
```bash
# Backend doit répondre
curl http://38.242.233.32:3031/health

# Doit afficher: {"status":"ok","timestamp":"..."}

# Sessions doit répondre
curl http://38.242.233.32:3031/api/sessions

# Doit afficher: {"data":[], ...}
```

### 8. Ouvrir dans le navigateur
```
http://38.242.233.32:3030/sessions
```

## Pourquoi le rebuild est nécessaire

Next.js inclut les variables `NEXT_PUBLIC_*` **au moment du build**. Si vous changez `.env.local` après le build, il faut **rebuilder** :

```bash
cd frontend
rm -rf .next
npm run build
pm2 restart whatsapp-frontend
```

## Si ça ne marche toujours pas

### Option 1 : Forcer les variables en ligne de commande
```bash
cd /var/www/wa-bot-manager/frontend
pm2 delete whatsapp-frontend
NEXT_PUBLIC_API_URL=http://38.242.233.32:3031 NEXT_PUBLIC_SOCKET_URL=http://38.242.233.32:3031 npm run build
pm2 start npm --name whatsapp-frontend -- start
pm2 save
```

### Option 2 : Vérifier que le firewall autorise les ports
```bash
sudo ufw status
sudo ufw allow 3030/tcp
sudo ufw allow 3031/tcp
```

### Option 3 : Vérifier que les services écoutent
```bash
netstat -tlnp | grep 3030
netstat -tlnp | grep 3031
# Ou
ss -tlnp | grep 3030
ss -tlnp | grep 3031
```

## Résultat attendu

Après ces étapes, dans la console du navigateur, vous ne devriez PLUS voir :
```
❌ Access to XMLHttpRequest at 'http://localhost:3031/api/sessions'
```

Mais plutôt :
```
✅ Requête réussie vers http://38.242.233.32:3031/api/sessions
```
