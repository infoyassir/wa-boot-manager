/**
 * E-commerce Routes for WhatsApp Bot Manager
 * Handles tickets, promotions, gift cards, catalogs, and analytics
 */

const express = require('express');
const router = express.Router();

// ============================================
// TICKET ROUTES
// ============================================

/**
 * Send a ticket/receipt via WhatsApp
 */
router.post('/tickets/send', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      ticket
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    // Format ticket message
    const ticketMessage = formatTicketMessage(ticket);
    
    // Send message
    const result = await messageService.sendText(sessionId, phone, ticketMessage);
    
    // Log analytics
    logAnalytics('ticket_sent', {
      sessionId,
      phone,
      orderId: ticket.orderId,
      total: ticket.total
    });

    res.json({
      success: true,
      messageId: result.id,
      ticket: ticket.orderId
    });
  } catch (error) {
    console.error('Error sending ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Send ticket with PDF attachment
 */
router.post('/tickets/send-pdf', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      ticket,
      pdfBase64
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    // Send text first
    const ticketMessage = formatTicketMessage(ticket);
    await messageService.sendText(sessionId, phone, ticketMessage);

    // Then send PDF
    if (pdfBase64) {
      await messageService.sendDocument(sessionId, phone, {
        document: pdfBase64,
        filename: `ticket-${ticket.orderId}.pdf`,
        caption: `📄 Ticket de caisse - ${ticket.orderId}`
      });
    }

    res.json({ success: true, ticket: ticket.orderId });
  } catch (error) {
    console.error('Error sending ticket PDF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PROMOTION ROUTES
// ============================================

/**
 * Send a promotion to a customer
 */
router.post('/promotions/send', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      promotion
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const promoMessage = formatPromotionMessage(promotion);
    
    // Send with image if available
    if (promotion.imageUrl) {
      await messageService.sendImage(sessionId, phone, {
        image: promotion.imageUrl,
        caption: promoMessage
      });
    } else {
      await messageService.sendText(sessionId, phone, promoMessage);
    }

    logAnalytics('promo_sent', {
      sessionId,
      phone,
      promoId: promotion.id,
      code: promotion.promoCode
    });

    res.json({ success: true, promoId: promotion.id });
  } catch (error) {
    console.error('Error sending promotion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Send bulk promotions (campaign)
 */
router.post('/promotions/send-bulk', async (req, res) => {
  try {
    const {
      sessionId,
      recipients,
      promotion,
      delay = 3000
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const promoMessage = formatPromotionMessage(promotion);
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const recipient of recipients) {
      try {
        if (promotion.imageUrl) {
          await messageService.sendImage(sessionId, recipient.phone, {
            image: promotion.imageUrl,
            caption: promoMessage.replace('{{name}}', recipient.name || '')
          });
        } else {
          await messageService.sendText(
            sessionId,
            recipient.phone,
            promoMessage.replace('{{name}}', recipient.name || '')
          );
        }
        results.sent++;
        
        // Delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        results.failed++;
        results.errors.push({ phone: recipient.phone, error: error.message });
      }
    }

    logAnalytics('promo_campaign_sent', {
      sessionId,
      promoId: promotion.id,
      sent: results.sent,
      failed: results.failed
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error sending bulk promotions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GIFT CARD ROUTES
// ============================================

/**
 * Send a gift card
 */
router.post('/giftcards/send', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      giftCard
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const giftCardMessage = formatGiftCardMessage(giftCard);
    await messageService.sendText(sessionId, phone, giftCardMessage);

    logAnalytics('giftcard_sent', {
      sessionId,
      phone,
      giftCardId: giftCard.id,
      amount: giftCard.amount
    });

    res.json({ success: true, giftCardId: giftCard.id });
  } catch (error) {
    console.error('Error sending gift card:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CATALOG ROUTES
// ============================================

/**
 * Send product catalog
 */
router.post('/catalogs/send', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      products,
      title = 'Nos produits'
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const catalogMessage = formatCatalogMessage(products, title);
    await messageService.sendText(sessionId, phone, catalogMessage);

    // Send product images if available
    for (const product of products.slice(0, 5)) { // Limit to 5 images
      if (product.imageUrl) {
        await messageService.sendImage(sessionId, phone, {
          image: product.imageUrl,
          caption: `📦 ${product.name}\n💰 ${product.price}€\n${product.description || ''}`
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logAnalytics('catalog_sent', {
      sessionId,
      phone,
      productCount: products.length
    });

    res.json({ success: true, productCount: products.length });
  } catch (error) {
    console.error('Error sending catalog:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Send single product
 */
router.post('/catalogs/send-product', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      product
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const productMessage = formatProductMessage(product);
    
    if (product.imageUrl) {
      await messageService.sendImage(sessionId, phone, {
        image: product.imageUrl,
        caption: productMessage
      });
    } else {
      await messageService.sendText(sessionId, phone, productMessage);
    }

    res.json({ success: true, productId: product.id });
  } catch (error) {
    console.error('Error sending product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// LOYALTY ROUTES
// ============================================

/**
 * Send loyalty notification
 */
router.post('/loyalty/notify', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      loyalty
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const loyaltyMessage = formatLoyaltyMessage(loyalty);
    await messageService.sendText(sessionId, phone, loyaltyMessage);

    logAnalytics('loyalty_notification_sent', {
      sessionId,
      phone,
      points: loyalty.currentPoints
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending loyalty notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Send birthday greeting
 */
router.post('/loyalty/birthday', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      customer,
      offer
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const birthdayMessage = formatBirthdayMessage(customer, offer);
    await messageService.sendText(sessionId, phone, birthdayMessage);

    logAnalytics('birthday_greeting_sent', {
      sessionId,
      phone,
      customerId: customer.id
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending birthday greeting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// REMINDER ROUTES
// ============================================

/**
 * Send payment reminder
 */
router.post('/reminders/payment', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      invoice
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const reminderMessage = formatPaymentReminderMessage(invoice);
    await messageService.sendText(sessionId, phone, reminderMessage);

    logAnalytics('payment_reminder_sent', {
      sessionId,
      phone,
      invoiceId: invoice.id,
      amount: invoice.amount
    });

    res.json({ success: true, invoiceId: invoice.id });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Send back-in-stock notification
 */
router.post('/reminders/back-in-stock', async (req, res) => {
  try {
    const {
      sessionId,
      phone,
      product,
      customer
    } = req.body;

    const { MessageService } = require('../services/MessageService');
    const messageService = new MessageService();

    const message = formatBackInStockMessage(product, customer);
    
    if (product.imageUrl) {
      await messageService.sendImage(sessionId, phone, {
        image: product.imageUrl,
        caption: message
      });
    } else {
      await messageService.sendText(sessionId, phone, message);
    }

    logAnalytics('back_in_stock_sent', {
      sessionId,
      phone,
      productId: product.id
    });

    res.json({ success: true, productId: product.id });
  } catch (error) {
    console.error('Error sending back-in-stock notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

/**
 * Get analytics data
 */
router.get('/analytics', async (req, res) => {
  try {
    const { from, to, sessionId } = req.query;
    const fs = require('fs').promises;
    const path = require('path');
    
    const analyticsPath = path.join(__dirname, '../data/analytics.json');
    
    let analytics = {
      totalMessagesSent: 0,
      totalMessagesDelivered: 0,
      totalMessagesRead: 0,
      ticketsSent: 0,
      promosSent: 0,
      giftCardsSent: 0,
      catalogsSent: 0,
      loyaltyNotificationsSent: 0,
      uniqueRecipients: 0,
      deliveryRate: 0,
      readRate: 0,
      topTemplates: [],
      activityByHour: {}
    };

    try {
      const data = await fs.readFile(analyticsPath, 'utf8');
      analytics = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet, use defaults
    }

    // Calculate rates
    if (analytics.totalMessagesSent > 0) {
      analytics.deliveryRate = (analytics.totalMessagesDelivered / analytics.totalMessagesSent) * 100;
      analytics.readRate = (analytics.totalMessagesRead / analytics.totalMessagesSent) * 100;
    }

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get message history
 */
router.get('/analytics/messages', async (req, res) => {
  try {
    const { from, to, type, limit = 50, offset = 0 } = req.query;
    const fs = require('fs').promises;
    const path = require('path');
    
    const messagesPath = path.join(__dirname, '../data/messages.json');
    
    let messages = [];
    try {
      const data = await fs.readFile(messagesPath, 'utf8');
      messages = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet
    }

    // Filter by type if specified
    if (type) {
      messages = messages.filter(m => m.type === type);
    }

    // Filter by date range
    if (from) {
      const fromDate = new Date(from);
      messages = messages.filter(m => new Date(m.sentAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      messages = messages.filter(m => new Date(m.sentAt) <= toDate);
    }

    // Paginate
    const total = messages.length;
    messages = messages.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      messages,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting message history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTicketMessage(ticket) {
  const lines = ticket.lines.map(line => 
    `  • ${line.quantity}x ${line.productName}: ${line.subtotal.toFixed(2)}€`
  ).join('\n');

  return `🧾 *TICKET DE CAISSE*
━━━━━━━━━━━━━━━━━
🏪 ${ticket.shopName || 'Notre Boutique'}
📅 ${new Date(ticket.date).toLocaleDateString('fr-FR')} ${new Date(ticket.date).toLocaleTimeString('fr-FR')}
🆔 ${ticket.orderId}
━━━━━━━━━━━━━━━━━

📝 *Articles:*
${lines}

━━━━━━━━━━━━━━━━━
${ticket.discount ? `🎁 Remise: -${ticket.discount.toFixed(2)}€\n` : ''}💰 *TOTAL: ${ticket.total.toFixed(2)}€*

💳 Paiement: ${ticket.paymentMethod}
${ticket.loyaltyPoints ? `⭐ Points gagnés: +${ticket.loyaltyPoints}` : ''}

Merci de votre visite! 🙏`;
}

function formatPromotionMessage(promo) {
  return `🎉 *OFFRE SPÉCIALE* 🎉
━━━━━━━━━━━━━━━━━

${promo.title}

${promo.description}

${promo.promoCode ? `🎁 *Code promo:* ${promo.promoCode}` : ''}
${promo.discount ? `💰 *Réduction:* ${promo.discount}` : ''}
${promo.validUntil ? `⏰ *Valable jusqu'au:* ${new Date(promo.validUntil).toLocaleDateString('fr-FR')}` : ''}

📍 En boutique et en ligne!

_Conditions générales applicables_`;
}

function formatGiftCardMessage(giftCard) {
  return `🎁 *CARTE CADEAU* 🎁
━━━━━━━━━━━━━━━━━

Félicitations! Vous avez reçu une carte cadeau!

💰 *Valeur:* ${giftCard.amount.toFixed(2)}€
🔑 *Code:* ${giftCard.code}
📅 *Valable jusqu'au:* ${new Date(giftCard.expiresAt).toLocaleDateString('fr-FR')}

${giftCard.message ? `\n💌 Message:\n"${giftCard.message}"` : ''}

${giftCard.senderName ? `\nDe la part de: ${giftCard.senderName}` : ''}

_Présentez ce code en caisse ou utilisez-le sur notre site!_`;
}

function formatCatalogMessage(products, title) {
  const productList = products.slice(0, 10).map((p, i) => 
    `${i + 1}. *${p.name}* - ${p.price.toFixed(2)}€`
  ).join('\n');

  return `📦 *${title.toUpperCase()}*
━━━━━━━━━━━━━━━━━

${productList}

${products.length > 10 ? `\n_...et ${products.length - 10} autres produits_` : ''}

📞 Contactez-nous pour commander!`;
}

function formatProductMessage(product) {
  return `📦 *${product.name}*
━━━━━━━━━━━━━━━━━

${product.description || ''}

💰 *Prix:* ${product.price.toFixed(2)}€
${product.stock > 0 ? `✅ En stock (${product.stock} disponibles)` : '❌ Rupture de stock'}
${product.category ? `📂 Catégorie: ${product.category}` : ''}

_Répondez à ce message pour commander!_`;
}

function formatLoyaltyMessage(loyalty) {
  return `⭐ *PROGRAMME FIDÉLITÉ* ⭐
━━━━━━━━━━━━━━━━━

Bonjour ${loyalty.customerName || ''}!

📊 *Vos points:* ${loyalty.currentPoints} pts
🏆 *Niveau:* ${loyalty.level || 'Standard'}
${loyalty.pointsToNextLevel ? `📈 *Points pour niveau suivant:* ${loyalty.pointsToNextLevel}` : ''}

${loyalty.availableRewards && loyalty.availableRewards.length > 0 ? 
  `\n🎁 *Récompenses disponibles:*\n${loyalty.availableRewards.map(r => `  • ${r}`).join('\n')}` : ''}

Continuez vos achats pour gagner plus de points! 🛍️`;
}

function formatBirthdayMessage(customer, offer) {
  return `🎂 *JOYEUX ANNIVERSAIRE* 🎂
━━━━━━━━━━━━━━━━━

Cher(e) ${customer.name},

Toute l'équipe vous souhaite un merveilleux anniversaire! 🥳

${offer ? `\n🎁 *Cadeau spécial:*\n${offer.description}\n${offer.code ? `Code: *${offer.code}*` : ''}` : ''}

Passez nous voir pour célébrer ça ensemble! 🎉`;
}

function formatPaymentReminderMessage(invoice) {
  return `📋 *RAPPEL DE PAIEMENT*
━━━━━━━━━━━━━━━━━

Bonjour,

Nous vous rappelons qu'une facture est en attente:

🆔 Facture: ${invoice.number || invoice.id}
💰 Montant: ${invoice.amount.toFixed(2)}€
📅 Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
${invoice.daysOverdue > 0 ? `⚠️ Retard: ${invoice.daysOverdue} jours` : ''}

Merci de procéder au règlement dans les meilleurs délais.

_Pour toute question, contactez-nous._`;
}

function formatBackInStockMessage(product, customer) {
  return `🔔 *RETOUR EN STOCK* 🔔
━━━━━━━━━━━━━━━━━

Bonjour ${customer?.name || ''}!

Bonne nouvelle! Le produit que vous attendiez est de nouveau disponible:

📦 *${product.name}*
💰 Prix: ${product.price.toFixed(2)}€
✅ En stock!

Dépêchez-vous, les stocks sont limités! 🏃‍♂️

_Répondez pour réserver votre article!_`;
}

// Analytics logging helper
function logAnalytics(event, data) {
  const fs = require('fs');
  const path = require('path');
  
  const analyticsPath = path.join(__dirname, '../data/analytics.json');
  const messagesPath = path.join(__dirname, '../data/messages.json');
  
  // Update analytics
  try {
    let analytics = {};
    try {
      analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
    } catch (e) {
      analytics = {
        totalMessagesSent: 0,
        totalMessagesDelivered: 0,
        totalMessagesRead: 0,
        ticketsSent: 0,
        promosSent: 0,
        giftCardsSent: 0,
        catalogsSent: 0,
        loyaltyNotificationsSent: 0,
        uniqueRecipients: new Set()
      };
    }

    analytics.totalMessagesSent++;
    
    switch (event) {
      case 'ticket_sent':
        analytics.ticketsSent++;
        break;
      case 'promo_sent':
      case 'promo_campaign_sent':
        analytics.promosSent += data.sent || 1;
        break;
      case 'giftcard_sent':
        analytics.giftCardsSent++;
        break;
      case 'catalog_sent':
        analytics.catalogsSent++;
        break;
      case 'loyalty_notification_sent':
      case 'birthday_greeting_sent':
        analytics.loyaltyNotificationsSent++;
        break;
    }

    fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));

    // Log message
    let messages = [];
    try {
      messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    } catch (e) {
      messages = [];
    }

    messages.unshift({
      event,
      ...data,
      sentAt: new Date().toISOString()
    });

    // Keep only last 1000 messages
    messages = messages.slice(0, 1000);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

  } catch (error) {
    console.error('Error logging analytics:', error);
  }
}

module.exports = router;
