const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../data/items.json');

// Cache for stats
let statsCache = null;
let lastModified = null;

// Calculate stats from items data
function calculateStats(items) {
  return {
    total: items.length,
    averagePrice: items.length > 0 ? items.reduce((acc, cur) => acc + cur.price, 0) / items.length : 0
  };
}

// Check if cache is valid
function isCacheValid() {
  try {
    const stats = fs.statSync(DATA_PATH);
    return statsCache && lastModified && stats.mtime.getTime() === lastModified.getTime();
  } catch (err) {
    return false;
  }
}

// Update cache
function updateCache() {
  try {
    const raw = fs.readFileSync(DATA_PATH);
    const items = JSON.parse(raw);
    statsCache = calculateStats(items);
    const stats = fs.statSync(DATA_PATH);
    lastModified = stats.mtime.getTime();
  } catch (err) {
    console.error('Error updating stats cache:', err);
    statsCache = null;
    lastModified = null;
  }
}

// Watch for file changes to invalidate cache
fs.watch(DATA_PATH, (eventType, filename) => {
  if (eventType === 'change') {
    console.log('Data file changed, invalidating stats cache');
    statsCache = null;
    lastModified = null;
  }
});

// GET /api/stats
router.get('/', (req, res, next) => {
  try {
    // Check if cache is valid
    if (!isCacheValid()) {
      updateCache();
    }

    if (!statsCache) {
      const err = new Error('Failed to calculate stats');
      err.status = 500;
      throw err;
    }

    res.json(statsCache);
  } catch (err) {
    next(err);
  }
});

module.exports = router;