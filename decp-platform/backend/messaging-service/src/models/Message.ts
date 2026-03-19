import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface MessageAttributes {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'type' | 'attachmentUrl' | 'isDeleted' | 'createdAt' | 'updatedAt'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public conversationId!: string;
  public senderId!: string;
  public content!: string;
  public type!: 'text' | 'image' | 'file';
  public attachmentUrl!: string;
  public isDeleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  conversationId: { type: DataTypes.UUID, allowNull: false },
  senderId: { type: DataTypes.UUID, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('text', 'image', 'file'), defaultValue: 'text' },
  attachmentUrl: { type: DataTypes.STRING(500), allowNull: true },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  sequelize,
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['conversationId', 'createdAt'] }, // paginate messages per conversation
    { fields: ['senderId'] }                      // sender history lookup
  ]
});

export default Message;
