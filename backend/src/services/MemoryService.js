/**
 * Memory Service - Persistent storage for bot intelligence
 * 
 * Features:
 * - Customer preferences and history
 * - Conversation context and memory
 * - Smart bot learning and responses
 * - Analytics and insights
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class MemoryService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/memory.json');
    this.data = this.loadData();
    this.autoSaveInterval = null;
    this.startAutoSave();
  }

  // ============================================================================
  // DATA PERSISTENCE
  // ============================================================================

  loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const raw = fs.readFileSync(this.dataPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (error) {
      console.error('Error loading memory data:', error);
    }
    return {
      customers: {},
      preferences: {},
      conversations: {},
      botMemory: {},
      analytics: {
        totalMessages: 0,
        totalCustomers: 0,
        lastUpdated: null
      }
    };
  }

  saveData() {
    try {
      this.data.analytics.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving memory data:', error);
      return false;
    }
  }

  startAutoSave() {
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveData();
    }, 30000);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  // ============================================================================
  // CUSTOMER MANAGEMENT
  // ============================================================================

  /**
   * Get or create a customer record
   */
  getCustomer(phoneNumber) {
    const normalized = this.normalizePhone(phoneNumber);
    
    if (!this.data.customers[normalized]) {
      this.data.customers[normalized] = {
        id: uuidv4(),
        phone: normalized,
        name: null,
        email: null,
        tags: [],
        preferences: {},
        notes: [],
        orderHistory: [],
        messageCount: 0,
        lastContact: null,
        firstContact: new Date().toISOString(),
        language: 'fr',
        timezone: 'Africa/Casablanca',
        isVIP: false,
        loyaltyPoints: 0,
        metadata: {}
      };
      this.data.analytics.totalCustomers++;
      this.saveData();
    }
    
    return this.data.customers[normalized];
  }

  /**
   * Update customer information
   */
  updateCustomer(phoneNumber, updates) {
    const customer = this.getCustomer(phoneNumber);
    Object.assign(customer, updates, { updatedAt: new Date().toISOString() });
    this.saveData();
    return customer;
  }

  /**
   * Set customer preference
   */
  setCustomerPreference(phoneNumber, key, value) {
    const customer = this.getCustomer(phoneNumber);
    customer.preferences[key] = value;
    this.saveData();
    return customer;
  }

  /**
   * Get customer preference
   */
  getCustomerPreference(phoneNumber, key, defaultValue = null) {
    const customer = this.getCustomer(phoneNumber);
    return customer.preferences[key] ?? defaultValue;
  }

  /**
   * Add note to customer
   */
  addCustomerNote(phoneNumber, note, author = 'system') {
    const customer = this.getCustomer(phoneNumber);
    customer.notes.push({
      id: uuidv4(),
      content: note,
      author,
      createdAt: new Date().toISOString()
    });
    this.saveData();
    return customer;
  }

  /**
   * Add order to customer history
   */
  addOrderToCustomer(phoneNumber, order) {
    const customer = this.getCustomer(phoneNumber);
    customer.orderHistory.push({
      ...order,
      addedAt: new Date().toISOString()
    });
    this.saveData();
    return customer;
  }

  /**
   * Get all customers
   */
  getAllCustomers(filters = {}) {
    let customers = Object.values(this.data.customers);
    
    if (filters.tag) {
      customers = customers.filter(c => c.tags.includes(filters.tag));
    }
    if (filters.isVIP !== undefined) {
      customers = customers.filter(c => c.isVIP === filters.isVIP);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      customers = customers.filter(c => 
        c.phone.includes(search) ||
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search))
      );
    }
    
    return customers;
  }

  /**
   * Tag a customer
   */
  tagCustomer(phoneNumber, tag) {
    const customer = this.getCustomer(phoneNumber);
    if (!customer.tags.includes(tag)) {
      customer.tags.push(tag);
      this.saveData();
    }
    return customer;
  }

  /**
   * Remove tag from customer
   */
  untagCustomer(phoneNumber, tag) {
    const customer = this.getCustomer(phoneNumber);
    customer.tags = customer.tags.filter(t => t !== tag);
    this.saveData();
    return customer;
  }

  // ============================================================================
  // CONVERSATION MEMORY
  // ============================================================================

  /**
   * Store conversation message
   */
  storeMessage(phoneNumber, message, direction = 'incoming') {
    const normalized = this.normalizePhone(phoneNumber);
    
    if (!this.data.conversations[normalized]) {
      this.data.conversations[normalized] = {
        messages: [],
        context: {},
        lastIntent: null,
        lastTopic: null
      };
    }
    
    const conversation = this.data.conversations[normalized];
    conversation.messages.push({
      id: uuidv4(),
      content: message,
      direction, // 'incoming' or 'outgoing'
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 messages per conversation
    if (conversation.messages.length > 100) {
      conversation.messages = conversation.messages.slice(-100);
    }
    
    // Update customer stats
    const customer = this.getCustomer(phoneNumber);
    customer.messageCount++;
    customer.lastContact = new Date().toISOString();
    
    this.data.analytics.totalMessages++;
    this.saveData();
    
    return conversation;
  }

  /**
   * Get conversation history
   */
  getConversation(phoneNumber, limit = 50) {
    const normalized = this.normalizePhone(phoneNumber);
    const conversation = this.data.conversations[normalized];
    
    if (!conversation) {
      return { messages: [], context: {} };
    }
    
    return {
      messages: conversation.messages.slice(-limit),
      context: conversation.context,
      lastIntent: conversation.lastIntent,
      lastTopic: conversation.lastTopic
    };
  }

  /**
   * Set conversation context
   */
  setConversationContext(phoneNumber, key, value) {
    const normalized = this.normalizePhone(phoneNumber);
    
    if (!this.data.conversations[normalized]) {
      this.data.conversations[normalized] = {
        messages: [],
        context: {},
        lastIntent: null,
        lastTopic: null
      };
    }
    
    this.data.conversations[normalized].context[key] = value;
    this.saveData();
  }

  /**
   * Get conversation context
   */
  getConversationContext(phoneNumber, key = null) {
    const normalized = this.normalizePhone(phoneNumber);
    const conversation = this.data.conversations[normalized];
    
    if (!conversation) return key ? null : {};
    
    return key ? conversation.context[key] : conversation.context;
  }

  /**
   * Set last detected intent
   */
  setLastIntent(phoneNumber, intent, topic = null) {
    const normalized = this.normalizePhone(phoneNumber);
    
    if (this.data.conversations[normalized]) {
      this.data.conversations[normalized].lastIntent = intent;
      if (topic) {
        this.data.conversations[normalized].lastTopic = topic;
      }
      this.saveData();
    }
  }

  // ============================================================================
  // BOT MEMORY & LEARNING
  // ============================================================================

  /**
   * Store bot learning pattern
   */
  learnPattern(trigger, response, category = 'general') {
    if (!this.data.botMemory.patterns) {
      this.data.botMemory.patterns = [];
    }
    
    // Check if pattern already exists
    const existing = this.data.botMemory.patterns.find(
      p => p.trigger.toLowerCase() === trigger.toLowerCase()
    );
    
    if (existing) {
      existing.responses.push(response);
      existing.usageCount++;
      existing.updatedAt = new Date().toISOString();
    } else {
      this.data.botMemory.patterns.push({
        id: uuidv4(),
        trigger: trigger.toLowerCase(),
        responses: [response],
        category,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    this.saveData();
  }

  /**
   * Get learned response for a trigger
   */
  getLearnedResponse(message) {
    if (!this.data.botMemory.patterns) return null;
    
    const messageLower = message.toLowerCase();
    
    // Find best matching pattern
    for (const pattern of this.data.botMemory.patterns) {
      if (messageLower.includes(pattern.trigger)) {
        // Return random response from learned responses
        const responses = pattern.responses;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    return null;
  }

  /**
   * Store FAQ response
   */
  storeFAQ(question, answer, keywords = []) {
    if (!this.data.botMemory.faqs) {
      this.data.botMemory.faqs = [];
    }
    
    this.data.botMemory.faqs.push({
      id: uuidv4(),
      question,
      answer,
      keywords,
      usageCount: 0,
      createdAt: new Date().toISOString()
    });
    
    this.saveData();
  }

  /**
   * Find FAQ answer
   */
  findFAQAnswer(query) {
    if (!this.data.botMemory.faqs) return null;
    
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const faq of this.data.botMemory.faqs) {
      let score = 0;
      
      // Check keywords
      for (const keyword of faq.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
      
      // Check question similarity
      const questionWords = faq.question.toLowerCase().split(/\s+/);
      for (const word of queryWords) {
        if (questionWords.includes(word)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }
    
    if (bestMatch && bestScore >= 2) {
      bestMatch.usageCount++;
      this.saveData();
      return bestMatch.answer;
    }
    
    return null;
  }

  /**
   * Get all FAQs
   */
  getAllFAQs() {
    return this.data.botMemory.faqs || [];
  }

  /**
   * Store business info for bot
   */
  setBusinessInfo(key, value) {
    if (!this.data.botMemory.businessInfo) {
      this.data.botMemory.businessInfo = {};
    }
    this.data.botMemory.businessInfo[key] = value;
    this.saveData();
  }

  /**
   * Get business info
   */
  getBusinessInfo(key = null) {
    const info = this.data.botMemory.businessInfo || {};
    return key ? info[key] : info;
  }

  // ============================================================================
  // PREFERENCES (App-wide settings)
  // ============================================================================

  /**
   * Set application preference
   */
  setPreference(category, key, value) {
    if (!this.data.preferences[category]) {
      this.data.preferences[category] = {};
    }
    this.data.preferences[category][key] = value;
    this.saveData();
    return { category, key, value };
  }

  /**
   * Get application preference
   */
  getPreference(category, key = null, defaultValue = null) {
    const categoryData = this.data.preferences[category] || {};
    if (key === null) return categoryData;
    return categoryData[key] ?? defaultValue;
  }

  /**
   * Get all preferences
   */
  getAllPreferences() {
    return this.data.preferences;
  }

  /**
   * Set multiple preferences at once
   */
  setPreferences(category, preferences) {
    if (!this.data.preferences[category]) {
      this.data.preferences[category] = {};
    }
    Object.assign(this.data.preferences[category], preferences);
    this.saveData();
    return this.data.preferences[category];
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get analytics summary
   */
  getAnalytics() {
    const customers = Object.values(this.data.customers);
    const conversations = Object.values(this.data.conversations);
    
    return {
      ...this.data.analytics,
      activeCustomers: customers.filter(c => {
        if (!c.lastContact) return false;
        const lastContact = new Date(c.lastContact);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastContact > dayAgo;
      }).length,
      vipCustomers: customers.filter(c => c.isVIP).length,
      averageMessagesPerCustomer: customers.length > 0
        ? Math.round(this.data.analytics.totalMessages / customers.length)
        : 0,
      topTags: this.getTopTags(),
      recentActivity: this.getRecentActivity()
    };
  }

  /**
   * Get top customer tags
   */
  getTopTags() {
    const tagCounts = {};
    for (const customer of Object.values(this.data.customers)) {
      for (const tag of customer.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }

  /**
   * Get recent activity
   */
  getRecentActivity() {
    const activities = [];
    
    for (const [phone, conversation] of Object.entries(this.data.conversations)) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage) {
        activities.push({
          phone,
          message: lastMessage.content.substring(0, 50),
          direction: lastMessage.direction,
          timestamp: lastMessage.timestamp
        });
      }
    }
    
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  normalizePhone(phone) {
    let normalized = phone.replace(/[^\d]/g, '');
    if (normalized.startsWith('0')) {
      normalized = '212' + normalized.substring(1);
    } else if (!normalized.startsWith('212') && normalized.length === 9) {
      normalized = '212' + normalized;
    }
    return normalized;
  }

  /**
   * Export all data
   */
  exportData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  /**
   * Import data
   */
  importData(data) {
    this.data = { ...this.data, ...data };
    this.saveData();
    return true;
  }

  /**
   * Clear all data (dangerous!)
   */
  clearAllData() {
    this.data = {
      customers: {},
      preferences: {},
      conversations: {},
      botMemory: {},
      analytics: {
        totalMessages: 0,
        totalCustomers: 0,
        lastUpdated: null
      }
    };
    this.saveData();
    return true;
  }
}

// Singleton instance
const memoryService = new MemoryService();

module.exports = memoryService;
