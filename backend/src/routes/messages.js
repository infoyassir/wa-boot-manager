const express = require('express');
const router = express.Router();

// POST /api/messages/send - Send message
router.post('/send', async (req, res) => {
  const messageService = req.app.get('messageService');
  const { sessionId, to, message, type = 'text', mediaUrl, caption, filename } = req.body;

  if (!sessionId || !to) {
    return res.status(400).json({ error: 'sessionId and to are required' });
  }

  try {
    let result;

    switch (type) {
      case 'text':
        if (!message) {
          return res.status(400).json({ error: 'message is required for text type' });
        }
        result = await messageService.sendText(sessionId, to, message);
        break;

      case 'image':
        if (!mediaUrl) {
          return res.status(400).json({ error: 'mediaUrl is required for image type' });
        }
        result = await messageService.sendImage(sessionId, to, mediaUrl, caption || '');
        break;

      case 'video':
        if (!mediaUrl) {
          return res.status(400).json({ error: 'mediaUrl is required for video type' });
        }
        result = await messageService.sendVideo(sessionId, to, mediaUrl, caption || '');
        break;

      case 'document':
        if (!mediaUrl || !filename) {
          return res.status(400).json({ error: 'mediaUrl and filename are required for document type' });
        }
        result = await messageService.sendDocument(sessionId, to, mediaUrl, filename);
        break;

      case 'audio':
        if (!mediaUrl) {
          return res.status(400).json({ error: 'mediaUrl is required for audio type' });
        }
        result = await messageService.sendAudio(sessionId, to, mediaUrl, req.body.ptt || false);
        break;

      case 'location':
        const { latitude, longitude, description } = req.body;
        if (!latitude || !longitude) {
          return res.status(400).json({ error: 'latitude and longitude are required for location type' });
        }
        result = await messageService.sendLocation(sessionId, to, latitude, longitude, description || '');
        break;

      default:
        return res.status(400).json({ error: `Unknown message type: ${type}` });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/messages/send-bulk - Send bulk messages
router.post('/send-bulk', async (req, res) => {
  const messageService = req.app.get('messageService');
  const { sessionId, recipients, message, type = 'text', mediaUrl, delay = 1000 } = req.body;

  if (!sessionId || !recipients || !Array.isArray(recipients)) {
    return res.status(400).json({ error: 'sessionId and recipients array are required' });
  }

  const results = [];
  for (let i = 0; i < recipients.length; i++) {
    const to = recipients[i];
    try {
      let result;
      if (type === 'text') {
        result = await messageService.sendText(sessionId, to, message);
      } else if (type === 'image') {
        result = await messageService.sendImage(sessionId, to, mediaUrl, message);
      }
      results.push({ to, success: true, data: result });
    } catch (err) {
      results.push({ to, success: false, error: err.message });
    }

    // Delay between messages to avoid rate limiting
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  res.json({ success: true, data: results });
});

// GET /api/messages/:sessionId/:chatId - Get messages from chat
router.get('/:sessionId/:chatId', async (req, res) => {
  const messageService = req.app.get('messageService');
  const { sessionId, chatId } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  try {
    const messages = await messageService.getMessages(sessionId, chatId, limit);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
