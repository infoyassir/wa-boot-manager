# WhatsApp Bot Manager - Memory System Documentation

## Vue d'ensemble

Le système de mémoire fournit une base de données intelligente pour stocker les préférences, l'historique des clients, et permettre au bot d'apprendre.

## Architecture

### Backend Services

#### MemoryService (`src/services/MemoryService.js`)
Service principal de gestion de la mémoire avec:
- Gestion des clients et préférences
- Historique des conversations
- Apprentissage du bot (patterns et FAQs)
- Analytics et insights
- Auto-sauvegarde toutes les 30 secondes

#### SmartBotService (`src/services/SmartBotService.js`)
Bot intelligent avec:
- Détection d'intentions (salutations, questions de prix, livraison, etc.)
- Réponses basées sur FAQs
- Apprentissage de patterns
- Réponses contextuelles personnalisées
- Support multilingue

### API Endpoints

#### Memory API (`/api/memory`)

**Customers:**
- `GET /api/memory/customers` - Liste tous les clients (avec filtres optionnels)
- `GET /api/memory/customers/:phone` - Récupère un client
- `PUT /api/memory/customers/:phone` - Met à jour un client
- `POST /api/memory/customers/:phone/preferences` - Définit une préférence
- `POST /api/memory/customers/:phone/notes` - Ajoute une note
- `POST /api/memory/customers/:phone/orders` - Ajoute une commande
- `POST /api/memory/customers/:phone/tags` - Tag un client
- `DELETE /api/memory/customers/:phone/tags/:tag` - Retire un tag

**Conversations:**
- `GET /api/memory/conversations/:phone` - Historique de conversation
- `POST /api/memory/conversations/:phone/messages` - Stocke un message
- `POST /api/memory/conversations/:phone/context` - Définit le contexte
- `GET /api/memory/conversations/:phone/context` - Récupère le contexte

**Bot Memory:**
- `POST /api/memory/bot/learn` - Apprend un nouveau pattern
- `POST /api/memory/bot/ask` - Demande une réponse apprise
- `GET /api/memory/bot/faqs` - Liste les FAQs
- `POST /api/memory/bot/faqs` - Crée une FAQ
- `POST /api/memory/bot/faqs/search` - Recherche une réponse FAQ
- `GET /api/memory/bot/business` - Info entreprise
- `POST /api/memory/bot/business` - Définit info entreprise

**Preferences:**
- `GET /api/memory/preferences` - Toutes les préférences
- `GET /api/memory/preferences/:category` - Préférences d'une catégorie
- `POST /api/memory/preferences/:category` - Définit plusieurs préférences
- `PUT /api/memory/preferences/:category/:key` - Définit une préférence

**Analytics:**
- `GET /api/memory/analytics` - Résumé des analytics

**Data Management:**
- `GET /api/memory/export` - Export toutes les données
- `POST /api/memory/import` - Import des données
- `POST /api/memory/save` - Force la sauvegarde

#### Bot API (`/api/bot`)

- `GET /api/bot/status` - Statut du bot (activé, nombre de FAQs, etc.)
- `POST /api/bot/enable` - Active le bot
- `POST /api/bot/disable` - Désactive le bot
- `POST /api/bot/train` - Entraîne le bot avec un nouveau pattern
- `POST /api/bot/faq` - Ajoute une FAQ
- `POST /api/bot/business-info` - Définit les infos business
- `POST /api/bot/test` - Teste une réponse du bot
- `POST /api/bot/setup` - Configuration rapide du bot

## Utilisation

### Configuration initiale du bot

```bash
curl -X POST http://localhost:3001/api/bot/setup \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Ma Boutique",
    "address": "123 Rue du Commerce, Casablanca",
    "hours": "Lun-Sam: 9h-19h",
    "phone": "+212 6XX XXXXXX",
    "email": "contact@boutique.ma",
    "faqs": [
      {
        "question": "Comment payer?",
        "answer": "Nous acceptons espèces, carte et mobile.",
        "keywords": ["payer", "paiement", "carte"]
      }
    ]
  }'
```

### Gestion des clients

