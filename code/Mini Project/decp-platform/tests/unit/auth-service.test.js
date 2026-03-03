const request = require('supertest');
const { app } = require('../../backend/auth-service/src/server');
const { User } = require('../../backend/auth-service/src/models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock the database
jest.mock('../../backend/auth-service/src/models');

describe('Auth Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        isEmailVerified: false
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'student'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for existing email', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: hashedPassword,
        isEmailVerified: true,
        role: 'student'
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 for unverified email', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 10),
        isEmailVerified: false
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

      jwt.verify = jest.fn().mockReturnValue({ userId: mockUserId });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: mockRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset link');
    });

    it('should return 200 even for non-existing user (security)', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const mockUser = {
        id: '123',
        resetToken: 'valid-token',
        resetTokenExpiry: new Date(Date.now() + 3600000),
        save: jest.fn()
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-token',
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 400 for expired token', async () => {
      const mockUser = {
        resetToken: 'expired-token',
        resetTokenExpiry: new Date(Date.now() - 3600000)
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'expired-token',
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
    });
  });
});

// Additional test suites for other services would follow the same pattern
