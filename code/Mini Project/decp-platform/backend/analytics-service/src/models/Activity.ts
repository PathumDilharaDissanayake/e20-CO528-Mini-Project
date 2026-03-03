import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ActivityAttributes {
  id: string;
  userId?: string;
  action: string;
  entityType: 'user' | 'post' | 'job' | 'event' | 'research' | 'message';
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'userId' | 'entityId' | 'metadata' | 'ipAddress' | 'userAgent' | 'createdAt'> {}

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  public id!: string;
  public userId!: string;
  public action!: string;
  public entityType!: 'user' | 'post' | 'job' | 'event' | 'research' | 'message';
  public entityId!: string;
  public metadata!: Record<string, any>;
  public ipAddress!: string;
  public userAgent!: string;
  public readonly createdAt!: Date;
}

Activity.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entityType: { type: DataTypes.ENUM('user', 'post', 'job', 'event', 'research', 'message'), allowNull: false },
  entityId: { type: DataTypes.UUID, allowNull: true },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
  userAgent: { type: DataTypes.STRING(500), allowNull: true }
}, { sequelize, tableName: 'activities', timestamps: true, updatedAt: false });

export default Activity;
