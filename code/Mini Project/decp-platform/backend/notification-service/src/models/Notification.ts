import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NotificationAttributes {
  id: string;
  userId: string;
  type: 'message' | 'connection' | 'job' | 'event' | 'mention' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'data' | 'isRead' | 'readAt' | 'createdAt' | 'updatedAt'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public userId!: string;
  public type!: 'message' | 'connection' | 'job' | 'event' | 'mention' | 'system';
  public title!: string;
  public body!: string;
  public data!: Record<string, any>;
  public isRead!: boolean;
  public readAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('message', 'connection', 'job', 'event', 'mention', 'system'), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  data: { type: DataTypes.JSONB, defaultValue: {} },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt: { type: DataTypes.DATE, allowNull: true }
}, { sequelize, tableName: 'notifications', timestamps: true });

export default Notification;
