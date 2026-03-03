/**
 * Auth Service Unit Tests — Service Layer
 * Tests business logic in authService.ts with dependencies mocked.
 *
 * Agent: A-11 (Regression Testing Agent)
 * Coverage target: ≥ 80% on authService.ts
 */

jest.mock('../../backend/auth-service/src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  RefreshToken: {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('../../backend/auth-service/src/config/database', () => ({
  transaction: jest.fn()
}));

jest.mock('../../backend/auth-service/src/utils/jwt', () => ({
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: '15m'
  }),
  verifyRefreshToken: jest.fn()
}));

jest.mock('../../backend/auth-service/src/utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/auth-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const { User, RefreshToken } = require('../../backend/auth-service/src/models');
const sequelize = require('../../backend/auth-service/src/config/database');
const { generateTokens, verifyRefreshToken } = require('../../backend/auth-service/src/utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../backend/auth-service/src/utils/email');

// ─────────────────────────────────────────────────────────────────────────────
// Mock factories
// ─────────────────────────────────────────────────────────────────────────────

const makeMockTransaction = () => {
  const t = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined)
  };
  sequelize.transaction.mockResolvedValue(t);
  return t;
};

const makeUser = (overrides = {}) => ({
  id: 'user-uuid-001',
  email: 'alice@decp.edu',
  firstName: 'Alice',
  lastName: 'Student',
  role: 'student',
  isEmailVerified: true,
  isActive: true,
  profilePicture: null,
  lastLogin: null,
  comparePassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockImplementation(function(updates) { Object.assign(this, updates); return Promise.resolve(this); }),
  ...overrides
});

