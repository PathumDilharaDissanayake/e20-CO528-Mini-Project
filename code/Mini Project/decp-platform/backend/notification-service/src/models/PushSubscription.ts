import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PushSubscriptionAttributes {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PushSubscriptionCreationAttributes extends Optional<PushSubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PushSubscription extends Model<PushSubscriptionAttributes, PushSubscriptionCreationAttributes> implements PushSubscriptionAttributes {
  public id!: string;
  public userId!: string;
  public endpoint!: string;
  public p256dh!: string;
  public auth!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PushSubscription.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  endpoint: { type: DataTypes.TEXT, allowNull: false },
  p256dh: { type: DataTypes.STRING(200), allowNull: false },
  auth: { type: DataTypes.STRING(200), allowNull: false }
}, { sequelize, tableName: 'push_subscriptions', timestamps: true });

export default PushSubscription;
