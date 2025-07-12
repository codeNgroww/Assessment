const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

const itemsRouter = require('../items');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);

// Mock data
const mockItems = [
  { id: 1, name: "Laptop Pro", category: "Electronics", price: 2499 },
  { id: 2, name: "Noise Cancelling Headphones", category: "Electronics", price: 399 },
  { id: 3, name: "Ultra‑Wide Monitor", category: "Electronics", price: 999 },
  { id: 4, name: "Ergonomic Chair", category: "Furniture", price: 799 },
  { id: 5, name: "Standing Desk", category: "Furniture", price: 1199 }
];

describe('Items Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/items', () => {
    it('should return all items when no query parameters are provided', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body.items).toEqual(mockItems);
      expect(response.body.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 5,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      });
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should filter items by search query', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?q=laptop')
        .expect(200);

      expect(response.body.items).toEqual([
        { id: 1, name: "Laptop Pro", category: "Electronics", price: 2499 }
      ]);
      expect(response.body.pagination.totalItems).toBe(1);
    });

    it('should limit results when limit parameter is provided', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?limit=2')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items).toEqual(mockItems.slice(0, 2));
      expect(response.body.pagination.itemsPerPage).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(true);
    });

    it('should handle both search and limit parameters', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?q=electronics&limit=2')
        .expect(200);

      const electronicsItems = mockItems.filter(item => 
        item.name.toLowerCase().includes('electronics') || 
        item.category.toLowerCase().includes('electronics')
      );
      expect(response.body.items).toEqual(electronicsItems.slice(0, 2));
      expect(response.body.pagination.totalItems).toBe(3);
    });

    it('should handle case-insensitive search', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?q=CHAIR')
        .expect(200);

      expect(response.body.items).toEqual([
        { id: 4, name: "Ergonomic Chair", category: "Furniture", price: 799 }
      ]);
    });

    it('should return empty array when search query has no matches', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?q=nonexistent')
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.pagination.totalItems).toBe(0);
    });

    it('should handle file read errors', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .get('/api/items')
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle invalid JSON in file', async () => {
      fs.readFile.mockResolvedValue('invalid json');

      const response = await request(app)
        .get('/api/items')
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return a specific item by id', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items/2')
        .expect(200);

      expect(response.body).toEqual({
        id: 2,
        name: "Noise Cancelling Headphones",
        category: "Electronics",
        price: 399
      });
    });

    it('should return 404 when item is not found', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items/999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Item not found');
    });

    it('should handle non-numeric id parameter', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items/abc')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Item not found');
    });

    it('should handle file read errors', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .get('/api/items/1')
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item successfully', async () => {
      const newItem = {
        name: "Wireless Mouse",
        category: "Electronics",
        price: 59
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      fs.writeFile.mockResolvedValue();

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body).toMatchObject(newItem);
      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('number');

      // The pretty-printed JSON will have spaces and newlines, so just check for the name substring
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Wireless Mouse')
      );
    });

    it('should assign a unique id to new items', async () => {
      const newItem = {
        name: "Test Item",
        category: "Test",
        price: 100
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      fs.writeFile.mockResolvedValue();

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body.id).toBeGreaterThan(5); // Should be greater than existing ids
    });

    it('should handle empty request body', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .post('/api/items')
        .send({})
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should handle file read errors during creation', async () => {
      const newItem = { name: "Test", category: "Test", price: 100 };
      fs.readFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle file write errors during creation', async () => {
      const newItem = { name: "Test", category: "Test", price: 100 };
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      fs.writeFile.mockRejectedValue(new Error('Write failed'));

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle invalid JSON in existing file', async () => {
      const newItem = { name: "Test", category: "Test", price: 100 };
      fs.readFile.mockResolvedValue('invalid json');

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', async () => {
      fs.readFile.mockResolvedValue('[]');

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.pagination.totalItems).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });

    it('should handle items without required fields', async () => {
      const incompleteItems = [
        { id: 1, name: "Item 1" },
        { id: 2, category: "Electronics" },
        { id: 3, price: 100 }
      ];

      fs.readFile.mockResolvedValue(JSON.stringify(incompleteItems));

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body.items).toEqual(incompleteItems);
      expect(response.body.pagination.totalItems).toBe(3);
    });

    it('should handle very large limit values', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?limit=999999')
        .expect(200);

      expect(response.body.items).toEqual(mockItems);
      expect(response.body.pagination.itemsPerPage).toBe(1000); // Max limit
    });

    it('should handle negative limit values', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?limit=-5')
        .expect(200);

      expect(response.body.items).toEqual([mockItems[0]]); // Should get first item due to limit=1
      expect(response.body.pagination.itemsPerPage).toBe(1);
    });
  });
}); 