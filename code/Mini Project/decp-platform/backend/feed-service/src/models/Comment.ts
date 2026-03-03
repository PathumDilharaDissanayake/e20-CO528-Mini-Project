import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CommentAttributes {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'parentId' | 'createdAt' | 'updatedAt'> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: string;
  public postId!: string;
  public userId!: string;
  public content!: string;
  public parentId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'comments',
    timestamps: true
  }
);

export default Comment;
