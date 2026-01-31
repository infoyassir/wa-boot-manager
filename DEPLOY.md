# Guide de Déploiement VPS

## Configuration des Variables d'Environnement

### Backend (.env)
```bash
PORT=3031
NODE_ENV=production
VPS_IP=38.242.233.32  # Votre IP VPS
FRONTEND_URL=http://38.242.233.32:3030
SESSIONS_PATH=./sessions
DB_PATH=./data/db.json
API_KEY=votre_cle_api_securisee
```

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=http://38.242.233.32:3031  # IP de votre VPS
NEXT_PUBLIC_SOCKET_URL=http://38.242.233.32:3031
PORT=3030
```

## Déploiement sur VPS

### 1. Cloner le repository
```bash
cd /var/www  # ou votre répertoire préféré
git clone https://github.com/infoyassir/wa-boot-manager.git
cd wa-boot-manager
```

### 2. Configuration Backend
```bash
cd backend
cp .env.production .env
# Modifiez .env avec vos valeurs
nano .env

# Installer les dépendances
npm install

# Démarrer en mode production
npm start
# OU avec PM2 (recommandé)
pm2 start src/index.js --name whatsapp-backend
pm2 save
```

### 3. Configuration Frontend
```bash
cd ../frontend
cp .env.production .env.local
# Modifiez .env.local avec vos valeurs
nano .env.local

# Installer les dépendances
npm install

# Build production
npm run build

# Démarrer
npm start
# OU avec PM2 (recommandé)
pm2 start npm --name whatsapp-frontend -- start
pm2 save
```

## Résolution des Problèmes CORS

Le backend est configuré pour accepter:
- Les requêtes depuis localhost (développement)
- Les requêtes depuis votre IP VPS
- Les requêtes depuis n'importe quelle IP (pattern: http://X.X.X.X:PORT)

Si vous avez encore des problèmes CORS:

1. **Vérifiez que les URLs correspondent:**
   - Frontend `.env.local` doit pointer vers l'IP du backend
   - Backend `.env` doit avoir `VPS_IP` correctement configuré

2. **Redémarrez les services:**
   ```bash
   pm2 restart all
   ```

3. **Vérifiez les logs:**
   ```bash
   pm2 logs whatsapp-backend
   pm2 logs whatsapp-frontend
   ```

## Utilisation avec Nginx (Optionnel)

Pour utiliser un nom de domaine au lieu de l'IP:

```nginx
# /etc/nginx/sites-available/whatsapp-bot
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3031;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3031;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Puis:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Sécurité

1. **Activez le pare-feu:**
   ```bash
   sudo ufw allow 3030/tcp
   sudo ufw allow 3031/tcp
   sudo ufw enable
   ```

2. **Utilisez HTTPS en production** (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d votre-domaine.com
   ```

3. **Configurez API_KEY** dans le backend `.env`

4. **Limitez les origines CORS** en production si nécessaire

## Mise à jour

```bash
cd /var/www/wa-boot-manager
git pull origin main
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart all
```

## Ports Utilisés

| Service | Port | Description |
|---------|------|-------------|
| Backend | 3031 | API WhatsApp + Socket.IO |
| Frontend | 3030 | Interface Web Next.js |
| CORS Proxy | 8080 | Proxy pour Flutter (si nécessaire) |

## Support

En cas de problème:
1. Vérifiez les logs: `pm2 logs`
2. Vérifiez les processus: `pm2 status`
3. Testez les endpoints: `curl http://localhost:3031/api/sessions`
