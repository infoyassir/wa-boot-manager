# WhatsApp Bot Manager

Un gestionnaire de bots WhatsApp complet utilisant **whatsapp-web.js 1.34.6** avec un backend Node.js/Express et un frontend Next.js moderne.

![WhatsApp Bot Manager](https://img.shields.io/badge/WhatsApp-Bot%20Manager-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

## 🚀 Fonctionnalités

- **Multi-sessions WhatsApp** - Gérez plusieurs comptes WhatsApp simultanément
- **QR Code Authentication** - Connexion sécurisée via QR code
- **Auto-réponses intelligentes** - Réponses automatiques basées sur des règles (exact, contient, regex, etc.)
- **Messages planifiés** - Programmez des messages ponctuels ou récurrents (cron)
- **Templates de messages** - Créez des modèles réutilisables avec variables
- **Gestion des contacts** - Import/export et organisation de vos contacts
- **Envoi de médias** - Images, vidéos, documents, audio, localisation
- **Interface moderne** - Dashboard React avec Tailwind CSS et shadcn/ui

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Chrome/Chromium (pour whatsapp-web.js)

## 🛠️ Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/wa-bot-manager.git
cd wa-bot-manager
```

### 2. Installer le Backend

```bash
cd backend
npm install
```

### 3. Installer le Frontend

```bash
cd ../frontend
npm install
```

### 4. Configuration

Créez un fichier `.env` dans le dossier `backend`:

```env
PORT=3001
API_KEY=votre-cle-api-secrete
```

Modifiez `frontend/src/lib/config.ts` si nécessaire:

```typescript
export const API_URL = 'http://localhost:3001';
export const SOCKET_URL = 'http://localhost:3001';
export const API_KEY = 'votre-cle-api-secrete';
```

## 🚀 Démarrage

### Backend

```bash
cd backend
npm start
```

Le serveur démarre sur http://localhost:3001

### Frontend

```bash
cd frontend
npm run dev
```

L'application démarre sur http://localhost:3000

## 📚 API Endpoints

### Sessions

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sessions` | Liste toutes les sessions |
| POST | `/api/sessions` | Créer une nouvelle session |
| GET | `/api/sessions/:id` | Détails d'une session |
| DELETE | `/api/sessions/:id` | Supprimer une session |
| GET | `/api/sessions/:id/qr` | Obtenir le QR code |

### Messages

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/messages/:sessionId/send/text` | Envoyer un texte |
| POST | `/api/messages/:sessionId/send/image` | Envoyer une image |
| POST | `/api/messages/:sessionId/send/video` | Envoyer une vidéo |
| POST | `/api/messages/:sessionId/send/document` | Envoyer un document |
| GET | `/api/messages/:sessionId/chats` | Liste des conversations |
| GET | `/api/messages/:sessionId/messages/:chatId` | Messages d'une conversation |

### Auto-réponses

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/auto-responders/:sessionId` | Liste des règles |
| POST | `/api/auto-responders/:sessionId` | Créer une règle |
| PUT | `/api/auto-responders/:sessionId/:id` | Modifier une règle |
| DELETE | `/api/auto-responders/:sessionId/:id` | Supprimer une règle |

### Messages Planifiés

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/scheduled/:sessionId` | Liste des messages planifiés |
| POST | `/api/scheduled/:sessionId` | Planifier un message |
| PUT | `/api/scheduled/:sessionId/:id` | Modifier un message planifié |
| DELETE | `/api/scheduled/:sessionId/:id` | Supprimer un message planifié |

### Templates

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/templates` | Liste des templates |
| POST | `/api/templates` | Créer un template |
| PUT | `/api/templates/:id` | Modifier un template |
| DELETE | `/api/templates/:id` | Supprimer un template |

### Contacts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/contacts` | Liste des contacts |
| POST | `/api/contacts` | Ajouter un contact |
| PUT | `/api/contacts/:id` | Modifier un contact |
| DELETE | `/api/contacts/:id` | Supprimer un contact |
| GET | `/api/contacts/export` | Exporter les contacts |
| POST | `/api/contacts/import` | Importer des contacts |

## 🔧 Variables de Templates

Utilisez ces variables dans vos templates et auto-réponses:

- `{name}` - Nom du contact
- `{phone}` - Numéro de téléphone
- `{message}` - Message reçu
- `{time}` - Heure actuelle
- `{date}` - Date actuelle

## 🎯 Types de correspondance Auto-réponse

| Type | Description | Exemple |
|------|-------------|---------|
| `exact` | Correspondance exacte | "bonjour" = "bonjour" |
| `contains` | Contient le texte | "aide" dans "j'ai besoin d'aide" |
| `startsWith` | Commence par | "Salut" dans "Salut comment vas-tu" |
| `endsWith` | Termine par | "?" dans "Comment ça va?" |
| `regex` | Expression régulière | `/prix.*produit/i` |

## 📁 Structure du Projet

```
wa-bot-manager/
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js           # Serveur Express
│   │   ├── routes/
│   │   │   ├── sessions.js
│   │   │   ├── messages.js
│   │   │   ├── autoResponders.js
│   │   │   ├── scheduled.js
│   │   │   ├── templates.js
│   │   │   └── contacts.js
│   │   ├── services/
│   │   │   ├── SessionManager.js
│   │   │   ├── MessageService.js
│   │   │   ├── AutoResponderService.js
│   │   │   └── SchedulerService.js
│   │   └── utils/
│   │       └── logger.js
│   └── data/                  # Base de données JSON
│
└── frontend/
    ├── package.json
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── sessions/
    │   │   ├── chat/
    │   │   ├── contacts/
    │   │   ├── auto-responders/
    │   │   ├── scheduled/
    │   │   ├── templates/
    │   │   └── settings/
    │   ├── components/
    │   │   ├── layout/
    │   │   ├── dashboard/
    │   │   ├── sessions/
    │   │   ├── chat/
    │   │   ├── contacts/
    │   │   ├── auto-responders/
    │   │   ├── scheduled/
    │   │   ├── templates/
    │   │   └── ui/
    │   ├── lib/
    │   │   ├── api.ts
    │   │   ├── config.ts
    │   │   ├── socket.ts
    │   │   └── utils.ts
    │   └── store/
    │       └── app-store.ts
    └── public/
```

## 🔒 Sécurité

- Authentification via clé API
- Les sessions WhatsApp sont persistées localement
- Les données sont stockées dans des fichiers JSON (peut être remplacé par une vraie base de données)

## 📝 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.

## ⚠️ Avertissement

Ce projet utilise whatsapp-web.js qui n'est pas officiellement supporté par WhatsApp. Utilisez-le à vos propres risques et conformément aux conditions d'utilisation de WhatsApp.
