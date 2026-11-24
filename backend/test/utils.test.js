// Unit tests for small helpers. Run with: npm test
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  validateEmployeeIdFormat,
  getDepartmentCodeFromEmployeeId,
} = require('../utils/employeeIdGenerator');
const { admin, teacher, labAccess } = require('../middleware/authMiddleware');
const { errorHandler } = require('../middleware/errorMiddleware');
const { isLocal } = require('../scripts/seed-demo');

describe('Employee ID format', () => {
  for (const id of ['CS-001', 'DES-012', 'MECH-1000', 'CADD-001', 'LW-003']) {
    test(`accepts ${id}`, () => assert.equal(validateEmployeeIdFormat(id), true));
  }
  for (const id of ['', 'CS001', 'CS-01', 'CS_001', 'cs-001', 'TOOLONGCODE1-001', '-001']) {
    test(`rejects "${id}"`, () => assert.equal(validateEmployeeIdFormat(id), false));
  }
  test('reads the department code back', () => {
    assert.equal(getDepartmentCodeFromEmployeeId('DES-012'), 'DES');
  });
});

// A tiny stand-in for Express's res object
function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

function runGuard(guard, user) {
  const res = fakeRes();
  let passed = false;
  guard({ user }, res, () => { passed = true; });
  return { passed, status: res.statusCode };
}

describe('role guards', () => {
  test('admin: only admins pass', () => {
    assert.equal(runGuard(admin, { role: 'admin' }).passed, true);
    assert.deepEqual(runGuard(admin, { role: 'teacher' }), { passed: false, status: 403 });
    assert.deepEqual(runGuard(admin, undefined), { passed: false, status: 403 });
  });
  test('teacher: teachers and admins pass', () => {
    assert.equal(runGuard(teacher, { role: 'teacher' }).passed, true);
    assert.equal(runGuard(teacher, { role: 'admin' }).passed, true);
    assert.equal(runGuard(teacher, { role: 'student' }).passed, false);
  });
  test('labAccess: teachers and admins pass', () => {
    assert.equal(runGuard(labAccess, { role: 'teacher' }).passed, true);
    assert.equal(runGuard(labAccess, {}).passed, false);
  });
});

describe('error handler', () => {
  const quiet = (fn) => {
    const err = console.error;
    console.error = () => {};
    try { return fn(); } finally { console.error = err; }
  };
  const handle = (error) => quiet(() => {
    const res = fakeRes();
    errorHandler(error, { path: '/x', method: 'GET' }, res, () => {});
    return res;
  });

  test('duplicate key becomes 400 with the field name', () => {
    const res = handle({ code: 11000, keyValue: { email: 'a@b.c' }, message: 'dup' });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Email already exists');
  });
  test('bad ObjectId becomes 400', () => {
    const res = handle({ name: 'CastError', path: '_id', value: 'abc', message: 'cast' });
    assert.equal(res.statusCode, 400);
  });
  test('JWT errors become 401', () => {
    assert.equal(handle({ name: 'TokenExpiredError', message: 'jwt expired' }).statusCode, 401);
  });
  test('anything else is a 500', () => {
    assert.equal(handle(new Error('boom')).statusCode, 500);
  });
});

describe('demo seed safety', () => {
  test('allows only a local MongoDB', () => {
    assert.equal(isLocal('mongodb://localhost:27017/lab_demo'), true);
    assert.equal(isLocal('mongodb://127.0.0.1/lab_demo'), true);
    assert.equal(isLocal('mongodb+srv://user:pass@cluster0.mongodb.net/prod'), false);
    assert.equal(isLocal('mongodb://db.example.com:27017/prod'), false);
    assert.equal(isLocal(undefined), false);
  });
});
