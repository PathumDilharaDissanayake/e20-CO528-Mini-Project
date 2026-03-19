import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ConversationAttributes {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  participants: string[];
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'title' | 'createdAt' | 'updatedAt'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: string;
  public type!: 'direct' | 'group';
  public title!: string;
  public participants!: string[];
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Conversation.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { type: DataTypes.ENUM('direct', 'group'), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: true },
  participants: { type: DataTypes.JSONB, defaultValue: [] },
  createdBy: { type: DataTypes.UUID, allowNull: false }
}, { sequelize, tableName: 'conversations', timestamps: true });

export default Conversation;
