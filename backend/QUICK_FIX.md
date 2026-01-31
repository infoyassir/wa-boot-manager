# 🚨 SOLUTION RAPIDE - ERR_CONNECTION_REFUSED

## Le Problème
Votre frontend local ne peut pas se connecter au backend sur le VPS (38.242.233.32:3031).

## La Cause Probable
Le backend sur le VPS écoute sur `127.0.0.1:3031` au lieu de `0.0.0.0:3031`, donc il n'accepte que les connexions locales.

## Solution en 5 Minutes

### 1️⃣ Connectez-vous au VPS
```bash
ssh root@38.242.233.32
cd /var/www/wa-bot-manager/backend
```

### 2️⃣ Uploadez et exécutez le script de diagnostic
```bash
# Depuis votre machine locale, uploadez les scripts
cd ~/CascadeProjects/Whatsapp/wa-bot-manager/backend
scp check-vps.sh start-vps.sh root@38.242.233.32:/var/www/wa-bot-manager/backend/

# Sur le VPS, exécutez le diagnostic
ssh root@38.242.233.32
cd /var/www/wa-bot-manager/backend
chmod +x check-vps.sh start-vps.sh
./check-vps.sh
```

### 3️⃣ Vérifiez/Corrigez le fichier .env sur le VPS
```bash
nano .env
```

**Assurez-vous d'avoir:**
```env
HOST=0.0.0.0
PORT=3031
VPS_IP=38.242.233.32
NODE_ENV=production
```

### 4️⃣ Ouvrez le port dans le pare-feu
```bash
sudo ufw allow 3031/tcp
sudo ufw status
```

### 5️⃣ Redémarrez le backend
```bash
pm2 restart whatsapp-backend
pm2 logs whatsapp-backend --lines 20
```

**Vous DEVEZ voir:**
```
🚀 WhatsApp Bot Manager running on 0.0.0.0:3031
```

### 6️⃣ Testez depuis le VPS
```bash
curl http://localhost:3031/api/sessions
```

Si ça fonctionne, testez depuis votre machine:
```bash
curl http://38.242.233.32:3031/api/sessions
```

## ✅ Si tout fonctionne

Votre frontend local devrait maintenant se connecter! Rafraîchissez la page.

## ❌ Si ça ne fonctionne toujours pas

Vérifiez:
1. `sudo netstat -tulpn | grep 3031` → doit montrer `0.0.0.0:3031`
2. `pm2 logs whatsapp-backend --err` → cherchez les erreurs
3. Votre provider cloud (DigitalOcean, AWS) a peut-être un pare-feu supplémentaire à configurer

## 📖 Documentation Complète

- [VPS_CONNECTION.md](./VPS_CONNECTION.md) - Guide complet avec tous les détails
- [check-vps.sh](./check-vps.sh) - Script de diagnostic automatique
- [start-vps.sh](./start-vps.sh) - Script de démarrage avec vérifications
