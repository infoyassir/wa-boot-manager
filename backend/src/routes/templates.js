const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const DATA_PATH = './data/templates.json';

// Ensure data file exists
const ensureDataFile = () => {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 2));
  }
};

const readTemplates = () => {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
};

const writeTemplates = (templates) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(templates, null, 2));
};

// GET /api/templates - Get all templates
router.get('/', (req, res) => {
  const templates = readTemplates();
  res.json({ success: true, data: templates });
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', (req, res) => {
  const templates = readTemplates();
  const template = templates.find(t => t.id === req.params.id);

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ success: true, data: template });
});

// POST /api/templates - Create new template
router.post('/', (req, res) => {
  const { name, content, category, variables = [] } = req.body;

  if (!name || !content) {
    return res.status(400).json({ error: 'name and content are required' });
  }

  const templates = readTemplates();
  const newTemplate = {
    id: uuidv4(),
    name,
    content,
    category: category || 'general',
    variables,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  };

  templates.push(newTemplate);
  writeTemplates(templates);

  res.json({ success: true, data: newTemplate });
});

// PUT /api/templates/:id - Update template
router.put('/:id', (req, res) => {
  const { name, content, category, variables } = req.body;
  const templates = readTemplates();
  const index = templates.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }

  templates[index] = {
    ...templates[index],
    ...(name && { name }),
    ...(content && { content }),
    ...(category && { category }),
    ...(variables && { variables }),
    updatedAt: new Date().toISOString(),
  };

  writeTemplates(templates);
  res.json({ success: true, data: templates[index] });
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', (req, res) => {
  const templates = readTemplates();
  const index = templates.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }

  templates.splice(index, 1);
  writeTemplates(templates);

  res.json({ success: true, message: 'Template deleted' });
});

// POST /api/templates/:id/render - Render template with variables
router.post('/:id/render', (req, res) => {
  const { variables = {} } = req.body;
  const templates = readTemplates();
  const template = templates.find(t => t.id === req.params.id);

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  let rendered = template.content;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  // Update usage count
  template.usageCount++;
  writeTemplates(templates);

  res.json({ success: true, data: { original: template.content, rendered } });
});

module.exports = router;
