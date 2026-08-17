const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

jest.mock('../models/User');
jest.mock('../models/Course');
jest.mock('../models/Enrollment');
jest.mock('../config/db');

const request = require('supertest');
const app = require('../src/server');

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          role: 'student'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123',
          role: 'student'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Access Control', () => {
    const teacherToken = jwt.sign(
      { user: { id: 'teacher123', role: 'teacher' } },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1h' }
    );

    const studentToken = jwt.sign(
      { user: { id: 'student123', role: 'student' } },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1h' }
    );

    it('should block student from accessing teacher endpoints', async () => {
      const res = await request(app)
        .get('/api/courses/my-courses')
        .set('x-auth-token', studentToken);

      expect(res.status).toBe(401);
    });

    it('should allow teacher to access their courses', async () => {
      Course.find.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/courses/my-courses')
        .set('x-auth-token', teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('Course Privacy', () => {
  it('should filter private courses for non-enrolled students', async () => {
    const studentToken = jwt.sign(
      { user: { id: 'student123', role: 'student', institution: 'FBC' } },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1h' }
    );

    const mockCourse = {
      _id: 'course123',
      title: 'Private Course',
      privacy: 'private',
      institution: 'FBC',
      teacher: 'teacher123'
    };

    Course.findById.mockResolvedValue(mockCourse);
    Enrollment.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/courses/course123')
      .set('x-auth-token', studentToken);

    expect(res.status).toBe(403);
  });

  it('should allow access to public courses without auth', async () => {
    const mockCourse = {
      _id: 'course123',
      title: 'Public Course',
      privacy: 'public'
    };

    Course.findById.mockResolvedValue(mockCourse);

    const res = await request(app)
      .get('/api/courses/course123');

    expect(res.status).toBe(200);
  });
});

describe('Resource Access Control', () => {
  it('should require authentication to access resources', async () => {
    const res = await request(app)
      .get('/api/resources/course/course123');

    expect(res.status).toBe(401);
  });

  it('should block access to resources for non-enrolled students', async () => {
    const studentToken = jwt.sign(
      { user: { id: 'student123', role: 'student', institution: 'FBC' } },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1h' }
    );

    const mockCourse = {
      _id: 'course123',
      privacy: 'private',
      institution: 'FBC',
      teacher: 'teacher123'
    };

    Course.findById.mockResolvedValue(mockCourse);
    Enrollment.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/resources/course/course123')
      .set('x-auth-token', studentToken);

    expect(res.status).toBe(403);
  });
});
