#!/bin/bash

echo "🚀 Démarrage Backend WhatsApp Bot Manager sur VPS"
echo "================================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Copie depuis .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Fichier .env créé"
        echo ""
        echo "⚠️  IMPORTANT: Éditez le fichier .env et configurez:"
        echo "   - HOST=0.0.0.0"
        echo "   - PORT=3031"
        echo "   - VPS_IP=<votre_ip_publique>"
        echo ""
        echo "Exécutez: nano .env"
        exit 1
    else
        echo "❌ .env.example non trouvé!"
        exit 1
    fi
fi

# Verify HOST is 0.0.0.0
if ! grep -q "HOST=0.0.0.0" .env; then
    echo "⚠️  HOST n'est pas configuré à 0.0.0.0 dans .env"
    echo "   Configuration actuelle: $(grep HOST .env || echo 'non défini')"
    echo ""
    read -p "Voulez-vous que je le corrige automatiquement? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        if grep -q "^HOST=" .env; then
            sed -i 's/^HOST=.*/HOST=0.0.0.0/' .env
        else
            echo "HOST=0.0.0.0" >> .env
        fi
        echo "✅ HOST configuré à 0.0.0.0"
    else
        echo "❌ Veuillez configurer HOST=0.0.0.0 dans .env manuellement"
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Stop existing PM2 process
echo "🛑 Arrêt des processus existants..."
pm2 stop whatsapp-backend 2>/dev/null || true
pm2 delete whatsapp-backend 2>/dev/null || true

# Start with PM2
echo "🚀 Démarrage du backend avec PM2..."
pm2 start npm --name "whatsapp-backend" -- start

# Save PM2 configuration
pm2 save

# Show status
echo ""
echo "✅ Backend démarré!"
echo ""
pm2 status

echo ""
echo "📋 Commandes utiles:"
echo "  - Voir les logs:      pm2 logs whatsapp-backend"
echo "  - Redémarrer:         pm2 restart whatsapp-backend"
echo "  - Arrêter:            pm2 stop whatsapp-backend"
echo "  - Voir le statut:     pm2 status"
echo ""
echo "🔍 Vérifiez que le serveur écoute sur 0.0.0.0:3031:"
echo "  sudo netstat -tulpn | grep 3031"
echo ""
