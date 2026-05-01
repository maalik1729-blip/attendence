const request = require('supertest');

// Avoid mongoose connection during smoke test
jest.mock('../src/config/db', () => jest.fn().mockResolvedValue());

const app = require('../src/app');

describe('health', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('unknown route returns 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