const makeRefreshToken = (overrides = {}) => ({
  id: 'rt-uuid-001',
  token: 'mock-refresh-token',
  userId: 'user-uuid-001',
  isRevoked: false,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  update: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('authService', () => {
  let authService;

  beforeAll(() => {
    authService = require('../../backend/auth-service/src/services/authService');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    const validInput = {
      email: 'new@decp.edu',
      password: 'SecurePass123!',
      firstName: 'Bob',
      lastName: 'New',
      role: 'student'
    };

    it('registers a new user successfully', async () => {
      User.findOne.mockResolvedValue(null);
      const t = makeMockTransaction();
      const user = makeUser({ email: validInput.email, firstName: 'Bob', lastName: 'New' });
      User.create.mockResolvedValue(user);
      RefreshToken.create.mockResolvedValue({});

      const result = await authService.register(validInput);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: validInput.email } });
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: validInput.email, isEmailVerified: false }),
        expect.objectContaining({ transaction: t })
      );
      expect(RefreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'mock-refresh-token', userId: user.id }),
        expect.objectContaining({ transaction: t })
      );
      expect(t.commit).toHaveBeenCalled();
      expect(result.user.email).toBe(validInput.email);
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('throws 409 if email already exists', async () => {
      User.findOne.mockResolvedValue(makeUser());

      await expect(authService.register(validInput)).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('already exists')
      });
    });

    it('sends verification email after successful registration', async () => {
      User.findOne.mockResolvedValue(null);
      makeMockTransaction();
      User.create.mockResolvedValue(makeUser());
      RefreshToken.create.mockResolvedValue({});

      await authService.register(validInput);

      expect(sendVerificationEmail).toHaveBeenCalledWith(
        validInput.email,
        expect.any(String)
      );
    });

    it('rolls back transaction when RefreshToken.create fails', async () => {
      User.findOne.mockResolvedValue(null);
      const t = makeMockTransaction();
      User.create.mockResolvedValue(makeUser());
      RefreshToken.create.mockRejectedValue(new Error('DB constraint'));

      await expect(authService.register(validInput)).rejects.toThrow();

      expect(t.rollback).toHaveBeenCalled();
      expect(t.commit).not.toHaveBeenCalled();
    });

    it('includes firstName and lastName in JWT payload', async () => {
      User.findOne.mockResolvedValue(null);
      makeMockTransaction();
      User.create.mockResolvedValue(makeUser({ firstName: 'Bob', lastName: 'New' }));
      RefreshToken.create.mockResolvedValue({});

      await authService.register(validInput);

      expect(generateTokens).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Bob', lastName: 'New' })
      );
    });

    it('continues if email send fails (non-critical path)', async () => {
      User.findOne.mockResolvedValue(null);
      makeMockTransaction();
      User.create.mockResolvedValue(makeUser());
      RefreshToken.create.mockResolvedValue({});
      sendVerificationEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(authService.register(validInput)).resolves.toBeDefined();
    });

    it('stores optional department and graduationYear fields', async () => {
      User.findOne.mockResolvedValue(null);
      makeMockTransaction();
      User.create.mockResolvedValue(makeUser());
      RefreshToken.create.mockResolvedValue({});

      await authService.register({ ...validInput, department: 'CS', graduationYear: 2026 });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ department: 'CS', graduationYear: 2026 }),
        expect.anything()
      );
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('logs in a valid user and returns tokens', async () => {
      const user = makeUser({ isActive: true });
      User.findOne.mockResolvedValue(user);
      makeMockTransaction();
      RefreshToken.create.mockResolvedValue({});

      const result = await authService.login('alice@decp.edu', 'correctpassword');

      expect(user.comparePassword).toHaveBeenCalledWith('correctpassword');
      expect(generateTokens).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id }));
      expect(result.user.id).toBe(user.id);
      expect(result.accessToken).toBeDefined();
    });

    it('throws 401 for non-existent user', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        authService.login('ghost@decp.edu', 'pass')
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 for wrong password', async () => {
      const user = makeUser();
      user.comparePassword.mockResolvedValue(false);
      User.findOne.mockResolvedValue(user);

      await expect(
        authService.login('alice@decp.edu', 'wrongpass')
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('updates lastLogin on successful login', async () => {
      const user = makeUser();
      User.findOne.mockResolvedValue(user);
      const t = makeMockTransaction();
      RefreshToken.create.mockResolvedValue({});

      await authService.login('alice@decp.edu', 'pass');

      expect(user.save).toHaveBeenCalledWith(expect.objectContaining({ transaction: t }));
      expect(user.lastLogin).toBeInstanceOf(Date);
    });

    it('includes firstName/lastName in access token payload', async () => {
      const user = makeUser({ firstName: 'Alice', lastName: 'Student' });
      User.findOne.mockResolvedValue(user);
      makeMockTransaction();
      RefreshToken.create.mockResolvedValue({});

      await authService.login('alice@decp.edu', 'pass');

      expect(generateTokens).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Alice', lastName: 'Student' })
      );
    });

    it('rolls back if RefreshToken.create fails', async () => {
      const user = makeUser();
      User.findOne.mockResolvedValue(user);
      const t = makeMockTransaction();
      RefreshToken.create.mockRejectedValue(new Error('DB error'));

      await expect(authService.login('alice@decp.edu', 'pass')).rejects.toThrow();

      expect(t.rollback).toHaveBeenCalled();
    });
  });

  // ─── refreshTokens (FLAW-005 fix) ─────────────────────────────────────────

  describe('refreshTokens (FLAW-005 fix)', () => {
    it('issues new tokens with complete firstName/lastName payload', async () => {
      verifyRefreshToken.mockReturnValue({ userId: 'user-uuid-001', email: 'alice@decp.edu', role: 'student' });
      const storedToken = makeRefreshToken();
      RefreshToken.findOne.mockResolvedValue(storedToken);
      const user = makeUser({ firstName: 'Alice', lastName: 'Student' });
      User.findByPk.mockResolvedValue(user);
      makeMockTransaction();
      RefreshToken.create.mockResolvedValue({});

      await authService.refreshTokens('valid-refresh-token');

      // The KEY fix: firstName/lastName must come from the DB lookup, not from
      // the refresh token payload (which may be missing them — FLAW-005)
      expect(generateTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Alice',
          lastName: 'Student',
          userId: 'user-uuid-001'
        })
      );
    });

    it('throws 401 for invalid/expired JWT', async () => {
      verifyRefreshToken.mockImplementation(() => { throw new Error('Invalid token'); });

      await expect(authService.refreshTokens('bad-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 for revoked token', async () => {
      verifyRefreshToken.mockReturnValue({ userId: 'user-uuid-001' });
      RefreshToken.findOne.mockResolvedValue(null);

      await expect(authService.refreshTokens('revoked-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 for expired token (past expiresAt)', async () => {
      verifyRefreshToken.mockReturnValue({ userId: 'user-uuid-001' });
      RefreshToken.findOne.mockResolvedValue(makeRefreshToken({
        expiresAt: new Date(Date.now() - 1000) // 1 second in the past
      }));

      await expect(authService.refreshTokens('expired-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 if user account is deactivated', async () => {
      verifyRefreshToken.mockReturnValue({ userId: 'user-uuid-001' });
      RefreshToken.findOne.mockResolvedValue(makeRefreshToken());
      User.findByPk.mockResolvedValue(makeUser({ isActive: false }));

      await expect(authService.refreshTokens('valid-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('revokes old token before issuing new ones', async () => {
      verifyRefreshToken.mockReturnValue({ userId: 'user-uuid-001' });
      const storedToken = makeRefreshToken();
      RefreshToken.findOne.mockResolvedValue(storedToken);
      User.findByPk.mockResolvedValue(makeUser());
      const t = makeMockTransaction();
      RefreshToken.create.mockResolvedValue({});

      await authService.refreshTokens('old-token');

      expect(storedToken.update).toHaveBeenCalledWith(
        { isRevoked: true },
        expect.objectContaining({ transaction: t })
      );
    });

    it('rolls back transaction on error', async () => {
      verifyRefreshToken.mockReturnValue({ userId: 'user-uuid-001' });
      RefreshToken.findOne.mockResolvedValue(makeRefreshToken());
      User.findByPk.mockResolvedValue(makeUser());
      const t = makeMockTransaction();
      RefreshToken.create.mockRejectedValue(new Error('DB error'));

      await expect(authService.refreshTokens('token')).rejects.toThrow();

      expect(t.rollback).toHaveBeenCalled();
    });
  });

  // ─── verifyEmail ──────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('marks user email as verified', async () => {
      const user = makeUser({ isEmailVerified: false });
      User.findOne.mockResolvedValue(user);

      await authService.verifyEmail('valid-verification-token');

      expect(user.update).toHaveBeenCalledWith({
        isEmailVerified: true,
        emailVerificationToken: null
      });
    });

    it('throws 400 for invalid token', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('looks up user by token AND isEmailVerified=false', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.verifyEmail('token')).rejects.toThrow();

      expect(User.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({ emailVerificationToken: 'token', isEmailVerified: false })
      });
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('stores reset token and sends email for known user', async () => {
      const user = makeUser();
      User.findOne.mockResolvedValue(user);

      await authService.forgotPassword('alice@decp.edu');

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({ passwordResetToken: expect.any(String) })
      );
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('alice@decp.edu', expect.any(String));
    });

    it('returns without error for unknown email (security — no user enumeration)', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.forgotPassword('unknown@decp.edu')).resolves.toBeUndefined();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('reset token expires in 1 hour', async () => {
      const user = makeUser();
      User.findOne.mockResolvedValue(user);
      const before = Date.now();

      await authService.forgotPassword('alice@decp.edu');

      const updateCall = user.update.mock.calls[0][0];
      const expiry = updateCall.passwordResetExpires;
      expect(expiry.getTime()).toBeGreaterThan(before + 3590 * 1000); // ~1 hour
      expect(expiry.getTime()).toBeLessThan(before + 3601 * 1000);
    });

    it('continues if email send fails', async () => {
      User.findOne.mockResolvedValue(makeUser());
      sendPasswordResetEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(authService.forgotPassword('alice@decp.edu')).resolves.toBeUndefined();
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('updates password and revokes all refresh tokens', async () => {
      const user = makeUser();
      User.findOne.mockResolvedValue(user);

      await authService.resetPassword('valid-reset-token', 'NewPass123!');

      expect(user.update).toHaveBeenCalledWith({
        password: 'NewPass123!',
        passwordResetToken: null,
        passwordResetExpires: null
      });
      expect(RefreshToken.update).toHaveBeenCalledWith(
        { isRevoked: true },
        { where: { userId: user.id } }
      );
    });

    it('throws 400 for invalid or expired token', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        authService.resetPassword('bad-token', 'newpass')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('queries for non-expired reset token', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.resetPassword('token', 'pass')).rejects.toThrow();

      expect(User.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          passwordResetToken: 'token',
          passwordResetExpires: expect.objectContaining({}) // Op.gt condition
        })
      });
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes the provided refresh token', async () => {
      await authService.logout('some-refresh-token');

      expect(RefreshToken.update).toHaveBeenCalledWith(
        { isRevoked: true },
        { where: { token: 'some-refresh-token' } }
      );
    });

    it('does nothing if no token provided', async () => {
      await authService.logout();

      expect(RefreshToken.update).not.toHaveBeenCalled();
    });

    it('does nothing if undefined token provided', async () => {
      await authService.logout(undefined);

      expect(RefreshToken.update).not.toHaveBeenCalled();
    });
  });
});
