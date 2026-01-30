const express = require('express');
const router = express.Router();

// GET /api/sessions - List all sessions
router.get('/', (req, res) => {
  const sessionManager = req.app.get('sessionManager');
  const sessions = sessionManager.getAllSessions();
  res.json({ success: true, data: sessions });
});

// POST /api/sessions - Create new session
router.post('/', async (req, res) => {
  const sessionManager = req.app.get('sessionManager');
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const result = await sessionManager.createSession(sessionId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/sessions/:id - Get session details
router.get('/:id', (req, res) => {
  const sessionManager = req.app.get('sessionManager');
  const session = sessionManager.getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    success: true,
    data: {
      id: req.params.id,
      status: session.status,
      info: session.info ? {
        pushname: session.info.pushname,
        wid: session.info.wid?._serialized,
        phone: session.info.wid?.user,
      } : null,
      createdAt: session.createdAt,
      messageCount: session.messageCount,
    },
  });
});

// GET /api/sessions/:id/qr - Get QR code
router.get('/:id/qr', (req, res) => {
  const sessionManager = req.app.get('sessionManager');
  const qr = sessionManager.getQRCode(req.params.id);

  if (!qr) {
    return res.status(404).json({ error: 'QR code not available' });
  }

  res.json({ success: true, data: { qr } });
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', async (req, res) => {
  const sessionManager = req.app.get('sessionManager');

  try {
    await sessionManager.deleteSession(req.params.id);
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/sessions/:id/chats - Get all chats
router.get('/:id/chats', async (req, res) => {
  const messageService = req.app.get('messageService');

  try {
    const chats = await messageService.getChats(req.params.id);
    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/sessions/:id/contacts - Get all contacts
router.get('/:id/contacts', async (req, res) => {
  const messageService = req.app.get('messageService');

  try {
    const contacts = await messageService.getContacts(req.params.id);
    res.json({ success: true, data: contacts });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
