import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PostAttributes {
  id: string;
  userId: string;
  content: string;
  mediaUrls?: string[];
  type: 'text' | 'image' | 'video' | 'document';
  likes: number;
  comments: number;
  shares: number;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'likes' | 'comments' | 'shares' | 'isPublic' | 'createdAt' | 'updatedAt'> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: string;
  public userId!: string;
  public content!: string;
  public mediaUrls!: string[];
  public type!: 'text' | 'image' | 'video' | 'document';
  public likes!: number;
  public comments!: number;
  public shares!: number;
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mediaUrls: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'video', 'document'),
      defaultValue: 'text'
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comments: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    shares: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true
  }
);

export default Post;
