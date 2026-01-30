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
    message,
    messageType = 'text',
    mediaUrl,
    scheduleType, // 'once' or 'recurring'
    scheduledTime, // ISO date string for 'once'
    cronExpression, // cron expression for 'recurring'
  } = req.body;

  if (!sessionId || !to || !message) {
    return res.status(400).json({ 
      error: 'sessionId, to, and message are required' 
    });
  }

  if (!scheduleType || !['once', 'recurring'].includes(scheduleType)) {
    return res.status(400).json({ 
      error: 'scheduleType must be "once" or "recurring"' 
    });
  }

  if (scheduleType === 'once' && !scheduledTime) {
    return res.status(400).json({ 
      error: 'scheduledTime is required for one-time messages' 
    });
  }

  if (scheduleType === 'recurring' && !cronExpression) {
    return res.status(400).json({ 
      error: 'cronExpression is required for recurring messages' 
    });
  }

  try {
    const task = schedulerService.scheduleMessage({
      sessionId,
      to,
      message,
      messageType,
      mediaUrl,
      scheduleType,
      scheduledTime,
      cronExpression,
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
