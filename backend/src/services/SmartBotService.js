/**
 * Smart Bot Service - Intelligent auto-response system
 * 
 * Features:
 * - Intent detection
 * - Context-aware responses
 * - Customer memory integration
 * - FAQ matching
 * - Learning from interactions
 */

const memoryService = require('./MemoryService');

class SmartBotService {
  constructor(sessionManager, messageService) {
    this.sessionManager = sessionManager;
    this.messageService = messageService;
    this.enabled = true;
    
    // Intent patterns (simple regex-based for now)
    this.intentPatterns = {
      greeting: [
        /^(bonjour|salut|hello|hi|hey|salam|bonsoir)/i,
        /^(bsr|bjr|slm)/i,
      ],
      priceInquiry: [
        /prix|coût|combien|tarif/i,
        /c'est combien|ça coûte/i,
      ],
      orderStatus: [
        /commande|livraison|colis|suivi/i,
        /où est ma commande|statut/i,
      ],
      productInquiry: [
        /produit|article|disponible|stock/i,
        /vous avez|avez-vous/i,
      ],
      hours: [
        /horaire|ouvert|fermé|heure/i,
        /quand êtes-vous ouvert/i,
      ],
      location: [
        /adresse|où êtes-vous|localisation/i,
        /comment venir|itinéraire/i,
      ],
      thanks: [
        /merci|thanks|shukran/i,
      ],
      goodbye: [
        /au revoir|bye|à bientôt|bonne journée/i,
      ],
      help: [
        /aide|help|assistance|support/i,
        /problème|souci|issue/i,
      ],
      complaint: [
        /plainte|réclamation|pas content|mécontent/i,
        /remboursement|annuler/i,
      ],
    };
    
    // Default responses
    this.defaultResponses = {
      greeting: [
        "Bonjour! 👋 Comment puis-je vous aider aujourd'hui?",
        "Salam! 👋 Bienvenue, que puis-je faire pour vous?",
        "Bonjour et bienvenue! Comment puis-je vous assister?",
      ],
      thanks: [
        "Avec plaisir! 😊",
        "Je vous en prie! N'hésitez pas si vous avez d'autres questions.",
        "De rien! Bonne journée! 🙏",
      ],
      goodbye: [
        "Au revoir et à bientôt! 👋",
        "Bonne journée! N'hésitez pas à revenir.",
        "À très bientôt! 🙏",
      ],
      help: [
        "Je suis là pour vous aider! 🤝\n\nVoici ce que je peux faire:\n• Répondre à vos questions\n• Vous informer sur nos produits\n• Suivre vos commandes\n• Prendre vos commandes\n\nQue souhaitez-vous faire?",
      ],
      unknown: [
        "Je n'ai pas bien compris votre demande. Pouvez-vous reformuler?",
        "Désolé, je ne suis pas sûr de comprendre. Pouvez-vous préciser?",
        "Je vais transférer votre message à notre équipe. Un agent vous répondra bientôt.",
      ],
    };
  }

  /**
   * Process incoming message and generate smart response
   */
  async processMessage(sessionId, fromPhone, message) {
    if (!this.enabled) return null;

    try {
      // Get/create customer record
      const customer = memoryService.getCustomer(fromPhone);
      
      // Store incoming message
      memoryService.storeMessage(fromPhone, message, 'incoming');
      
      // Get conversation context
      const conversation = memoryService.getConversation(fromPhone, 10);
      
      // Detect intent
      const intent = this.detectIntent(message);
      memoryService.setLastIntent(fromPhone, intent.name, intent.topic);
      
      // Get response
      let response = null;
      
      // 1. First, check FAQs
      response = memoryService.findFAQAnswer(message);
      if (response) {
        return this.sendResponse(sessionId, fromPhone, response, 'faq');
      }
      
      // 2. Check learned patterns
      response = memoryService.getLearnedResponse(message);
      if (response) {
        return this.sendResponse(sessionId, fromPhone, response, 'learned');
      }
      
      // 3. Use intent-based response
      response = await this.generateIntentResponse(intent, customer, conversation);
      if (response) {
        return this.sendResponse(sessionId, fromPhone, response, 'intent');
      }
      
      // 4. Default fallback
      return this.sendResponse(
        sessionId, 
        fromPhone, 
        this.getRandomResponse('unknown'),
        'fallback'
      );
      
    } catch (error) {
      console.error('Smart bot error:', error);
      return null;
    }
  }

