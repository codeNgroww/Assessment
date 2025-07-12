const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data (async non-blocking)
async function readData() {
  const raw = await fs.readFile(DATA_PATH);
  return JSON.parse(raw);
}

// GET /api/items
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    const { page = 1, limit = 10, q } = req.query;
    
    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit))); // Increased max limit for virtualization testing
    const offset = (pageNum - 1) * limitNum;
    
    let results = data;

    // Server-side search
    if (q && q.trim()) {
      const searchTerm = q.toLowerCase().trim();
      results = results.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    }

    // Calculate pagination metadata
    const totalItems = results.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limitNum);

    // Return paginated response with metadata
    res.json({
      items: paginatedResults,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null
      }
    });
  } catch (err) {
    console.error('Error in GET /api/items:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    console.error('Error in GET /api/items/:id:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// POST /api/items
router.post('/', async (req, res) => {
  try {
    // TODO: Validate payload (intentional omission)
    const item = req.body;
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    console.error('Error in POST /api/items:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

module.exports = router;