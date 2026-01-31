/**
 * Smart Bot Routes - API endpoints for intelligent bot
 */

const express = require('express');
const router = express.Router();

module.exports = (smartBotService) => {
  /**
   * GET /api/bot/status
   * Get bot status
   */
  router.get('/status', (req, res) => {
    try {
      const status = smartBotService.getStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/bot/enable
   * Enable the bot
   */
  router.post('/enable', (req, res) => {
    try {
      smartBotService.setEnabled(true);
      res.json({ success: true, message: 'Bot enabled' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/bot/disable
   * Disable the bot
   */
  router.post('/disable', (req, res) => {
    try {
      smartBotService.setEnabled(false);
      res.json({ success: true, message: 'Bot disabled' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/bot/train
   * Train bot with new pattern
   */
  router.post('/train', (req, res) => {
    try {
      const { trigger, response, category } = req.body;
      if (!trigger || !response) {
        return res.status(400).json({ success: false, error: 'trigger and response are required' });
      }
      smartBotService.train(trigger, response, category);
      res.json({ success: true, message: 'Pattern learned successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/bot/faq
   * Add a new FAQ
   */
  router.post('/faq', (req, res) => {
    try {
      const { question, answer, keywords } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ success: false, error: 'question and answer are required' });
      }
      smartBotService.addFAQ(question, answer, keywords || []);
      res.json({ success: true, message: 'FAQ added successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/bot/business-info
   * Set business information
   */
  router.post('/business-info', (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key) {
        return res.status(400).json({ success: false, error: 'key is required' });
      }
      smartBotService.setBusinessInfo(key, value);
      res.json({ success: true, message: 'Business info updated' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/bot/test
   * Test bot response for a message
   */
  router.post('/test', async (req, res) => {
    try {
      const { message, phone } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: 'message is required' });
      }
      
      // Get intent
      const intent = smartBotService.detectIntent(message);
      
      // Get potential responses
      const memoryService = require('../services/MemoryService');
      const faqAnswer = memoryService.findFAQAnswer(message);
      const learnedResponse = memoryService.getLearnedResponse(message);
      
      res.json({
        success: true,
        data: {
          intent,
          faqAnswer,
          learnedResponse,
          wouldRespond: !!(faqAnswer || learnedResponse || intent.name !== 'unknown'),
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/bot/setup
   * Quick setup wizard for bot
   */
  router.post('/setup', (req, res) => {
    try {
      const { 
        businessName, 
        address, 
        hours, 
        phone, 
        email,
        mapLink,
        welcomeMessage,
        faqs 
      } = req.body;

      // Set business info
      if (businessName) smartBotService.setBusinessInfo('name', businessName);
      if (address) smartBotService.setBusinessInfo('address', address);
      if (hours) smartBotService.setBusinessInfo('hours', hours);
      if (phone) smartBotService.setBusinessInfo('phone', phone);
      if (email) smartBotService.setBusinessInfo('email', email);
      if (mapLink) smartBotService.setBusinessInfo('mapLink', mapLink);
      if (welcomeMessage) smartBotService.setBusinessInfo('welcomeMessage', welcomeMessage);

      // Add FAQs
      if (faqs && Array.isArray(faqs)) {
        for (const faq of faqs) {
          if (faq.question && faq.answer) {
            smartBotService.addFAQ(faq.question, faq.answer, faq.keywords || []);
          }
        }
      }

      // Enable bot
      smartBotService.setEnabled(true);

      res.json({ success: true, message: 'Bot setup completed' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
