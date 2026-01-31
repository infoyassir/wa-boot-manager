const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class AutoResponderService {
  constructor(sessionManager, messageService) {
    this.sessionManager = sessionManager;
    this.messageService = messageService;
    this.rules = new Map(); // sessionId -> rules[]
    this.dataPath = './data/auto-responders.json';
    this._loadRules();
    this._setupListeners();
  }

  /**
   * Load rules from file
   */
  _loadRules() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        for (const [sessionId, rules] of Object.entries(data)) {
          this.rules.set(sessionId, rules);
        }
        logger.info(`Loaded ${this.rules.size} auto-responder rule sets`);
      }
    } catch (err) {
      logger.error('Error loading auto-responder rules:', err);
    }
  }

  /**
   * Save rules to file
   */
  _saveRules() {
    try {
      const data = {};
      for (const [sessionId, rules] of this.rules) {
        data[sessionId] = rules;
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (err) {
      logger.error('Error saving auto-responder rules:', err);
    }
  }

  /**
   * Setup message listeners for all sessions
   */
  _setupListeners() {
    // Attach listeners to existing sessions
    const sessions = this.sessionManager.getAllSessions();
    for (const session of sessions) {
      if (session.status === 'connected') {
        this._attachListener(session.id);
      }
    }

    // Listen for sessions becoming ready
    // SessionManager now emits 'session:ready' as an EventEmitter
    this.sessionManager.on('session:ready', ({ sessionId }) => {
      this._attachListener(sessionId);
    });
  }

  /**
   * Attach listener to a session
   */
  _attachListener(sessionId) {
    const client = this.sessionManager.getClient(sessionId);
    if (!client) return;

    client.on('message', async (message) => {
      if (message.fromMe) return;
      await this._processMessage(sessionId, message);
    });

    logger.info(`Auto-responder listener attached for session: ${sessionId}`);
  }

  /**
   * Process incoming message against rules
   */
  async _processMessage(sessionId, message) {
    const rules = this.rules.get(sessionId) || [];
    const enabledRules = rules.filter(r => r.enabled);

    for (const rule of enabledRules) {
      if (this._matchesRule(message, rule)) {
        logger.info(`Auto-responder triggered: Rule "${rule.name}" for session ${sessionId}`);
        await this._executeRule(sessionId, message, rule);
        
        // If rule is set to stop on match, break
        if (rule.stopOnMatch) break;
      }
    }
  }

  /**
   * Check if message matches rule
   */
  _matchesRule(message, rule) {
    const body = message.body.toLowerCase();
    const trigger = rule.trigger.toLowerCase();

    switch (rule.matchType) {
      case 'exact':
        return body === trigger;
      case 'contains':
        return body.includes(trigger);
      case 'startsWith':
        return body.startsWith(trigger);
      case 'endsWith':
        return body.endsWith(trigger);
      case 'regex':
        try {
          const regex = new RegExp(rule.trigger, 'i');
          return regex.test(message.body);
        } catch {
          return false;
        }
      default:
        return body.includes(trigger);
    }
  }

  /**
   * Execute rule action
   */
  async _executeRule(sessionId, message, rule) {
    try {
      const from = message.from;
      const responseText = this._processTemplate(rule.response, message);

      switch (rule.responseType) {
        case 'text':
          await this.messageService.sendText(sessionId, from, responseText);
          break;
        case 'image':
          await this.messageService.sendImage(sessionId, from, rule.mediaUrl, responseText);
          break;
        case 'document':
          await this.messageService.sendDocument(sessionId, from, rule.mediaUrl, rule.filename);
          break;
        default:
          await this.messageService.sendText(sessionId, from, responseText);
      }

      // Update stats
      rule.triggerCount = (rule.triggerCount || 0) + 1;
      rule.lastTriggered = new Date().toISOString();
      this._saveRules();

    } catch (err) {
      logger.error(`Error executing auto-responder rule:`, err);
    }
  }

  /**
   * Process template variables in response
   */
  _processTemplate(template, message) {
    return template
      .replace(/\{name\}/g, message.notifyName || 'there')
      .replace(/\{phone\}/g, message.from.replace('@c.us', ''))
      .replace(/\{message\}/g, message.body)
      .replace(/\{time\}/g, new Date().toLocaleTimeString())
      .replace(/\{date\}/g, new Date().toLocaleDateString());
  }

  /**
   * Add a new rule
   */
  addRule(sessionId, rule) {
    const rules = this.rules.get(sessionId) || [];
    const newRule = {
      id: `rule_${Date.now()}`,
      ...rule,
      enabled: true,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };
    rules.push(newRule);
    this.rules.set(sessionId, rules);
    this._saveRules();
    
    // Attach listener if not already
    this._attachListener(sessionId);
    
    return newRule;
  }

  /**
   * Update a rule
   */
  updateRule(sessionId, ruleId, updates) {
    const rules = this.rules.get(sessionId) || [];
    const index = rules.findIndex(r => r.id === ruleId);
    if (index === -1) throw new Error('Rule not found');
    
    rules[index] = { ...rules[index], ...updates };
    this._saveRules();
    return rules[index];
  }

  /**
   * Delete a rule
   */
  deleteRule(sessionId, ruleId) {
    const rules = this.rules.get(sessionId) || [];
    const index = rules.findIndex(r => r.id === ruleId);
    if (index === -1) throw new Error('Rule not found');
    
    rules.splice(index, 1);
    this.rules.set(sessionId, rules);
    this._saveRules();
    return { success: true };
  }

  /**
   * Get rules for a session
   */
  getRules(sessionId) {
    return this.rules.get(sessionId) || [];
  }

  /**
   * Get all rules
   */
  getAllRules() {
    const allRules = {};
    for (const [sessionId, rules] of this.rules) {
      allRules[sessionId] = rules;
    }
    return allRules;
  }
}

module.exports = AutoResponderService;
