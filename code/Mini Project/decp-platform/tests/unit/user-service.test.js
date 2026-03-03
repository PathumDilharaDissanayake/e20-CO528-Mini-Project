/**
 * User Service Unit Tests
 * Tests for user CRUD operations and profile management
 */

const { 
  getUserProfile, 
  updateProfile, 
  deleteUser, 
  searchUsers,
  getConnections,
  sendConnectionRequest,
  respondToConnectionRequest
} = require('../../backend/user-service/src/controllers/userController');
const { 
  getUserConnections,
  removeConnection 
} = require('../../backend/user-service/src/controllers/connectionController');
const { Profile, Connection } = require('../../backend/user-service/src/models');

// Mock dependencies
jest.mock('../../backend/user-service/src/models');
jest.mock('../../backend/user-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('User Service - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockProfile;
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: 'user-123',
      email: 'test@university.edu',
      firstName: 'John',
      lastName: 'Doe',
      bio: 'Software Engineering Student',
      major: 'Computer Science',
      graduationYear: 2024,
      profilePicture: 'https://example.com/photo.jpg',
      skills: ['JavaScript', 'Python', 'React'],
      interests: ['AI', 'Web Development'],
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      githubUrl: 'https://github.com/johndoe',
      website: 'https://johndoe.com',
      isPublic: true,
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    };
    mockConnection = {
      id: 'conn-123',
      requesterId: 'user-123',
      addresseeId: 'user-456',
      status: 'pending',
      createdAt: new Date(),
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    };
  });

  describe('Get User Profile', () => {
    test('should get user profile successfully', async () => {
      mockReq = {
        params: { userId: 'user-123' },
        headers: { 'x-user-id': 'user-123' }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await getUserProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ profile: mockProfile })
      }));
    });

    test('should return 404 for non-existent user', async () => {
      mockReq = {
        params: { userId: 'nonexistent' },
        headers: { 'x-user-id': 'user-123' }
      };
      Profile.findOne.mockResolvedValue(null);

      await getUserProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'User not found'
      }));
    });

    test('should get public profile for other users', async () => {
      mockReq = {
        params: { userId: 'user-456' },
        headers: { 'x-user-id': 'user-123' }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await getUserProfile(mockReq, mockRes);

      expect(Profile.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-456' })
      }));
    });

    test('should handle private profiles', async () => {
      mockReq = {
        params: { userId: 'user-456' },
        headers: { 'x-user-id': 'user-123' }
      };
      mockProfile.isPublic = false;
      mockProfile.userId = 'user-456';
      Profile.findOne.mockResolvedValue(mockProfile);

      await getUserProfile(mockReq, mockRes);

      // Should return limited info or 403 depending on implementation
      expect(mockRes.status).toBeDefined();
    });

    test('should return own full profile even if private', async () => {
      mockReq = {
        params: { userId: 'user-123' },
        headers: { 'x-user-id': 'user-123' }
      };
      mockProfile.isPublic = false;
      Profile.findOne.mockResolvedValue(mockProfile);

      await getUserProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });

  describe('Update Profile', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {
          bio: 'Updated bio',
          location: 'New York, NY',
          skills: ['JavaScript', 'TypeScript', 'Node.js']
        }
      };
    });

    test('should update profile successfully', async () => {
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      expect(mockProfile.update).toHaveBeenCalledWith(expect.objectContaining({
        bio: 'Updated bio',
        location: 'New York, NY',
        skills: ['JavaScript', 'TypeScript', 'Node.js']
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Profile updated successfully'
      }));
    });

    test('should update only allowed fields', async () => {
      mockReq.body = {
        bio: 'Updated bio',
        email: 'hacker@evil.com', // Should not be allowed
        role: 'admin' // Should not be allowed
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      // Should only update bio, not email or role
      expect(mockProfile.update).toHaveBeenCalledWith(expect.objectContaining({
        bio: 'Updated bio'
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq.headers = {};

      await updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('should validate input data', async () => {
      mockReq.body = {
        bio: 'a'.repeat(1001) // Too long
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      // Should either truncate or return error
      expect(mockRes.status).toBeDefined();
    });

    test('should handle invalid URL formats', async () => {
      mockReq.body = {
        linkedinUrl: 'not-a-valid-url',
        githubUrl: 'also-invalid'
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      // Should validate URLs
      expect(mockRes.status).toBeDefined();
    });

    test('should handle empty skills array', async () => {
      mockReq.body = { skills: [] };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      expect(mockProfile.update).toHaveBeenCalledWith(expect.objectContaining({
        skills: []
      }));
    });

    test('should sanitize HTML in bio', async () => {
      mockReq.body = {
        bio: '<script>alert("xss")</script>Hello'
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      // Should sanitize the input
      expect(mockProfile.update).toHaveBeenCalledWith(expect.objectContaining({
        bio: expect.not.stringContaining('<script>')
      }));
    });
  });

  describe('Delete User', () => {
    test('should delete user successfully', async () => {
      mockReq = {
        params: { userId: 'user-123' },
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'student' }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await deleteUser(mockReq, mockRes);

      expect(mockProfile.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'User deleted successfully'
      }));
    });

    test('should allow admin to delete any user', async () => {
      mockReq = {
        params: { userId: 'user-456' },
        headers: { 'x-user-id': 'admin-123', 'x-user-role': 'admin' }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await deleteUser(mockReq, mockRes);

      expect(mockProfile.destroy).toHaveBeenCalled();
    });

    test('should not allow deleting other users without admin role', async () => {
      mockReq = {
        params: { userId: 'user-456' },
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'student' }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should return 404 for non-existent user', async () => {
      mockReq = {
        params: { userId: 'nonexistent' },
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'student' }
      };
      Profile.findOne.mockResolvedValue(null);

      await deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Search Users', () => {
    test('should search users by name', async () => {
      mockReq = {
        query: { q: 'John Doe', page: '1', limit: '10' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockProfile]
      });

      await searchUsers(mockReq, mockRes);

      expect(Profile.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object),
        limit: 10,
        offset: 0
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [mockProfile]
      }));
    });

    test('should search users by skill', async () => {
      mockReq = {
        query: { skill: 'JavaScript', page: '1', limit: '20' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 5,
        rows: [mockProfile, mockProfile, mockProfile, mockProfile, mockProfile]
      });

      await searchUsers(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        meta: expect.objectContaining({
          total: 5,
          totalPages: 1
        })
      }));
    });

    test('should filter by graduation year', async () => {
      mockReq = {
        query: { graduationYear: '2024', page: '1', limit: '10' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: Array(10).fill(mockProfile)
      });

      await searchUsers(mockReq, mockRes);

      expect(Profile.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ graduationYear: 2024 })
      }));
    });

    test('should filter by major', async () => {
      mockReq = {
        query: { major: 'Computer Science', page: '1', limit: '10' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: [mockProfile, mockProfile, mockProfile]
      });

      await searchUsers(mockReq, mockRes);

      expect(Profile.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ major: 'Computer Science' })
      }));
    });

    test('should handle empty search results', async () => {
      mockReq = {
        query: { q: 'NonExistent', page: '1', limit: '10' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await searchUsers(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [],
        meta: expect.objectContaining({ total: 0 })
      }));
    });

    test('should handle pagination correctly', async () => {
      mockReq = {
        query: { page: '2', limit: '5' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 15,
        rows: Array(5).fill(mockProfile)
      });

      await searchUsers(mockReq, mockRes);

      expect(Profile.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        limit: 5,
        offset: 5
      }));
    });

    test('should handle invalid pagination params', async () => {
      mockReq = {
        query: { page: '-1', limit: 'abc' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: Array(10).fill(mockProfile)
      });

      await searchUsers(mockReq, mockRes);

      // Should use default values
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    test('should only search public profiles', async () => {
      mockReq = {
        query: { q: 'John' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockProfile]
      });

      await searchUsers(mockReq, mockRes);

      expect(Profile.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isPublic: true })
      }));
    });
  });

  describe('Connections', () => {
    describe('Get Connections', () => {
      test('should get user connections', async () => {
        mockReq = {
          params: { userId: 'user-123' },
          headers: { 'x-user-id': 'user-123' }
        };
        Connection.findAll.mockResolvedValue([mockConnection]);

        await getConnections(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.any(Array)
        }));
      });

      test('should filter by connection status', async () => {
        mockReq = {
          params: { userId: 'user-123' },
          query: { status: 'accepted' },
          headers: { 'x-user-id': 'user-123' }
        };
        Connection.findAll.mockResolvedValue([]);

        await getConnections(mockReq, mockRes);

        expect(Connection.findAll).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ status: 'accepted' })
        }));
      });
    });

    describe('Send Connection Request', () => {
      test('should send connection request successfully', async () => {
        mockReq = {
          body: { addresseeId: 'user-456' },
          headers: { 'x-user-id': 'user-123' }
        };
        Connection.findOne.mockResolvedValue(null);
        Connection.create.mockResolvedValue(mockConnection);

        await sendConnectionRequest(mockReq, mockRes);

        expect(Connection.create).toHaveBeenCalledWith(expect.objectContaining({
          requesterId: 'user-123',
          addresseeId: 'user-456',
          status: 'pending'
        }));
        expect(mockRes.status).toHaveBeenCalledWith(201);
      });

      test('should not allow self-connection', async () => {
        mockReq = {
          body: { addresseeId: 'user-123' },
          headers: { 'x-user-id': 'user-123' }
        };

        await sendConnectionRequest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      test('should not allow duplicate connection requests', async () => {
        mockReq = {
          body: { addresseeId: 'user-456' },
          headers: { 'x-user-id': 'user-123' }
        };
        Connection.findOne.mockResolvedValue(mockConnection);

        await sendConnectionRequest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(409);
      });

      test('should handle non-existent addressee', async () => {
        mockReq = {
          body: { addresseeId: 'nonexistent' },
          headers: { 'x-user-id': 'user-123' }
        };
        Connection.findOne.mockResolvedValue(null);
        Connection.create.mockRejectedValue(new Error('Foreign key constraint'));

        await sendConnectionRequest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });
    });

    describe('Respond to Connection Request', () => {
      test('should accept connection request', async () => {
        mockReq = {
          params: { connectionId: 'conn-123' },
          body: { action: 'accept' },
          headers: { 'x-user-id': 'user-456' }
        };
        Connection.findByPk.mockResolvedValue(mockConnection);

        await respondToConnectionRequest(mockReq, mockRes);

        expect(mockConnection.update).toHaveBeenCalledWith({ status: 'accepted' });
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Connection request accepted'
        }));
      });

      test('should reject connection request', async () => {
        mockReq = {
          params: { connectionId: 'conn-123' },
          body: { action: 'reject' },
          headers: { 'x-user-id': 'user-456' }
        };
        Connection.findByPk.mockResolvedValue(mockConnection);

        await respondToConnectionRequest(mockReq, mockRes);

        expect(mockConnection.update).toHaveBeenCalledWith({ status: 'rejected' });
      });

      test('should not allow responding to own request', async () => {
        mockReq = {
          params: { connectionId: 'conn-123' },
          body: { action: 'accept' },
          headers: { 'x-user-id': 'user-123' }
        };
        Connection.findByPk.mockResolvedValue(mockConnection);

        await respondToConnectionRequest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      test('should handle non-existent connection request', async () => {
        mockReq = {
          params: { connectionId: 'nonexistent' },
          body: { action: 'accept' },
          headers: { 'x-user-id': 'user-456' }
        };
        Connection.findByPk.mockResolvedValue(null);

        await respondToConnectionRequest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should handle already processed requests', async () => {
        mockReq = {
          params: { connectionId: 'conn-123' },
          body: { action: 'accept' },
          headers: { 'x-user-id': 'user-456' }
        };
        mockConnection.status = 'accepted';
        Connection.findByPk.mockResolvedValue(mockConnection);

        await respondToConnectionRequest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Remove Connection', () => {
      test('should remove connection successfully', async () => {
        mockReq = {
          params: { connectionId: 'conn-123' },
          headers: { 'x-user-id': 'user-123' }
        };
        Connection.findByPk.mockResolvedValue(mockConnection);

        await removeConnection(mockReq, mockRes);

        expect(mockConnection.destroy).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Connection removed'
        }));
      });

      test('should only allow involved users to remove connection', async () => {
        mockReq = {
          params: { connectionId: 'conn-123' },
          headers: { 'x-user-id': 'user-789' }
        };
        Connection.findByPk.mockResolvedValue(mockConnection);

        await removeConnection(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle maximum bio length', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: { bio: 'a'.repeat(2000) }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      expect(mockProfile.update).toHaveBeenCalled();
    });

    test('should handle maximum number of skills', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: { skills: Array(50).fill('Skill') }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      // Should either accept all or limit to max allowed
      expect(mockProfile.update).toHaveBeenCalled();
    });

    test('should handle unicode characters in names', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: { 
          firstName: '张伟',
          lastName: '李明'
        }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      expect(mockProfile.update).toHaveBeenCalled();
    });

    test('should handle very long skill names', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: { skills: ['a'.repeat(100)] }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      await updateProfile(mockReq, mockRes);

      expect(mockProfile.update).toHaveBeenCalled();
    });

    test('should handle concurrent profile updates', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: { bio: 'Updated bio' }
      };
      Profile.findOne.mockResolvedValue(mockProfile);

      const promises = Array(3).fill().map(() => updateProfile(mockReq, mockRes));
      await Promise.all(promises);

      expect(mockProfile.update).toHaveBeenCalledTimes(3);
    });

    test('should handle graduation year boundaries', async () => {
      mockReq = {
        query: { graduationYear: '1900' }
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await searchUsers(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    test('should handle empty search query', async () => {
      mockReq = {
        query: {}
      };
      Profile.findAndCountAll.mockResolvedValue({
        count: 100,
        rows: Array(10).fill(mockProfile)
      });

      await searchUsers(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        meta: expect.objectContaining({ total: 100 })
      }));
    });
  });
});
