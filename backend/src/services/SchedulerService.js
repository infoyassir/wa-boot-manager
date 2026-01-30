const cron = require('node-cron');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class SchedulerService {
  constructor(sessionManager, messageService) {
    this.sessionManager = sessionManager;
    this.messageService = messageService;
    this.scheduledTasks = new Map(); // taskId -> { task, data }
    this.dataPath = './data/scheduled-messages.json';
    this._loadScheduledMessages();
  }

  /**
   * Load scheduled messages from file
   */
  _loadScheduledMessages() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        for (const task of data) {
          if (task.enabled && !task.completed) {
            this._scheduleTask(task);
          }
        }
        logger.info(`Loaded ${data.length} scheduled messages`);
      }
    } catch (err) {
      logger.error('Error loading scheduled messages:', err);
    }
  }

  /**
   * Save scheduled messages to file
   */
  _saveScheduledMessages() {
    try {
      const tasks = [];
      for (const [id, { data }] of this.scheduledTasks) {
        tasks.push(data);
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(tasks, null, 2));
    } catch (err) {
      logger.error('Error saving scheduled messages:', err);
    }
  }

  /**
   * Schedule a new message
   */
  scheduleMessage(options) {
    const {
      sessionId,
      to,
      message,
      messageType = 'text',
      mediaUrl,
      scheduleType, // 'once', 'recurring'
      scheduledTime, // ISO date for 'once'
      cronExpression, // cron expression for 'recurring'
    } = options;

    const taskId = uuidv4();
    const taskData = {
      id: taskId,
      sessionId,
      to,
      message,
      messageType,
      mediaUrl,
      scheduleType,
      scheduledTime,
      cronExpression,
      enabled: true,
      completed: false,
      createdAt: new Date().toISOString(),
      executionCount: 0,
    };

    this._scheduleTask(taskData);
    this._saveScheduledMessages();

    logger.info(`Scheduled message created: ${taskId}`);
    return taskData;
  }

  /**
   * Schedule a task
   */
  _scheduleTask(taskData) {
    const { id, scheduleType, scheduledTime, cronExpression } = taskData;

    let task;

    if (scheduleType === 'once') {
      // One-time scheduled message
      const runAt = new Date(scheduledTime);
      const now = new Date();
      const delay = runAt.getTime() - now.getTime();

      if (delay <= 0) {
        logger.warn(`Scheduled time for task ${id} has already passed`);
        return;
      }

      task = setTimeout(async () => {
        await this._executeTask(taskData);
        taskData.completed = true;
        this._saveScheduledMessages();
      }, delay);

    } else if (scheduleType === 'recurring') {
      // Recurring message with cron
      if (!cron.validate(cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      task = cron.schedule(cronExpression, async () => {
        await this._executeTask(taskData);
      }, { scheduled: true });
    }

    this.scheduledTasks.set(id, { task, data: taskData });
  }

  /**
   * Execute a scheduled task
   */
  async _executeTask(taskData) {
    const { id, sessionId, to, message, messageType, mediaUrl } = taskData;

    try {
      logger.info(`Executing scheduled task: ${id}`);

      switch (messageType) {
        case 'text':
          await this.messageService.sendText(sessionId, to, message);
          break;
        case 'image':
          await this.messageService.sendImage(sessionId, to, mediaUrl, message);
          break;
        case 'video':
          await this.messageService.sendVideo(sessionId, to, mediaUrl, message);
          break;
        case 'document':
          await this.messageService.sendDocument(sessionId, to, mediaUrl, message);
          break;
        default:
          await this.messageService.sendText(sessionId, to, message);
      }

      taskData.executionCount++;
      taskData.lastExecuted = new Date().toISOString();
      this._saveScheduledMessages();

      logger.info(`Scheduled task executed successfully: ${id}`);

    } catch (err) {
      logger.error(`Error executing scheduled task ${id}:`, err);
      taskData.lastError = err.message;
      this._saveScheduledMessages();
    }
  }

  /**
   * Cancel a scheduled task
   */
  cancelTask(taskId) {
    const taskEntry = this.scheduledTasks.get(taskId);
    if (!taskEntry) {
      throw new Error('Task not found');
    }

    const { task, data } = taskEntry;

    if (data.scheduleType === 'once') {
      clearTimeout(task);
    } else {
      task.stop();
    }

    this.scheduledTasks.delete(taskId);
    this._saveScheduledMessages();

    logger.info(`Scheduled task cancelled: ${taskId}`);
    return { success: true };
  }

  /**
   * Get all scheduled tasks
   */
  getAllTasks() {
    const tasks = [];
    for (const [id, { data }] of this.scheduledTasks) {
      tasks.push({
        ...data,
        status: data.completed ? 'completed' : (data.enabled ? 'active' : 'paused'),
      });
    }
    return tasks;
  }

  /**
   * Get tasks for a session
   */
  getTasksForSession(sessionId) {
    return this.getAllTasks().filter(t => t.sessionId === sessionId);
  }

  /**
   * Pause/resume task
   */
  toggleTask(taskId, enabled) {
    const taskEntry = this.scheduledTasks.get(taskId);
    if (!taskEntry) {
      throw new Error('Task not found');
    }

    const { task, data } = taskEntry;
    data.enabled = enabled;

    if (data.scheduleType === 'recurring') {
      if (enabled) {
        task.start();
      } else {
        task.stop();
      }
    }

    this._saveScheduledMessages();
    return data;
  }
}

module.exports = SchedulerService;
