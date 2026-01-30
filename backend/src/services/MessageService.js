const { MessageMedia } = require('whatsapp-web.js');
const logger = require('../utils/logger');

class MessageService {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Send text message
   */
  async sendText(sessionId, to, text, options = {}) {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const message = await client.sendMessage(chatId, text, options);
    
    logger.info(`Message sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Send image
   */
  async sendImage(sessionId, to, imageUrl, caption = '') {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const media = await MessageMedia.fromUrl(imageUrl);
    const message = await client.sendMessage(chatId, media, { caption });
    
    logger.info(`Image sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Send image from base64
   */
  async sendImageBase64(sessionId, to, base64Data, mimetype, filename, caption = '') {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const media = new MessageMedia(mimetype, base64Data, filename);
    const message = await client.sendMessage(chatId, media, { caption });
    
    logger.info(`Image (base64) sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Send video
   */
  async sendVideo(sessionId, to, videoUrl, caption = '') {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const media = await MessageMedia.fromUrl(videoUrl);
    const message = await client.sendMessage(chatId, media, { caption });
    
    logger.info(`Video sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Send document
   */
  async sendDocument(sessionId, to, documentUrl, filename) {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const media = await MessageMedia.fromUrl(documentUrl);
    media.filename = filename;
    const message = await client.sendMessage(chatId, media, { sendMediaAsDocument: true });
    
    logger.info(`Document sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Send audio
   */
  async sendAudio(sessionId, to, audioUrl, ptt = false) {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const media = await MessageMedia.fromUrl(audioUrl);
    const message = await client.sendMessage(chatId, media, { sendAudioAsVoice: ptt });
    
    logger.info(`Audio sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Send location
   */
  async sendLocation(sessionId, to, latitude, longitude, description = '') {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const location = new (require('whatsapp-web.js').Location)(latitude, longitude, description);
    const message = await client.sendMessage(chatId, location);
    
    logger.info(`Location sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Send contact (vCard)
   */
  async sendContact(sessionId, to, contactId) {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const contact = await client.getContactById(this._formatChatId(contactId));
    const message = await client.sendMessage(chatId, contact);
    
    logger.info(`Contact sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Send buttons (interactive message)
   */
  async sendButtons(sessionId, to, body, buttons, title = '', footer = '') {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chatId = this._formatChatId(to);
    const Buttons = require('whatsapp-web.js').Buttons;
    
    const buttonMessage = new Buttons(body, buttons, title, footer);
    const message = await client.sendMessage(chatId, buttonMessage);
    
    logger.info(`Buttons sent from session ${sessionId} to ${to}`);
    return this._formatSentMessage(message);
  }

  /**
   * Get chat messages
   */
  async getMessages(sessionId, chatId, limit = 50) {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const formattedChatId = this._formatChatId(chatId);
    const chat = await client.getChatById(formattedChatId);
    const messages = await chat.fetchMessages({ limit });
    
    return Promise.all(messages.map(msg => this._formatReceivedMessage(msg)));
  }

  /**
   * Get all chats
   */
  async getChats(sessionId) {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const chats = await client.getChats();
    return chats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      timestamp: chat.timestamp,
      lastMessage: chat.lastMessage?.body,
    }));
  }

  /**
   * Get contacts
   */
  async getContacts(sessionId) {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    const contacts = await client.getContacts();
    return contacts
      .filter(c => c.isMyContact || c.isUser)
      .map(contact => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname,
        number: contact.number,
        isMyContact: contact.isMyContact,
        isBlocked: contact.isBlocked,
      }));
  }

  /**
   * Format chat ID
   */
  _formatChatId(phone) {
    if (phone.includes('@')) return phone;
    const cleaned = phone.replace(/\D/g, '');
    return `${cleaned}@c.us`;
  }

  /**
   * Format sent message for response
   */
  _formatSentMessage(message) {
    return {
      id: message.id._serialized,
      from: message.from,
      to: message.to,
      body: message.body,
      timestamp: message.timestamp,
      fromMe: true,
      type: message.type,
    };
  }

  /**
   * Format received message for response
   */
  async _formatReceivedMessage(message) {
    return {
      id: message.id._serialized,
      from: message.from,
      to: message.to,
      body: message.body,
      timestamp: message.timestamp,
      fromMe: message.fromMe,
      type: message.type,
      hasMedia: message.hasMedia,
    };
  }
}

module.exports = MessageService;
