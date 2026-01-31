/**
 * Memory Routes - API endpoints for memory/preference system
 */

const express = require('express');
const router = express.Router();
const memoryService = require('../services/MemoryService');

// ============================================================================
// CUSTOMERS
// ============================================================================

/**
 * GET /api/memory/customers
 * Get all customers with optional filters
 */
router.get('/customers', (req, res) => {
  try {
    const { tag, isVIP, search } = req.query;
    const customers = memoryService.getAllCustomers({
      tag,
      isVIP: isVIP === 'true' ? true : isVIP === 'false' ? false : undefined,
      search
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/memory/customers/:phone
 * Get customer by phone number
 */
router.get('/customers/:phone', (req, res) => {
  try {
    const customer = memoryService.getCustomer(req.params.phone);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/memory/customers/:phone
 * Update customer information
 */
router.put('/customers/:phone', (req, res) => {
  try {
    const customer = memoryService.updateCustomer(req.params.phone, req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/customers/:phone/preferences
 * Set customer preference
 */
router.post('/customers/:phone/preferences', (req, res) => {
  try {
    const { key, value } = req.body;
    const customer = memoryService.setCustomerPreference(req.params.phone, key, value);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/memory/customers/:phone/preferences/:key
 * Get customer preference
 */
router.get('/customers/:phone/preferences/:key', (req, res) => {
  try {
    const value = memoryService.getCustomerPreference(req.params.phone, req.params.key);
    res.json({ success: true, data: { key: req.params.key, value } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/customers/:phone/notes
 * Add note to customer
 */
router.post('/customers/:phone/notes', (req, res) => {
  try {
    const { note, author } = req.body;
    const customer = memoryService.addCustomerNote(req.params.phone, note, author);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/customers/:phone/orders
 * Add order to customer history
 */
router.post('/customers/:phone/orders', (req, res) => {
  try {
    const customer = memoryService.addOrderToCustomer(req.params.phone, req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/customers/:phone/tags
 * Tag a customer
 */
router.post('/customers/:phone/tags', (req, res) => {
  try {
    const { tag } = req.body;
    const customer = memoryService.tagCustomer(req.params.phone, tag);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/memory/customers/:phone/tags/:tag
 * Remove tag from customer
 */
router.delete('/customers/:phone/tags/:tag', (req, res) => {
  try {
    const customer = memoryService.untagCustomer(req.params.phone, req.params.tag);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * GET /api/memory/conversations/:phone
 * Get conversation history
 */
router.get('/conversations/:phone', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const conversation = memoryService.getConversation(req.params.phone, limit);
    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/conversations/:phone/messages
 * Store a message in conversation
 */
router.post('/conversations/:phone/messages', (req, res) => {
  try {
    const { message, direction } = req.body;
    const conversation = memoryService.storeMessage(req.params.phone, message, direction);
    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/conversations/:phone/context
 * Set conversation context
 */
router.post('/conversations/:phone/context', (req, res) => {
  try {
    const { key, value } = req.body;
    memoryService.setConversationContext(req.params.phone, key, value);
    res.json({ success: true, data: { key, value } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/memory/conversations/:phone/context
 * Get conversation context
 */
router.get('/conversations/:phone/context', (req, res) => {
  try {
    const context = memoryService.getConversationContext(req.params.phone);
    res.json({ success: true, data: context });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// BOT MEMORY
// ============================================================================

/**
 * POST /api/memory/bot/learn
 * Teach bot a new pattern
 */
router.post('/bot/learn', (req, res) => {
  try {
    const { trigger, response, category } = req.body;
    memoryService.learnPattern(trigger, response, category);
    res.json({ success: true, message: 'Pattern learned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/bot/ask
 * Ask bot for a learned response
 */
router.post('/bot/ask', (req, res) => {
  try {
    const { message } = req.body;
    const response = memoryService.getLearnedResponse(message);
    res.json({ success: true, data: { response, found: !!response } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/memory/bot/faqs
 * Get all FAQs
 */
router.get('/bot/faqs', (req, res) => {
  try {
    const faqs = memoryService.getAllFAQs();
    res.json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/bot/faqs
 * Create a new FAQ
 */
router.post('/bot/faqs', (req, res) => {
  try {
    const { question, answer, keywords } = req.body;
    memoryService.storeFAQ(question, answer, keywords || []);
    res.json({ success: true, message: 'FAQ created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/bot/faqs/search
 * Search for FAQ answer
 */
router.post('/bot/faqs/search', (req, res) => {
  try {
    const { query } = req.body;
    const answer = memoryService.findFAQAnswer(query);
    res.json({ success: true, data: { answer, found: !!answer } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/memory/bot/business
 * Get all business info
 */
router.get('/bot/business', (req, res) => {
  try {
    const info = memoryService.getBusinessInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/bot/business
 * Set business info
 */
router.post('/bot/business', (req, res) => {
  try {
    const { key, value } = req.body;
    memoryService.setBusinessInfo(key, value);
    res.json({ success: true, data: { key, value } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PREFERENCES (App-wide)
// ============================================================================

/**
 * GET /api/memory/preferences
 * Get all preferences
 */
router.get('/preferences', (req, res) => {
  try {
    const preferences = memoryService.getAllPreferences();
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/memory/preferences/:category
 * Get preferences for a category
 */
router.get('/preferences/:category', (req, res) => {
  try {
    const preferences = memoryService.getPreference(req.params.category);
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/preferences/:category
 * Set preferences for a category
 */
router.post('/preferences/:category', (req, res) => {
  try {
    const preferences = memoryService.setPreferences(req.params.category, req.body);
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/memory/preferences/:category/:key
 * Set a single preference
 */
router.put('/preferences/:category/:key', (req, res) => {
  try {
    const { value } = req.body;
    const result = memoryService.setPreference(req.params.category, req.params.key, value);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * GET /api/memory/analytics
 * Get analytics summary
 */
router.get('/analytics', (req, res) => {
  try {
    const analytics = memoryService.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

/**
 * GET /api/memory/export
 * Export all data
 */
router.get('/export', (req, res) => {
  try {
    const data = memoryService.exportData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/import
 * Import data
 */
router.post('/import', (req, res) => {
  try {
    memoryService.importData(req.body);
    res.json({ success: true, message: 'Data imported successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/save
 * Force save to disk
 */
router.post('/save', (req, res) => {
  try {
    memoryService.saveData();
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
