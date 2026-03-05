import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AuthorInfo {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

export interface PostAttributes {
  id: string;
  userId: string;
  author?: AuthorInfo;
  content: string;
  mediaUrls?: string[];
  type: 'text' | 'image' | 'video' | 'document' | 'poll' | 'share';
  likes: number;
  comments: number;
  shares: number;
  isPublic: boolean;
  pollOptions?: Array<{ text: string; votes: string[] }> | null;
  pollEndsAt?: Date | null;
  originalPostId?: string | null; // ID of the original post if this is a shared post
  sharedBy?: AuthorInfo | null;   // AuthorInfo of the user who shared the post
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'author' | 'likes' | 'comments' | 'shares' | 'isPublic' | 'pollOptions' | 'pollEndsAt' | 'originalPostId' | 'sharedBy' | 'createdAt' | 'updatedAt'> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: string;
  public userId!: string;
  public author!: AuthorInfo;
  public content!: string;
  public mediaUrls!: string[];
  public type!: 'text' | 'image' | 'video' | 'document' | 'poll' | 'share';
  public likes!: number;
  public comments!: number;
  public shares!: number;
  public isPublic!: boolean;
  public pollOptions!: Array<{ text: string; votes: string[] }> | null;
  public pollEndsAt!: Date | null;
  public originalPostId?: string | null;
  public sharedBy?: AuthorInfo | null;
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
    author: {
      type: DataTypes.JSONB,
      allowNull: true
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
      type: DataTypes.ENUM('text', 'image', 'video', 'document', 'poll', 'share'),
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
    },
    pollOptions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      // shape: [{ text: string, votes: string[] }]
    },
    pollEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    originalPostId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'posts', // This is a self-reference
        key: 'id',
      },
    },
    sharedBy: {
      type: DataTypes.JSONB, // Store AuthorInfo
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true,
    indexes: [
      // High-frequency feed query: public posts ordered by date
      { fields: ['isPublic', 'createdAt'] },
      // User profile posts
      { fields: ['userId', 'createdAt'] },
      // Cursor-based pagination support
      { fields: ['createdAt', 'id'] }
    ]
  }
);

export default Post;
