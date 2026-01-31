# 🔌 Connexion Frontend Local → Backend VPS

Guide rapide pour utiliser le frontend en local avec le backend sur le VPS.

## ❌ Problème Actuel

Erreurs dans la console du navigateur :
```
GET http://38.242.233.32:3031/api/sessions net::ERR_CONNECTION_REFUSED
WebSocket connection to 'ws://38.242.233.32:3031/socket.io/' failed
```

## 🎯 Solution en 3 Étapes

### Étape 1: Configurer le Backend sur le VPS

**Connectez-vous au VPS:**
```bash
ssh root@38.242.233.32
cd /var/www/wa-bot-manager/backend
```

**Exécutez le diagnostic:**
```bash
./check-vps.sh
```

Ce script vérifie :
- ✅ Fichier .env existe avec HOST=0.0.0.0
- ✅ Port 3031 écoute sur toutes les interfaces
- ✅ Pare-feu autorise le port 3031
- ✅ PM2 gère le processus backend
- ✅ Backend répond aux requêtes

**Corrections automatiques avec:**
```bash
./start-vps.sh
```

### Étape 2: Ouvrir le Port dans le Pare-feu

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3031/tcp
sudo ufw status

# CentOS/RedHat (FirewallD)
sudo firewall-cmd --permanent --add-port=3031/tcp
sudo firewall-cmd --reload
```

### Étape 3: Vérifier HOST=0.0.0.0 dans .env

**Sur le VPS, éditez .env:**
```bash
nano /var/www/wa-bot-manager/backend/.env
```

**Configuration OBLIGATOIRE:**
```env
HOST=0.0.0.0
PORT=3031
VPS_IP=38.242.233.32
NODE_ENV=production
FRONTEND_URL=http://38.242.233.32:3030
```

**Redémarrez après modification:**
```bash
pm2 restart whatsapp-backend
pm2 logs whatsapp-backend --lines 20
```

**Vous devez voir:**
```
🚀 WhatsApp Bot Manager running on 0.0.0.0:3031
```

⚠️ **Si vous voyez 127.0.0.1:3031, le HOST n'est pas correctement configuré!**

## 🖥️ Configuration Frontend Local

**Sur votre machine locale:**

Créez/éditez `wa-bot-manager/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://38.242.233.32:3031
```

**Redémarrez le frontend:**
```bash
cd wa-bot-manager/frontend
npm run dev
```

## 🧪 Tests de Vérification

### Test 1: Depuis le VPS (connexion locale)
```bash
curl http://localhost:3031/api/sessions
# ou
curl http://38.242.233.32:3031/api/sessions
```

✅ **Résultat attendu:** 
- Code HTTP 200 avec liste de sessions
- OU Code HTTP 404 si aucune session
- ❌ Si timeout ou connection refused → backend pas démarré

### Test 2: Depuis votre machine locale
```bash
curl http://38.242.233.32:3031/api/sessions
```

✅ **Résultat attendu:** Même chose que Test 1
❌ **Si échec:**
- Connection refused → pare-feu bloque
- Timeout → problème réseau/routage

### Test 3: Vérifier que le port écoute sur 0.0.0.0

**Sur le VPS:**
```bash
sudo netstat -tulpn | grep 3031
# ou
sudo ss -tulpn | grep 3031
```

✅ **Résultat attendu:**
```
tcp   0   0 0.0.0.0:3031   0.0.0.0:*   LISTEN   12345/node
```

❌ **Si vous voyez:**
```
tcp   0   0 127.0.0.1:3031   0.0.0.0:*   LISTEN   12345/node
```
→ Le backend écoute seulement sur localhost! Changez HOST=0.0.0.0

## 🔍 Diagnostic des Erreurs

### ERR_CONNECTION_REFUSED

**Signification:** Impossible de se connecter au serveur

**Causes:**
1. Backend pas démarré → `pm2 start`
2. Pare-feu bloque → `sudo ufw allow 3031/tcp`
3. PORT mal configuré dans .env
4. Backend écoute sur 127.0.0.1 → Changez HOST=0.0.0.0

### WebSocket Failed

**Signification:** Socket.IO ne peut pas se connecter

**Solution:** Même que ERR_CONNECTION_REFUSED
- WebSocket utilise le même port (3031)
- Doit aussi être accessible depuis l'extérieur

### CORS Error (après connexion établie)

**Signification:** Backend répond mais refuse la requête

**Solution déjà implémentée:** 
- Backend accepte toutes les origines IP (X.X.X.X:PORT)
- Normalement ne devrait pas arriver

## 📋 Checklist Complète

Sur le **VPS** :
- [ ] Backend démarré avec PM2
- [ ] .env contient HOST=0.0.0.0
- [ ] Port 3031 ouvert dans le pare-feu
- [ ] `netstat` montre 0.0.0.0:3031 (et non 127.0.0.1:3031)
- [ ] `curl localhost:3031/api/sessions` fonctionne
- [ ] PM2 logs ne montrent pas d'erreurs

Sur votre **machine locale** :
- [ ] Frontend .env.local contient NEXT_PUBLIC_API_URL=http://38.242.233.32:3031
- [ ] Frontend redémarré après modification .env
- [ ] `curl http://38.242.233.32:3031/api/sessions` fonctionne
- [ ] Browser console ne montre pas ERR_CONNECTION_REFUSED

## 🚀 Script de Démarrage Rapide VPS

**Copiez ces scripts sur le VPS:**

```bash
# Sur votre machine locale
cd wa-bot-manager/backend
scp check-vps.sh start-vps.sh root@38.242.233.32:/var/www/wa-bot-manager/backend/

# Sur le VPS
ssh root@38.242.233.32
cd /var/www/wa-bot-manager/backend
chmod +x check-vps.sh start-vps.sh

# Diagnostic
./check-vps.sh

# Démarrage automatique
./start-vps.sh
```

## 📞 Support

Si après toutes ces étapes le problème persiste:

1. **Vérifiez les logs backend:**
   ```bash
   pm2 logs whatsapp-backend --lines 100
   ```

2. **Testez avec telnet:**
   ```bash
   # Depuis votre machine locale
   telnet 38.242.233.32 3031
   ```
   - Si connexion établie → problème applicatif
   - Si timeout → problème réseau/pare-feu

3. **Vérifiez la configuration réseau du VPS:**
   - Provider cloud (DigitalOcean, AWS, etc.) a parfois des pare-feux supplémentaires
   - Security Groups (AWS) ou Firewall (DigitalOcean) à vérifier dans le panel

## 📚 Documents Connexes

- [DEPLOY.md](../DEPLOY.md) - Guide de déploiement complet
- [VPS_FIX.md](../VPS_FIX.md) - Résolution problèmes variables d'environnement
- [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) - Guide de dépannage général
