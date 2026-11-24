// HTTP-level checks that need no database: health, auth guards and CORS.
// Run with: npm test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-long-enough-1234567890';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-long-enough-1234567890';

const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');

// Quiet the server's startup logging during tests
const log = console.log;
console.log = () => {};
const app = require('../server');
console.log = log;

after(() => mongoose.disconnect());

describe('health check', () => {
  test('GET /api/test answers 200 and healthy', async () => {
    const res = await request(app).get('/api/test');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
  });
});

describe('protected routes', () => {
  const routes = [
    '/api/students',
    '/api/batches',
    '/api/departments',
    '/api/courses',
    '/api/users/profile',
  ];

  for (const path of routes) {
    test(`GET ${path} without a token answers 401`, async () => {
      const res = await request(app).get(path);
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'NoTokenError');
    });
  }

  test('a forged token is rejected with 401', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', 'Bearer not-a-real-token');
    assert.equal(res.status, 401);
  });
});

describe('CORS', () => {
  test('the local Vite dev server is allowed', async () => {
    const res = await request(app).get('/api/test').set('Origin', 'http://localhost:5173');
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
  });

  test('an unknown site is not allowed', async () => {
    const res = await request(app).get('/api/test').set('Origin', 'https://evil.example');
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });
});
