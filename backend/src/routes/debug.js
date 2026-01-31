const express = require('express');
const router = express.Router();
const { MessageMedia, Location, Poll, Buttons, List } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 64 * 1024 * 1024 } // 64MB max
});

module.exports = (sessionManager) => {
  
  // Helper to get client
  const getClient = (sessionId) => {
    const session = sessionManager.getSession(sessionId);
    if (!session || !session.client) {
      throw new Error('Session not found or not connected');
    }
    return session.client;
  };

  // ==================== MESSAGING ====================

  // Send text message
  router.post('/send-text', async (req, res) => {
    try {
      const { sessionId, to, message } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const result = await client.sendMessage(chatId, message);
      res.json({ success: true, data: { id: result.id._serialized, timestamp: result.timestamp } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send image
  router.post('/send-image', async (req, res) => {
    try {
      const { sessionId, to, imageUrl, caption } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
      const result = await client.sendMessage(chatId, media, { caption });
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send audio
  router.post('/send-audio', async (req, res) => {
    try {
      const { sessionId, to, audioUrl, ptt } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = await MessageMedia.fromUrl(audioUrl, { unsafeMime: true });
      const result = await client.sendMessage(chatId, media, { sendAudioAsVoice: ptt });
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send video
  router.post('/send-video', async (req, res) => {
    try {
      const { sessionId, to, videoUrl, caption } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = await MessageMedia.fromUrl(videoUrl, { unsafeMime: true });
      const result = await client.sendMessage(chatId, media, { caption });
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send document
  router.post('/send-document', async (req, res) => {
    try {
      const { sessionId, to, documentUrl, filename } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = await MessageMedia.fromUrl(documentUrl, { unsafeMime: true });
      media.filename = filename || 'document';
      const result = await client.sendMessage(chatId, media, { sendMediaAsDocument: true });
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== FILE UPLOAD ROUTES ====================

  // Upload and send image file
  router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
      const { sessionId, to, caption } = req.body;
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = MessageMedia.fromFilePath(req.file.path);
      const result = await client.sendMessage(chatId, media, { caption });
      // Clean up uploaded file after sending
      fs.unlink(req.file.path, () => {});
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Upload and send video file
  router.post('/upload-video', upload.single('video'), async (req, res) => {
    try {
      const { sessionId, to, caption } = req.body;
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No video file provided' });
      }
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = MessageMedia.fromFilePath(req.file.path);
      const result = await client.sendMessage(chatId, media, { caption });
      fs.unlink(req.file.path, () => {});
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Upload and send document file
  router.post('/upload-document', upload.single('document'), async (req, res) => {
    try {
      const { sessionId, to, filename } = req.body;
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No document file provided' });
      }
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = MessageMedia.fromFilePath(req.file.path);
      media.filename = filename || req.file.originalname;
      const result = await client.sendMessage(chatId, media, { sendMediaAsDocument: true });
      fs.unlink(req.file.path, () => {});
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Upload and send audio file
  router.post('/upload-audio', upload.single('audio'), async (req, res) => {
    try {
      const { sessionId, to, ptt } = req.body;
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No audio file provided' });
      }
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = MessageMedia.fromFilePath(req.file.path);
      const result = await client.sendMessage(chatId, media, { sendAudioAsVoice: ptt === 'true' });
      fs.unlink(req.file.path, () => {});
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send sticker
  router.post('/send-sticker', async (req, res) => {
    try {
      const { sessionId, to, stickerUrl } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const media = await MessageMedia.fromUrl(stickerUrl, { unsafeMime: true });
      const result = await client.sendMessage(chatId, media, { sendMediaAsSticker: true });
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send location
  router.post('/send-location', async (req, res) => {
    try {
      const { sessionId, to, latitude, longitude, description } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const location = new Location(latitude, longitude, description);
      const result = await client.sendMessage(chatId, location);
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send contact card
  router.post('/send-contact', async (req, res) => {
    try {
      const { sessionId, to, contactId } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const contactChatId = contactId.includes('@') ? contactId : `${contactId}@c.us`;
      const contact = await client.getContactById(contactChatId);
      const result = await client.sendMessage(chatId, contact);
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Reply to message
  router.post('/reply-message', async (req, res) => {
    try {
      const { sessionId, messageId, reply } = req.body;
      const client = getClient(sessionId);
      const msg = await client.getMessageById(messageId);
      const result = await msg.reply(reply);
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // React to message
  router.post('/react-message', async (req, res) => {
    try {
      const { sessionId, messageId, emoji } = req.body;
      const client = getClient(sessionId);
      const msg = await client.getMessageById(messageId);
      await msg.react(emoji);
      res.json({ success: true, data: { reacted: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create poll
  router.post('/create-poll', async (req, res) => {
    try {
      const { sessionId, to, pollName, options, allowMultiple } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const poll = new Poll(pollName, options, { allowMultipleAnswers: allowMultiple });
      const result = await client.sendMessage(chatId, poll);
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send message with mentions
  router.post('/send-mention', async (req, res) => {
    try {
      const { sessionId, to, message, mentions } = req.body;
      const client = getClient(sessionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const mentionIds = mentions.map(m => m.includes('@') ? m : `${m}@c.us`);
      const mentionContacts = await Promise.all(mentionIds.map(id => client.getContactById(id)));
      const result = await client.sendMessage(chatId, message, { mentions: mentionContacts });
      res.json({ success: true, data: { id: result.id._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== CONTACTS ====================

  // Get contact info
  router.get('/contact/:sessionId/:contactId', async (req, res) => {
    try {
      const { sessionId, contactId } = req.params;
      const client = getClient(sessionId);
      const chatId = contactId.includes('@') ? contactId : `${contactId}@c.us`;
      const contact = await client.getContactById(chatId);
      res.json({
        success: true,
        data: {
          id: contact.id._serialized,
          name: contact.name,
          pushname: contact.pushname,
          isUser: contact.isUser,
          isGroup: contact.isGroup,
          isBlocked: contact.isBlocked,
          isBusiness: contact.isBusiness,
          isEnterprise: contact.isEnterprise,
          isMyContact: contact.isMyContact,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get profile picture
  router.get('/profile-picture/:sessionId/:contactId', async (req, res) => {
    try {
      const { sessionId, contactId } = req.params;
      const client = getClient(sessionId);
      const chatId = contactId.includes('@') ? contactId : `${contactId}@c.us`;
      const url = await client.getProfilePicUrl(chatId);
      res.json({ success: true, data: { url } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Block contact
  router.post('/block-contact', async (req, res) => {
    try {
      const { sessionId, contactId } = req.body;
      const client = getClient(sessionId);
      const chatId = contactId.includes('@') ? contactId : `${contactId}@c.us`;
      const contact = await client.getContactById(chatId);
      await contact.block();
      res.json({ success: true, data: { blocked: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Unblock contact
  router.post('/unblock-contact', async (req, res) => {
    try {
      const { sessionId, contactId } = req.body;
      const client = getClient(sessionId);
      const chatId = contactId.includes('@') ? contactId : `${contactId}@c.us`;
      const contact = await client.getContactById(chatId);
      await contact.unblock();
      res.json({ success: true, data: { unblocked: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== CHATS ====================

  // Mute chat
  router.post('/mute-chat', async (req, res) => {
    try {
      const { sessionId, chatId: targetChatId, duration } = req.body;
      const client = getClient(sessionId);
      const chatId = targetChatId.includes('@') ? targetChatId : `${targetChatId}@c.us`;
      const chat = await client.getChatById(chatId);
      const unmuteDate = duration ? new Date(Date.now() + duration * 1000) : null;
      await chat.mute(unmuteDate);
      res.json({ success: true, data: { muted: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Unmute chat
  router.post('/unmute-chat', async (req, res) => {
    try {
      const { sessionId, chatId: targetChatId } = req.body;
      const client = getClient(sessionId);
      const chatId = targetChatId.includes('@') ? targetChatId : `${targetChatId}@c.us`;
      const chat = await client.getChatById(chatId);
      await chat.unmute();
      res.json({ success: true, data: { unmuted: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get all chats
  router.get('/chats/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const client = getClient(sessionId);
      const chats = await client.getChats();
      const chatList = chats.slice(0, 50).map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        lastMessage: chat.lastMessage?.body?.substring(0, 100),
        isMuted: chat.isMuted,
      }));
      res.json({ success: true, data: chatList });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== GROUPS ====================

  // Create group
  router.post('/create-group', async (req, res) => {
    try {
      const { sessionId, name, participants } = req.body;
      const client = getClient(sessionId);
      const participantIds = participants.map(p => p.includes('@') ? p : `${p}@c.us`);
      const result = await client.createGroup(name, participantIds);
      res.json({ success: true, data: { groupId: result.gid._serialized } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get group invite link
  router.get('/group-invite/:sessionId/:groupId', async (req, res) => {
    try {
      const { sessionId, groupId } = req.params;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      const inviteCode = await chat.getInviteCode();
      res.json({ success: true, data: { inviteCode, inviteLink: `https://chat.whatsapp.com/${inviteCode}` } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Join group by invite
  router.post('/join-group', async (req, res) => {
    try {
      const { sessionId, inviteCode } = req.body;
      const client = getClient(sessionId);
      const code = inviteCode.includes('chat.whatsapp.com/') 
        ? inviteCode.split('chat.whatsapp.com/')[1] 
        : inviteCode;
      const groupId = await client.acceptInvite(code);
      res.json({ success: true, data: { groupId } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Leave group
  router.post('/leave-group', async (req, res) => {
    try {
      const { sessionId, groupId } = req.body;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      await chat.leave();
      res.json({ success: true, data: { left: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get group info
  router.get('/group-info/:sessionId/:groupId', async (req, res) => {
    try {
      const { sessionId, groupId } = req.params;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      const groupMetadata = await chat.getContact();
      const participants = chat.participants || [];
      
      res.json({
        success: true,
        data: {
          id: chat.id._serialized,
          name: chat.name,
          description: chat.description,
          owner: chat.owner?._serialized,
          createdAt: chat.createdAt,
          participantCount: participants.length,
          participants: participants.slice(0, 20).map(p => ({
            id: p.id._serialized,
            isAdmin: p.isAdmin,
            isSuperAdmin: p.isSuperAdmin,
          })),
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Modify group subject
  router.post('/group-subject', async (req, res) => {
    try {
      const { sessionId, groupId, subject } = req.body;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      await chat.setSubject(subject);
      res.json({ success: true, data: { updated: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Modify group description
  router.post('/group-description', async (req, res) => {
    try {
      const { sessionId, groupId, description } = req.body;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      await chat.setDescription(description);
      res.json({ success: true, data: { updated: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Add participants
  router.post('/group-add', async (req, res) => {
    try {
      const { sessionId, groupId, participants } = req.body;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      const participantIds = participants.map(p => p.includes('@') ? p : `${p}@c.us`);
      const result = await chat.addParticipants(participantIds);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Remove participants
  router.post('/group-remove', async (req, res) => {
    try {
      const { sessionId, groupId, participants } = req.body;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      const participantIds = participants.map(p => p.includes('@') ? p : `${p}@c.us`);
      const result = await chat.removeParticipants(participantIds);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Promote to admin
  router.post('/group-promote', async (req, res) => {
    try {
      const { sessionId, groupId, participants } = req.body;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      const participantIds = participants.map(p => p.includes('@') ? p : `${p}@c.us`);
      const result = await chat.promoteParticipants(participantIds);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Demote from admin
  router.post('/group-demote', async (req, res) => {
    try {
      const { sessionId, groupId, participants } = req.body;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      const participantIds = participants.map(p => p.includes('@') ? p : `${p}@c.us`);
      const result = await chat.demoteParticipants(participantIds);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Set group settings
  router.post('/group-settings', async (req, res) => {
    try {
      const { sessionId, groupId, messagesAdminsOnly, infoAdminsOnly } = req.body;
      const client = getClient(sessionId);
      const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      const chat = await client.getChatById(chatId);
      
      if (messagesAdminsOnly !== undefined) {
        await chat.setMessagesAdminsOnly(messagesAdminsOnly);
      }
      if (infoAdminsOnly !== undefined) {
        await chat.setInfoAdminsOnly(infoAdminsOnly);
      }
      
      res.json({ success: true, data: { updated: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== STATUS ====================

  // Set status message
  router.post('/set-status', async (req, res) => {
    try {
      const { sessionId, status } = req.body;
      const client = getClient(sessionId);
      await client.setStatus(status);
      res.json({ success: true, data: { updated: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get my info
  router.get('/me/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const client = getClient(sessionId);
      const info = client.info;
      res.json({
        success: true,
        data: {
          wid: info.wid._serialized,
          pushname: info.pushname,
          platform: info.platform,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== CHANNELS ====================

  // Get channels
  router.get('/channels/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const client = getClient(sessionId);
      const chats = await client.getChats();
      const channels = chats.filter(chat => chat.isChannel).map(channel => ({
        id: channel.id._serialized,
        name: channel.name,
        description: channel.description,
      }));
      res.json({ success: true, data: channels });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== MESSAGES ====================

  // Get recent messages
  router.get('/messages/:sessionId/:chatId', async (req, res) => {
    try {
      const { sessionId, chatId: targetChatId } = req.params;
      const { limit = 20 } = req.query;
      const client = getClient(sessionId);
      const chatId = targetChatId.includes('@') ? targetChatId : `${targetChatId}@c.us`;
      const chat = await client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit: parseInt(limit) });
      
      const messageList = messages.map(msg => ({
        id: msg.id._serialized,
        body: msg.body,
        from: msg.from,
        to: msg.to,
        timestamp: msg.timestamp,
        fromMe: msg.fromMe,
        type: msg.type,
        hasMedia: msg.hasMedia,
        isForwarded: msg.isForwarded,
        hasQuotedMsg: msg.hasQuotedMsg,
      }));
      
      res.json({ success: true, data: messageList });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Download media from message
  router.get('/download-media/:sessionId/:messageId', async (req, res) => {
    try {
      const { sessionId, messageId } = req.params;
      const client = getClient(sessionId);
      const msg = await client.getMessageById(messageId);
      
      if (!msg.hasMedia) {
        return res.status(400).json({ success: false, error: 'Message has no media' });
      }
      
      const media = await msg.downloadMedia();
      res.json({
        success: true,
        data: {
          mimetype: media.mimetype,
          filename: media.filename,
          data: media.data, // Base64
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Star/unstar message
  router.post('/star-message', async (req, res) => {
    try {
      const { sessionId, messageId, star } = req.body;
      const client = getClient(sessionId);
      const msg = await client.getMessageById(messageId);
      if (star) {
        await msg.star();
      } else {
        await msg.unstar();
      }
      res.json({ success: true, data: { starred: star } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete message
  router.post('/delete-message', async (req, res) => {
    try {
      const { sessionId, messageId, everyone } = req.body;
      const client = getClient(sessionId);
      const msg = await client.getMessageById(messageId);
      await msg.delete(everyone);
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Forward message
  router.post('/forward-message', async (req, res) => {
    try {
      const { sessionId, messageId, to } = req.body;
      const client = getClient(sessionId);
      const msg = await client.getMessageById(messageId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      await msg.forward(chatId);
      res.json({ success: true, data: { forwarded: true } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
