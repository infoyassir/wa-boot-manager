const express = require('express');
const router = express.Router();

// GET /api/auto-responders - Get all rules
router.get('/', (req, res) => {
  const autoResponderService = req.app.get('autoResponderService');
  const { sessionId } = req.query;

  if (sessionId) {
    const rules = autoResponderService.getRules(sessionId);
    res.json({ success: true, data: rules });
  } else {
    const rules = autoResponderService.getAllRules();
    res.json({ success: true, data: rules });
  }
});

// POST /api/auto-responders - Create new rule
router.post('/', (req, res) => {
  const autoResponderService = req.app.get('autoResponderService');
  const { 
    sessionId, 
    name,
    trigger, 
    matchType = 'contains',
    response, 
    responseType = 'text',
    mediaUrl,
    filename,
    stopOnMatch = false,
  } = req.body;

  if (!sessionId || !trigger || !response) {
    return res.status(400).json({ 
      error: 'sessionId, trigger, and response are required' 
    });
  }

  try {
    const rule = autoResponderService.addRule(sessionId, {
      name: name || `Rule: ${trigger}`,
      trigger,
      matchType,
      response,
      responseType,
      mediaUrl,
      filename,
      stopOnMatch,
    });
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/auto-responders/:id - Update rule
router.put('/:id', (req, res) => {
  const autoResponderService = req.app.get('autoResponderService');
  const { sessionId, ...updates } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const rule = autoResponderService.updateRule(sessionId, req.params.id, updates);
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/auto-responders/:id - Delete rule
router.delete('/:id', (req, res) => {
  const autoResponderService = req.app.get('autoResponderService');
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    autoResponderService.deleteRule(sessionId, req.params.id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auto-responders/:id/toggle - Toggle rule enabled/disabled
router.post('/:id/toggle', (req, res) => {
  const autoResponderService = req.app.get('autoResponderService');
  const { sessionId, enabled } = req.body;

  if (!sessionId || typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'sessionId and enabled are required' });
  }

  try {
    const rule = autoResponderService.updateRule(sessionId, req.params.id, { enabled });
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
