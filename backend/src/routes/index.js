require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const SessionManager = require('./services/SessionManager');
const MessageService = require('./services/MessageService');
const AutoResponderService = require('./services/AutoResponderService');
const SchedulerService = require('./services/SchedulerService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Key middleware (optional)
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Ensure directories exist
const sessionsPath = process.env.SESSIONS_PATH || './sessions';
const dataPath = './data';
if (!fs.existsSync(sessionsPath)) fs.mkdirSync(sessionsPath, { recursive: true });
if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true });

// Initialize services
const sessionManager = new SessionManager(io, sessionsPath);
const messageService = new MessageService(sessionManager);
const autoResponderService = new AutoResponderService(sessionManager, messageService);
const schedulerService = new SchedulerService(sessionManager, messageService);

// Make services available to routes
app.set('sessionManager', sessionManager);
app.set('messageService', messageService);
app.set('autoResponderService', autoResponderService);
app.set('schedulerService', schedulerService);
app.set('io', io);

// Routes
app.use('/api/sessions', apiKeyAuth, require('./routes/sessions'));
app.use('/api/messages', apiKeyAuth, require('./routes/messages'));
app.use('/api/auto-responders', apiKeyAuth, require('./routes/autoResponders'));
app.use('/api/scheduled', apiKeyAuth, require('./routes/scheduled'));
app.use('/api/templates', apiKeyAuth, require('./routes/templates'));
app.use('/api/contacts', apiKeyAuth, require('./routes/contacts'));
app.use('/api/debug', apiKeyAuth, require('./routes/debug')(sessionManager));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io events
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe', (sessionId) => {
    socket.join(`session:${sessionId}`);
    logger.info(`Client ${socket.id} subscribed to session: ${sessionId}`);
  });

  socket.on('unsubscribe', (sessionId) => {
    socket.leave(`session:${sessionId}`);
    logger.info(`Client ${socket.id} unsubscribed from session: ${sessionId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 WhatsApp Bot Manager running on port ${PORT}`);
  logger.info(`📱 Sessions path: ${path.resolve(sessionsPath)}`);
  
  // Initialize auto-restore of sessions
  sessionManager.restoreSessions();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await sessionManager.disconnectAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await sessionManager.disconnectAll();
  process.exit(0);
});