```bash
# Créer/récupérer un client
curl http://localhost:3001/api/memory/customers/212XXXXXXXXX

# Mettre à jour un client
curl -X PUT http://localhost:3001/api/memory/customers/212XXXXXXXXX \
  -H "Content-Type: application/json" \
  -d '{"name": "Jean Dupont", "isVIP": true, "loyaltyPoints": 100}'

# Tagger un client
curl -X POST http://localhost:3001/api/memory/customers/212XXXXXXXXX/tags \
  -H "Content-Type: application/json" \
  -d '{"tag": "client-fidele"}'
```

### Entraîner le bot

```bash
# Apprendre un pattern
curl -X POST http://localhost:3001/api/memory/bot/learn \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "promo",
    "response": "Nous avons des promos tous les vendredis!",
    "category": "marketing"
  }'

# Ajouter une FAQ
curl -X POST http://localhost:3001/api/memory/bot/faqs \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Livraison disponible?",
    "answer": "Oui! Livraison à Casablanca en 24-48h.",
    "keywords": ["livraison", "livrer", "expédition"]
  }'
```

### Préférences d'application

```bash
# Définir des préférences POS
curl -X POST http://localhost:3001/api/memory/preferences/pos \
  -H "Content-Type: application/json" \
  -d '{
    "defaultPrinter": "EPSON-TM88",
    "currency": "MAD",
    "taxRate": 20
  }'

# Récupérer les préférences
curl http://localhost:3001/api/memory/preferences/pos
```

## Structure des données

### Customer Object
```json
{
  "id": "uuid",
  "phone": "212XXXXXXXXX",
  "name": "Client Name",
  "email": "client@example.com",
  "tags": ["vip", "fidele"],
  "preferences": {
    "language": "fr",
    "notifications": true
  },
  "notes": [],
  "orderHistory": [],
  "messageCount": 42,
  "lastContact": "2026-01-31T01:00:00Z",
  "firstContact": "2025-12-01T10:00:00Z",
  "language": "fr",
  "timezone": "Africa/Casablanca",
  "isVIP": true,
  "loyaltyPoints": 150,
  "metadata": {}
}
```

### FAQ Object
```json
{
  "id": "uuid",
  "question": "Comment payer?",
  "answer": "Nous acceptons...",
  "keywords": ["payer", "paiement"],
  "usageCount": 5,
  "createdAt": "2026-01-31T00:00:00Z"
}
```

### Analytics Object
```json
{
  "totalMessages": 1234,
  "totalCustomers": 156,
  "activeCustomers": 45,
  "vipCustomers": 12,
  "averageMessagesPerCustomer": 7,
  "topTags": [
    {"tag": "fidele", "count": 23}
  ],
  "recentActivity": []
}
```

## Intégration Flutter

Le service Flutter (`memory_service.dart`) et le provider (`memory_provider.dart`) sont disponibles pour l'intégration avec l'application POS.

```dart
// Initialiser
final memoryProvider = Provider.of<MemoryProvider>(context);
await memoryProvider.init();

// Récupérer un client
final customer = await memoryProvider.getCustomer('212XXXXXXXXX');

// Mettre à jour
await memoryProvider.updateCustomer('212XXXXXXXXX', 
  name: 'Jean', isVIP: true);

// Obtenir une réponse intelligente
final response = await memoryProvider.getSmartResponse('Bonjour');
```

## Fichiers de données

Les données sont stockées dans:
- `backend/data/memory.json` - Base de données principale (auto-sauvegarde)

## Sécurité

- API protégée par clé API (X-API-Key header)
- Validation des entrées
- Normalisation automatique des numéros de téléphone
- Sauvegarde automatique toutes les 30 secondes

## Performance

- Cache local pour support offline (Flutter)
- Limite de 100 messages par conversation
- Index sur téléphone client
- Recherche optimisée pour FAQs

## Maintenance

### Export/Import de données
```bash
# Export
curl http://localhost:3001/api/memory/export > backup.json

# Import
curl -X POST http://localhost:3001/api/memory/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

### Forcer la sauvegarde
```bash
curl -X POST http://localhost:3001/api/memory/save
```

## Exemples d'intents détectés

- **greeting**: Bonjour, Salut, Hello, Salam
- **priceInquiry**: Prix, combien, coût, tarif
- **orderStatus**: Commande, livraison, suivi
- **productInquiry**: Produit, disponible, stock
- **hours**: Horaire, ouvert, fermé
- **location**: Adresse, où êtes-vous
- **thanks**: Merci, thanks
- **goodbye**: Au revoir, bye
- **help**: Aide, assistance, support
- **complaint**: Plainte, réclamation, problème