  /**
   * Detect intent from message
   */
  detectIntent(message) {
    for (const [intentName, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          return { name: intentName, confidence: 0.8 };
        }
      }
    }
    return { name: 'unknown', confidence: 0.2 };
  }

  /**
   * Generate response based on intent
   */
  async generateIntentResponse(intent, customer, conversation) {
    switch (intent.name) {
      case 'greeting':
        return this.generateGreeting(customer);
      
      case 'thanks':
        return this.getRandomResponse('thanks');
      
      case 'goodbye':
        return this.getRandomResponse('goodbye');
      
      case 'help':
        return this.getRandomResponse('help');
      
      case 'hours':
        return this.getBusinessHoursResponse();
      
      case 'location':
        return this.getLocationResponse();
      
      case 'priceInquiry':
        return this.getPriceInquiryResponse(customer, conversation);
      
      case 'orderStatus':
        return this.getOrderStatusResponse(customer);
      
      case 'productInquiry':
        return this.getProductInquiryResponse();
      
      case 'complaint':
        return this.getComplaintResponse(customer);
      
      default:
        return null;
    }
  }

  /**
   * Generate personalized greeting
   */
  generateGreeting(customer) {
    const time = new Date().getHours();
    let timeGreeting = 'Bonjour';
    if (time >= 18) timeGreeting = 'Bonsoir';
    else if (time < 6) timeGreeting = 'Bonsoir';
    
    if (customer.name) {
      return `${timeGreeting} ${customer.name}! 👋\nComment puis-je vous aider aujourd'hui?`;
    }
    
    if (customer.messageCount > 5) {
      return `${timeGreeting}! 👋 Content de vous revoir!\nQue puis-je faire pour vous?`;
    }
    
    return this.getRandomResponse('greeting');
  }

  /**
   * Get business hours response
   */
  getBusinessHoursResponse() {
    const info = memoryService.getBusinessInfo();
    if (info.hours) {
      return `🕐 Nos horaires d'ouverture:\n${info.hours}`;
    }
    return "🕐 Nous sommes généralement ouverts du lundi au samedi, de 9h à 19h.\nContactez-nous pour plus de détails!";
  }

  /**
   * Get location response
   */
  getLocationResponse() {
    const info = memoryService.getBusinessInfo();
    if (info.address) {
      let response = `📍 Notre adresse:\n${info.address}`;
      if (info.mapLink) {
        response += `\n\n🗺️ Voir sur la carte: ${info.mapLink}`;
      }
      return response;
    }
    return "📍 Contactez-nous pour obtenir notre adresse exacte et les indications pour nous trouver!";
  }

  /**
   * Get price inquiry response
   */
  getPriceInquiryResponse(customer, conversation) {
    const lastProduct = conversation.context?.lastProduct;
    if (lastProduct) {
      return `Pour le produit "${lastProduct}", je vérifie le prix pour vous...\nUn instant s'il vous plaît! 🔍`;
    }
    return "Quel produit vous intéresse? Envoyez-moi le nom ou la photo et je vous donnerai le prix! 💰";
  }

  /**
   * Get order status response
   */
  getOrderStatusResponse(customer) {
    if (customer.orderHistory && customer.orderHistory.length > 0) {
      const lastOrder = customer.orderHistory[customer.orderHistory.length - 1];
      return `📦 Votre dernière commande:\nN°: ${lastOrder.id || 'N/A'}\nStatut: ${lastOrder.status || 'En cours'}\n\nPour plus de détails, envoyez "détails commande".`;
    }
    return "Je vais vérifier le statut de votre commande. Pouvez-vous me donner votre numéro de commande? 📦";
  }

  /**
   * Get product inquiry response
   */
  getProductInquiryResponse() {
    return "Quel produit recherchez-vous? 🔍\n\nEnvoyez-moi:\n• Le nom du produit\n• Une description\n• Ou une photo\n\nJe vérifierai la disponibilité pour vous!";
  }

  /**
   * Get complaint response
   */
  getComplaintResponse(customer) {
    // Tag customer for follow-up
    memoryService.tagCustomer(customer.phone, 'complaint');
    memoryService.addCustomerNote(customer.phone, 'Client a exprimé une plainte - à suivre', 'bot');
    
    return "Je suis vraiment désolé pour ce désagrément. 😔\n\nVotre satisfaction est notre priorité. Un responsable va vous contacter très rapidement pour résoudre votre problème.\n\nPouvez-vous me décrire le problème en détail?";
  }

  /**
   * Send response and store in memory
   */
  async sendResponse(sessionId, toPhone, message, responseType) {
    try {
      // Store outgoing message
      memoryService.storeMessage(toPhone, message, 'outgoing');
      
      // Send via WhatsApp
      await this.messageService.sendText(sessionId, toPhone, message);
      
      console.log(`[SmartBot] Sent ${responseType} response to ${toPhone}`);
      
      return { sent: true, type: responseType, message };
    } catch (error) {
      console.error('Failed to send bot response:', error);
      return { sent: false, error: error.message };
    }
  }

  /**
   * Get random response from array
   */
  getRandomResponse(type) {
    const responses = this.defaultResponses[type] || this.defaultResponses.unknown;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Enable/disable bot
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[SmartBot] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Train bot with new pattern
   */
  train(trigger, response, category = 'general') {
    memoryService.learnPattern(trigger, response, category);
    console.log(`[SmartBot] Learned: "${trigger}" -> "${response}"`);
  }

  /**
   * Add FAQ
   */
  addFAQ(question, answer, keywords = []) {
    memoryService.storeFAQ(question, answer, keywords);
    console.log(`[SmartBot] Added FAQ: "${question}"`);
  }

  /**
   * Set business info
   */
  setBusinessInfo(key, value) {
    memoryService.setBusinessInfo(key, value);
  }

  /**
   * Get bot status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      faqs: memoryService.getAllFAQs().length,
      patterns: (memoryService.data?.botMemory?.patterns || []).length,
      businessInfoSet: Object.keys(memoryService.getBusinessInfo()).length > 0,
    };
  }
}

module.exports = SmartBotService;
