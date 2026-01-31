const express = require('express');
const router = express.Router();

// GET /api/scheduled - Get all scheduled messages
router.get('/', (req, res) => {
  const schedulerService = req.app.get('schedulerService');
  const { sessionId } = req.query;

  if (sessionId) {
    const tasks = schedulerService.getTasksForSession(sessionId);
    res.json({ success: true, data: tasks });
  } else {
    const tasks = schedulerService.getAllTasks();
    res.json({ success: true, data: tasks });
  }
});

// POST /api/scheduled - Create scheduled message
router.post('/', (req, res) => {
  const schedulerService = req.app.get('schedulerService');
  const {
    sessionId,
    to,
    recipient,  // Support both 'to' and 'recipient'
    message,
    messageType = 'text',
    mediaUrl,
    scheduleType,
    type,  // Support both 'scheduleType' and 'type'
    scheduledTime,
    scheduledAt,  // Support both 'scheduledTime' and 'scheduledAt'
    cronExpression,
    templateId,
    enabled = true,
  } = req.body;

  // Use recipient or to
  const actualRecipient = recipient || to;
  // Use type or scheduleType
  const actualScheduleType = type || scheduleType;
  // Use scheduledAt or scheduledTime
  const actualScheduledTime = scheduledAt || scheduledTime;

  if (!sessionId || !actualRecipient) {
    return res.status(400).json({ 
      error: 'sessionId and recipient (or to) are required' 
    });
  }

  // Message or templateId is required
  if (!message && !templateId) {
    return res.status(400).json({ 
      error: 'Either message or templateId is required' 
    });
  }

  if (!actualScheduleType || !['once', 'recurring'].includes(actualScheduleType)) {
    return res.status(400).json({ 
      error: 'type (or scheduleType) must be "once" or "recurring"' 
    });
  }

  if (actualScheduleType === 'once' && !actualScheduledTime) {
    return res.status(400).json({ 
      error: 'scheduledAt (or scheduledTime) is required for one-time messages' 
    });
  }

  if (actualScheduleType === 'recurring' && !cronExpression) {
    return res.status(400).json({ 
      error: 'cronExpression is required for recurring messages' 
    });
  }

  try {
    const task = schedulerService.scheduleMessage({
      sessionId,
      to: actualRecipient,
      message: message || '',
      messageType,
      mediaUrl,
      scheduleType: actualScheduleType,
      scheduledTime: actualScheduledTime,
      cronExpression,
      templateId,
      enabled,
    });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/scheduled/:id - Cancel scheduled message
router.delete('/:id', (req, res) => {
  const schedulerService = req.app.get('schedulerService');

  try {
    schedulerService.cancelTask(req.params.id);
    res.json({ success: true, message: 'Scheduled message cancelled' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/scheduled/:id/run - Execute scheduled message now
router.post('/:id/run', async (req, res) => {
  const schedulerService = req.app.get('schedulerService');
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    await schedulerService.runTaskNow(req.params.id);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/scheduled/:id/toggle - Pause/resume scheduled message
router.post('/:id/toggle', (req, res) => {
  const schedulerService = req.app.get('schedulerService');
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled is required' });
  }

  try {
    const task = schedulerService.toggleTask(req.params.id, enabled);
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
