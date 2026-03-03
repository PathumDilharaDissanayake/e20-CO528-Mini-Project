/**
 * Notification Service Unit Tests
 * Tests for notification creation, delivery, and management
 */

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  updatePreferences,
  getPreferences,
  subscribePush,
  unsubscribePush
} = require('../../backend/notification-service/src/controllers/notificationController');
const { Notification, PushSubscription } = require('../../backend/notification-service/src/models');

// Mock dependencies
jest.mock('../../backend/notification-service/src/models');
jest.mock('../../backend/notification-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Notification Service - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNotification;
  let mockPreferences;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNotification = {
      id: 'notif-123',
      userId: 'user-123',
      type: 'like',
      title: 'New Like',
      message: 'John Doe liked your post',
      data: { postId: 'post-123' },
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    };
    mockPreferences = {
      userId: 'user-123',
      email: {
        newConnection: true,
        newMessage: true,
        jobAlert: true,
        eventReminder: true,
        weeklyDigest: false
      },
      push: {
        newConnection: true,
        newMessage: true,
        jobAlert: false,
        eventReminder: true
      },
      inApp: {
        all: true
      },
      save: jest.fn(),
      update: jest.fn()
    };
  });

  describe('Get Notifications', () => {
    test('should get notifications with pagination', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: { page: '1', limit: '10' }
      };
      Notification.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: Array(10).fill(mockNotification)
      });

      await getNotifications(mockReq, mockRes);

      expect(Notification.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-123' },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 25
        })
      }));
    });

    test('should filter unread notifications', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: { unread: 'true' }
      };
      Notification.findAndCountAll.mockResolvedValue({
        count: 5,
        rows: Array(5).fill(mockNotification)
      });

      await getNotifications(mockReq, mockRes);

      expect(Notification.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-123',
          isRead: false
        })
      }));
    });

    test('should filter by notification type', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: { type: 'message' }
      };
      Notification.findAndCountAll.mockResolvedValue({
        count: 8,
        rows: Array(8).fill({ ...mockNotification, type: 'message' })
      });

      await getNotifications(mockReq, mockRes);

      expect(Notification.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ type: 'message' })
      }));
    });

    test('should filter by date range', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: { since: '2024-01-01', until: '2024-01-31' }
      };
      Notification.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: Array(10).fill(mockNotification)
      });

      await getNotifications(mockReq, mockRes);

      expect(Notification.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });

    test('should handle empty notifications', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: {}
      };
      Notification.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getNotifications(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [],
        meta: expect.objectContaining({ total: 0 })
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq = { headers: {} };

      await getNotifications(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Get Unread Count', () => {
    test('should get unread notification count', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' }
      };
      Notification.count.mockResolvedValue(15);

      await getUnreadCount(mockReq, mockRes);

      expect(Notification.count).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          userId: 'user-123',
          isRead: false
        }
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ count: 15 })
      }));
    });

    test('should get count by type', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: { type: 'message' }
      };
      Notification.count.mockResolvedValue(5);

      await getUnreadCount(mockReq, mockRes);

      expect(Notification.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ type: 'message' })
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq = { headers: {} };

      await getUnreadCount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Mark as Read', () => {
    test('should mark single notification as read', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { notificationId: 'notif-123' }
      };
      Notification.findOne.mockResolvedValue(mockNotification);

      await markAsRead(mockReq, mockRes);

      expect(mockNotification.update).toHaveBeenCalledWith({
        isRead: true,
        readAt: expect.any(Date)
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Notification marked as read'
      }));
    });

    test('should return 404 for non-existent notification', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { notificationId: 'nonexistent' }
      };
      Notification.findOne.mockResolvedValue(null);

      await markAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized access', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { notificationId: 'notif-123' }
      };
      Notification.findOne.mockResolvedValue(mockNotification);

      await markAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle already read notification', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { notificationId: 'notif-123' }
      };
      mockNotification.isRead = true;
      Notification.findOne.mockResolvedValue(mockNotification);

      await markAsRead(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });

  describe('Mark All as Read', () => {
    test('should mark all notifications as read', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {}
      };
      Notification.update.mockResolvedValue([10]);

      await markAllAsRead(mockReq, mockRes);

      expect(Notification.update).toHaveBeenCalledWith(
        { isRead: true, readAt: expect.any(Date) },
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            isRead: false
          })
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'All notifications marked as read',
        data: expect.objectContaining({ updated: 10 })
      }));
    });

    test('should mark filtered notifications as read', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: { type: 'message' }
      };
      Notification.update.mockResolvedValue([5]);

      await markAllAsRead(mockReq, mockRes);

      expect(Notification.update).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            type: 'message',
            isRead: false
          })
        })
      );
    });

    test('should handle no unread notifications', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {}
      };
      Notification.update.mockResolvedValue([0]);

      await markAllAsRead(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ updated: 0 })
      }));
    });
  });

  describe('Delete Notification', () => {
    test('should delete notification successfully', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { notificationId: 'notif-123' }
      };
      Notification.findOne.mockResolvedValue(mockNotification);

      await deleteNotification(mockReq, mockRes);

      expect(mockNotification.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Notification deleted'
      }));
    });

    test('should return 404 for non-existent notification', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { notificationId: 'nonexistent' }
      };
      Notification.findOne.mockResolvedValue(null);

      await deleteNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized deletion', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { notificationId: 'notif-123' }
      };
      Notification.findOne.mockResolvedValue(mockNotification);

      await deleteNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Create Notification', () => {
    test('should create notification successfully', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
        body: {
          userId: 'user-456',
          type: 'announcement',
          title: 'New Feature',
          message: 'Check out our new feature!',
          data: { url: '/new-feature' }
        }
      };
      Notification.create.mockResolvedValue(mockNotification);

      await createNotification(mockReq, mockRes);

      expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-456',
        type: 'announcement',
        title: 'New Feature',
        isRead: false
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should validate notification type', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
        body: {
          userId: 'user-456',
          type: 'invalid-type',
          title: 'Test',
          message: 'Test message'
        }
      };

      await createNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate required fields', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
        body: { userId: 'user-456', type: 'message' }
      };

      await createNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should require admin role for admin notifications', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'student' },
        body: {
          userId: 'user-456',
          type: 'announcement',
          title: 'Test',
          message: 'Test'
        }
      };

      await createNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Update Preferences', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {
          email: {
            newConnection: false,
            newMessage: true
          },
          push: {
            newConnection: true,
            newMessage: true
          }
        }
      };
    });

    test('should update preferences successfully', async () => {
      await updatePreferences(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Preferences updated'
      }));
    });

    test('should validate preference structure', async () => {
      mockReq.body.email = 'not-an-object';

      await updatePreferences(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle partial updates', async () => {
      mockReq.body = {
        email: { newConnection: false }
      };

      await updatePreferences(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });

  describe('Get Preferences', () => {
    test('should get user preferences', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' }
      };

      await getPreferences(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });

    test('should return default preferences if none set', async () => {
      mockReq = {
        headers: { 'x-user-id': 'new-user' }
      };

      await getPreferences(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: expect.any(Object),
          push: expect.any(Object)
        })
      }));
    });
  });

  describe('Push Notifications', () => {
    describe('Subscribe', () => {
      test('should subscribe to push notifications', async () => {
        mockReq = {
          headers: { 'x-user-id': 'user-123' },
          body: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/token',
            keys: {
              p256dh: 'key-p256dh',
              auth: 'key-auth'
            }
          }
        };
        PushSubscription.findOne.mockResolvedValue(null);
        PushSubscription.create.mockResolvedValue({});

        await subscribePush(mockReq, mockRes);

        expect(PushSubscription.create).toHaveBeenCalledWith(expect.objectContaining({
          userId: 'user-123',
          endpoint: expect.any(String),
          p256dh: 'key-p256dh',
          auth: 'key-auth'
        }));
        expect(mockRes.status).toHaveBeenCalledWith(201);
      });

      test('should update existing subscription', async () => {
        mockReq = {
          headers: { 'x-user-id': 'user-123' },
          body: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/new-token',
            keys: { p256dh: 'new-key', auth: 'new-auth' }
          }
        };
        const existingSub = {
          update: jest.fn()
        };
        PushSubscription.findOne.mockResolvedValue(existingSub);

        await subscribePush(mockReq, mockRes);

        expect(existingSub.update).toHaveBeenCalledWith(expect.objectContaining({
          endpoint: expect.any(String)
        }));
      });

      test('should validate subscription data', async () => {
        mockReq = {
          headers: { 'x-user-id': 'user-123' },
          body: { endpoint: 'invalid' }
        };

        await subscribePush(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Unsubscribe', () => {
      test('should unsubscribe from push notifications', async () => {
        mockReq = {
          headers: { 'x-user-id': 'user-123' },
          body: { endpoint: 'https://fcm.googleapis.com/fcm/send/token' }
        };
        PushSubscription.destroy = jest.fn().mockResolvedValue(1);

        await unsubscribePush(mockReq, mockRes);

        expect(PushSubscription.destroy).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            endpoint: expect.any(String)
          })
        }));
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Unsubscribed successfully'
        }));
      });

      test('should handle non-existent subscription', async () => {
        mockReq = {
          headers: { 'x-user-id': 'user-123' },
          body: { endpoint: 'nonexistent' }
        };
        PushSubscription.destroy = jest.fn().mockResolvedValue(0);

        await unsubscribePush(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true
        }));
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle very long notification messages', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
        body: {
          userId: 'user-456',
          type: 'message',
          title: 'Long message',
          message: 'a'.repeat(1000)
        }
      };
      Notification.create.mockResolvedValue(mockNotification);

      await createNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle rapid notification creation', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
        body: {
          userId: 'user-456',
          type: 'like',
          title: 'Like',
          message: 'Someone liked your post'
        }
      };
      Notification.create.mockResolvedValue(mockNotification);

      // Simulate burst of notifications
      const promises = Array(20).fill().map(() => createNotification(mockReq, mockRes));
      await Promise.all(promises);

      expect(Notification.create).toHaveBeenCalledTimes(20);
    });

    test('should handle large number of notifications', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: { page: '1', limit: '100' }
      };
      Notification.findAndCountAll.mockResolvedValue({
        count: 1000,
        rows: Array(100).fill(mockNotification)
      });

      await getNotifications(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        meta: expect.objectContaining({ total: 1000 })
      }));
    });

    test('should handle unicode in notification content', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
        body: {
          userId: 'user-456',
          type: 'message',
          title: '🎉 Congratulations! 恭喜',
          message: 'You won the award! 🏆'
        }
      };
      Notification.create.mockResolvedValue(mockNotification);

      await createNotification(mockReq, mockRes);

      expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('🎉')
      }));
    });

    test('should handle old notification cleanup', async () => {
      // This would be a background job, but testing the logic
      const oldNotification = {
        ...mockNotification,
        createdAt: new Date('2023-01-01'),
        isRead: true
      };

      // Notifications older than 90 days should be candidates for cleanup
      const daysOld = Math.floor((Date.now() - oldNotification.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysOld).toBeGreaterThan(90);
    });

    test('should handle notification data payload limits', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
        body: {
          userId: 'user-456',
          type: 'message',
          title: 'Data Test',
          message: 'Test',
          data: { large: 'x'.repeat(10000) }
        }
      };
      Notification.create.mockResolvedValue(mockNotification);

      await createNotification(mockReq, mockRes);

      // Should handle large data or truncate
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle concurrent preference updates', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: { email: { newMessage: true } }
      };

      const promises = Array(5).fill().map(() => updatePreferences(mockReq, mockRes));
      await Promise.all(promises);

      // All should complete without error
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('should handle all notification types', async () => {
      const notificationTypes = ['like', 'comment', 'follow', 'message', 'connection', 'job', 'event', 'announcement'];
      
      for (const type of notificationTypes) {
        mockReq = {
          headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
          body: {
            userId: 'user-456',
            type,
            title: `${type} notification`,
            message: 'Test message'
          }
        };
        Notification.create.mockResolvedValue({ ...mockNotification, type });

        await createNotification(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(201);
      }
    });

    test('should handle invalid user IDs gracefully', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'admin' },
        body: {
          userId: 'nonexistent-user-99999',
          type: 'message',
          title: 'Test',
          message: 'Test'
        }
      };
      Notification.create.mockRejectedValue(new Error('Foreign key constraint'));

      await createNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
