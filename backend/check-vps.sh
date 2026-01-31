#!/bin/bash

echo "🔍 Diagnostic Backend VPS - WhatsApp Bot Manager"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if .env exists
echo "1️⃣  Vérification fichier .env..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} Fichier .env trouvé"
    
    # Check critical variables
    if grep -q "HOST=0.0.0.0" .env; then
        echo -e "${GREEN}✓${NC} HOST=0.0.0.0 configuré"
    else
        echo -e "${RED}✗${NC} HOST doit être 0.0.0.0 (actuellement: $(grep HOST .env || echo 'non défini'))"
    fi
    
    if grep -q "PORT=3031" .env; then
        echo -e "${GREEN}✓${NC} PORT=3031 configuré"
    else
        echo -e "${YELLOW}⚠${NC} PORT devrait être 3031 (actuellement: $(grep PORT .env || echo 'non défini'))"
    fi
else
    echo -e "${RED}✗${NC} Fichier .env non trouvé!"
    echo "   Créez-le avec: cp .env.example .env"
fi

echo ""

# 2. Check if port is listening
echo "2️⃣  Vérification port 3031..."
if command -v ss &> /dev/null; then
    PORT_CHECK=$(ss -tulpn 2>/dev/null | grep :3031)
elif command -v netstat &> /dev/null; then
    PORT_CHECK=$(netstat -tulpn 2>/dev/null | grep :3031)
else
    PORT_CHECK=""
fi

if [ ! -z "$PORT_CHECK" ]; then
    echo -e "${GREEN}✓${NC} Port 3031 en écoute:"
    echo "$PORT_CHECK"
    
    if echo "$PORT_CHECK" | grep -q "0.0.0.0:3031"; then
        echo -e "${GREEN}✓${NC} Écoute sur toutes les interfaces (0.0.0.0)"
    elif echo "$PORT_CHECK" | grep -q "127.0.0.1:3031"; then
        echo -e "${RED}✗${NC} Écoute seulement sur localhost! Changez HOST=0.0.0.0 dans .env"
    fi
else
    echo -e "${RED}✗${NC} Port 3031 n'est pas en écoute"
    echo "   Le backend n'est probablement pas démarré"
fi

echo ""

# 3. Check firewall
echo "3️⃣  Vérification pare-feu..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | grep 3031)
    if [ ! -z "$UFW_STATUS" ]; then
        echo -e "${GREEN}✓${NC} UFW autorise le port 3031:"
        echo "$UFW_STATUS"
    else
        echo -e "${YELLOW}⚠${NC} Port 3031 non autorisé dans UFW"
        echo "   Exécutez: sudo ufw allow 3031/tcp"
    fi
elif command -v firewall-cmd &> /dev/null; then
    FIREWALLD_STATUS=$(sudo firewall-cmd --list-ports 2>/dev/null | grep 3031)
    if [ ! -z "$FIREWALLD_STATUS" ]; then
        echo -e "${GREEN}✓${NC} FirewallD autorise le port 3031"
    else
        echo -e "${YELLOW}⚠${NC} Port 3031 non autorisé dans FirewallD"
        echo "   Exécutez: sudo firewall-cmd --permanent --add-port=3031/tcp && sudo firewall-cmd --reload"
    fi
else
    echo -e "${YELLOW}⚠${NC} Aucun pare-feu détecté (ufw/firewalld)"
fi

echo ""

# 4. Check PM2
echo "4️⃣  Vérification PM2..."
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*backend[^"]*"' | head -1)
    if [ ! -z "$PM2_STATUS" ]; then
        echo -e "${GREEN}✓${NC} PM2 détecté avec processus backend"
        pm2 list | grep backend
    else
        echo -e "${YELLOW}⚠${NC} Aucun processus backend dans PM2"
        echo "   Démarrez avec: pm2 start npm --name 'whatsapp-backend' -- start"
    fi
else
    echo -e "${RED}✗${NC} PM2 non installé"
    echo "   Installez avec: npm install -g pm2"
fi

echo ""

# 5. Test local connection
echo "5️⃣  Test connexion locale..."
if command -v curl &> /dev/null; then
    HTTP_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3031/api/sessions 2>/dev/null)
    if [ "$HTTP_TEST" = "200" ] || [ "$HTTP_TEST" = "401" ] || [ "$HTTP_TEST" = "404" ]; then
        echo -e "${GREEN}✓${NC} Backend répond en local (HTTP $HTTP_TEST)"
    else
        echo -e "${RED}✗${NC} Backend ne répond pas (HTTP $HTTP_TEST)"
    fi
else
    echo -e "${YELLOW}⚠${NC} curl non disponible pour tester"
fi

echo ""

# 6. Get public IP
echo "6️⃣  Adresse IP publique..."
if command -v curl &> /dev/null; then
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null)
    if [ ! -z "$PUBLIC_IP" ]; then
        echo -e "${GREEN}✓${NC} IP publique: $PUBLIC_IP"
        echo "   Testez depuis votre machine: curl http://$PUBLIC_IP:3031/api/sessions"
    else
        echo -e "${YELLOW}⚠${NC} Impossible de déterminer l'IP publique"
    fi
fi

echo ""
echo "================================================"
echo "📋 Résumé des commandes utiles:"
echo ""
echo "# Voir les logs:"
echo "pm2 logs whatsapp-backend --lines 50"
echo ""
echo "# Redémarrer le backend:"
echo "pm2 restart whatsapp-backend"
echo ""
echo "# Ouvrir le port dans le pare-feu:"
echo "sudo ufw allow 3031/tcp"
echo ""
echo "# Tester depuis une autre machine:"
echo "curl http://$(curl -s ifconfig.me):3031/api/sessions"
echo ""
