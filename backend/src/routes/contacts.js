const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const DATA_PATH = './data/contacts.json';

// Ensure data file exists
const ensureDataFile = () => {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 2));
  }
};

const readContacts = () => {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
};

const writeContacts = (contacts) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(contacts, null, 2));
};

// GET /api/contacts - Get all contacts
router.get('/', (req, res) => {
  const contacts = readContacts();
  const { search, tag } = req.query;

  let filtered = contacts;

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(s) || 
      c.phone.includes(s) ||
      (c.email && c.email.toLowerCase().includes(s))
    );
  }

  if (tag) {
    filtered = filtered.filter(c => c.tags && c.tags.includes(tag));
  }

  res.json({ success: true, data: filtered });
});

// GET /api/contacts/:id - Get contact by ID
router.get('/:id', (req, res) => {
  const contacts = readContacts();
  const contact = contacts.find(c => c.id === req.params.id);

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  res.json({ success: true, data: contact });
});

// POST /api/contacts - Create new contact
router.post('/', (req, res) => {
  const { name, phone, email, notes, tags = [] } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  const contacts = readContacts();
  
  // Check for duplicate phone
  if (contacts.find(c => c.phone === phone)) {
    return res.status(400).json({ error: 'Contact with this phone already exists' });
  }

  const newContact = {
    id: uuidv4(),
    name,
    phone,
    email: email || null,
    notes: notes || null,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
    lastMessageAt: null,
  };

  contacts.push(newContact);
  writeContacts(contacts);

  res.json({ success: true, data: newContact });
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', (req, res) => {
  const { name, phone, email, notes, tags } = req.body;
  const contacts = readContacts();
  const index = contacts.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  // Check for duplicate phone if changing
  if (phone && phone !== contacts[index].phone) {
    if (contacts.find(c => c.phone === phone)) {
      return res.status(400).json({ error: 'Contact with this phone already exists' });
    }
  }

  contacts[index] = {
    ...contacts[index],
    ...(name && { name }),
    ...(phone && { phone }),
    ...(email !== undefined && { email }),
    ...(notes !== undefined && { notes }),
    ...(tags && { tags }),
    updatedAt: new Date().toISOString(),
  };

  writeContacts(contacts);
  res.json({ success: true, data: contacts[index] });
});

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', (req, res) => {
  const contacts = readContacts();
  const index = contacts.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  contacts.splice(index, 1);
  writeContacts(contacts);

  res.json({ success: true, message: 'Contact deleted' });
});

// POST /api/contacts/import - Import contacts from array
router.post('/import', (req, res) => {
  const { contacts: newContacts } = req.body;

  if (!Array.isArray(newContacts)) {
    return res.status(400).json({ error: 'contacts array is required' });
  }

  const existingContacts = readContacts();
  const existingPhones = new Set(existingContacts.map(c => c.phone));

  const imported = [];
  const skipped = [];

  for (const contact of newContacts) {
    if (!contact.name || !contact.phone) {
      skipped.push({ ...contact, reason: 'Missing name or phone' });
      continue;
    }

    if (existingPhones.has(contact.phone)) {
      skipped.push({ ...contact, reason: 'Phone already exists' });
      continue;
    }

    const newContact = {
      id: uuidv4(),
      name: contact.name,
      phone: contact.phone,
      email: contact.email || null,
      notes: contact.notes || null,
      tags: contact.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      lastMessageAt: null,
    };

    existingContacts.push(newContact);
    existingPhones.add(contact.phone);
    imported.push(newContact);
  }

  writeContacts(existingContacts);

  res.json({ 
    success: true, 
    data: { 
      imported: imported.length, 
      skipped: skipped.length,
      details: { imported, skipped }
    }
  });
});

// GET /api/contacts/tags - Get all unique tags
router.get('/meta/tags', (req, res) => {
  const contacts = readContacts();
  const tags = new Set();
  
  contacts.forEach(c => {
    if (c.tags) {
      c.tags.forEach(t => tags.add(t));
    }
  });

  res.json({ success: true, data: Array.from(tags) });
});

module.exports = router;
