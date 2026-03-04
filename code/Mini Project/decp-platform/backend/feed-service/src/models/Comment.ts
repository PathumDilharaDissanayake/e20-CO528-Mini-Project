import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { AuthorInfo } from './Post';

export interface CommentAttributes {
  id: string;
  postId: string;
  userId: string;
  author?: AuthorInfo;
  content: string;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'author' | 'parentId' | 'createdAt' | 'updatedAt'> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: string;
  public postId!: string;
  public userId!: string;
  public author!: AuthorInfo;
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
    author: {
      type: DataTypes.JSONB,
      allowNull: true
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
    timestamps: true,
    indexes: [
      // Fetch comments by post, newest first
      { fields: ['postId', 'createdAt'] },
      // Threaded replies
      { fields: ['parentId'] }
    ]
  }
);

export default Comment;
