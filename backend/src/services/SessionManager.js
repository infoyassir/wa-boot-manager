const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class SessionManager {
  constructor(io, sessionsPath) {
    this.io = io;
    this.sessionsPath = sessionsPath;
    this.sessions = new Map(); // sessionId -> { client, status, info }
    this.qrCodes = new Map(); // sessionId -> qrCode data URL
  }

  /**
   * Create a new WhatsApp session
   */
  async createSession(sessionId, options = {}) {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    logger.info(`Creating session: ${sessionId}`);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: this.sessionsPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
      ...options,
    });

    // Store session
    this.sessions.set(sessionId, {
      client,
      status: 'initializing',
      info: null,
      createdAt: new Date(),
      messageCount: 0,
    });

    // Setup event handlers
    this._setupEventHandlers(sessionId, client);

    // Initialize client
    try {
      await client.initialize();
    } catch (error) {
      logger.error(`Failed to initialize session ${sessionId}:`, error);
      this.sessions.delete(sessionId);
      throw error;
    }

    return { sessionId, status: 'initializing' };
  }

  /**
   * Setup event handlers for a client
   */
  _setupEventHandlers(sessionId, client) {
    // QR Code event
    client.on('qr', async (qr) => {
      logger.info(`QR received for session: ${sessionId}`);
      try {
        const qrDataUrl = await QRCode.toDataURL(qr);
        this.qrCodes.set(sessionId, qrDataUrl);
        this._updateSessionStatus(sessionId, 'qr_ready');
        this.io.to(`session:${sessionId}`).emit('qr', { sessionId, qr: qrDataUrl });
        this.io.emit('session:qr', { sessionId, qr: qrDataUrl });
      } catch (err) {
        logger.error(`Failed to generate QR for session ${sessionId}:`, err);
      }
    });

    // Ready event
    client.on('ready', () => {
      logger.info(`Session ready: ${sessionId}`);
      this.qrCodes.delete(sessionId);
      const info = client.info;
      this._updateSessionStatus(sessionId, 'connected', info);
      this.io.to(`session:${sessionId}`).emit('ready', { sessionId, info });
      this.io.emit('session:ready', { sessionId, info });
    });

    // Authentication success
    client.on('authenticated', () => {
      logger.info(`Session authenticated: ${sessionId}`);
      this._updateSessionStatus(sessionId, 'authenticated');
      this.io.to(`session:${sessionId}`).emit('authenticated', { sessionId });
      this.io.emit('session:authenticated', { sessionId });
    });

    // Authentication failure
    client.on('auth_failure', (msg) => {
      logger.error(`Auth failure for session ${sessionId}:`, msg);
      this._updateSessionStatus(sessionId, 'auth_failure');
      this.io.to(`session:${sessionId}`).emit('auth_failure', { sessionId, message: msg });
      this.io.emit('session:auth_failure', { sessionId, message: msg });
    });

    // Disconnected
    client.on('disconnected', (reason) => {
      logger.info(`Session disconnected: ${sessionId} - Reason: ${reason}`);
      this._updateSessionStatus(sessionId, 'disconnected');
      this.io.to(`session:${sessionId}`).emit('disconnected', { sessionId, reason });
      this.io.emit('session:disconnected', { sessionId, reason });
    });

    // Message received
    client.on('message', async (message) => {
      logger.info(`Message received on session ${sessionId} from ${message.from}`);
      
      // Increment message count
      const session = this.sessions.get(sessionId);
      if (session) {
        session.messageCount++;
      }

      // Emit message event
      const messageData = await this._formatMessage(message);
      this.io.to(`session:${sessionId}`).emit('message', { sessionId, message: messageData });
      this.io.emit('session:message', { sessionId, message: messageData });
    });

    // Message sent
    client.on('message_create', async (message) => {
      if (message.fromMe) {
        const messageData = await this._formatMessage(message);
        this.io.to(`session:${sessionId}`).emit('message_sent', { sessionId, message: messageData });
      }
    });

    // Message ACK (read receipts)
    client.on('message_ack', (message, ack) => {
      this.io.to(`session:${sessionId}`).emit('message_ack', { 
        sessionId, 
        messageId: message.id._serialized, 
        ack 
      });
    });
  }

  /**
   * Format message for API response
   */
  async _formatMessage(message) {
    let media = null;
    if (message.hasMedia) {
      try {
        const attachedMedia = await message.downloadMedia();
        if (attachedMedia) {
          media = {
            mimetype: attachedMedia.mimetype,
            data: attachedMedia.data,
            filename: attachedMedia.filename,
          };
        }
      } catch (err) {
        logger.error('Failed to download media:', err);
      }
    }

    return {
      id: message.id._serialized,
      from: message.from,
      to: message.to,
      body: message.body,
      timestamp: message.timestamp,
      fromMe: message.fromMe,
      hasMedia: message.hasMedia,
      type: message.type,
      media,
      isForwarded: message.isForwarded,
      isStatus: message.isStatus,
    };
  }

  /**
   * Update session status
   */
  _updateSessionStatus(sessionId, status, info = null) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      if (info) session.info = info;
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions() {
    const sessions = [];
    for (const [id, session] of this.sessions) {
      sessions.push({
        id,
        status: session.status,
        info: session.info ? {
          pushname: session.info.pushname,
          wid: session.info.wid?._serialized,
          phone: session.info.wid?.user,
        } : null,
        createdAt: session.createdAt,
        messageCount: session.messageCount,
      });
    }
    return sessions;
  }

  /**
   * Get QR code for session
   */
  getQRCode(sessionId) {
    return this.qrCodes.get(sessionId) || null;
  }

  /**
   * Delete/logout session
   */
  async deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    logger.info(`Deleting session: ${sessionId}`);

    try {
      await session.client.logout();
    } catch (err) {
      logger.warn(`Error logging out session ${sessionId}:`, err);
    }

    try {
      await session.client.destroy();
    } catch (err) {
      logger.warn(`Error destroying session ${sessionId}:`, err);
    }

    this.sessions.delete(sessionId);
    this.qrCodes.delete(sessionId);

    // Remove session folder
    const sessionFolder = path.join(this.sessionsPath, `session-${sessionId}`);
    if (fs.existsSync(sessionFolder)) {
      fs.rmSync(sessionFolder, { recursive: true, force: true });
    }

    this.io.emit('session:deleted', { sessionId });
    return { success: true };
  }

  /**
   * Restore existing sessions
   */
  async restoreSessions() {
    logger.info('Checking for existing sessions to restore...');
    
    if (!fs.existsSync(this.sessionsPath)) return;

    const folders = fs.readdirSync(this.sessionsPath);
    const sessionFolders = folders.filter(f => f.startsWith('session-'));

    for (const folder of sessionFolders) {
      const sessionId = folder.replace('session-', '');
      try {
        logger.info(`Restoring session: ${sessionId}`);
        await this.createSession(sessionId);
      } catch (err) {
        logger.error(`Failed to restore session ${sessionId}:`, err);
      }
    }
  }

  /**
   * Disconnect all sessions
   */
  async disconnectAll() {
    logger.info('Disconnecting all sessions...');
    for (const [sessionId, session] of this.sessions) {
      try {
        await session.client.destroy();
        logger.info(`Session ${sessionId} destroyed`);
      } catch (err) {
        logger.error(`Error destroying session ${sessionId}:`, err);
      }
    }
    this.sessions.clear();
    this.qrCodes.clear();
  }

  /**
   * Get client for session
   */
  getClient(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.client : null;
  }
}

module.exports = SessionManager;
