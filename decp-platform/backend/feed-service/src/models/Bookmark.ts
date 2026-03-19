import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BookmarkAttributes {
  id: string;
  userId: string;
  postId: string;
  createdAt?: Date;
}

class Bookmark extends Model<BookmarkAttributes, Optional<BookmarkAttributes, 'id'>> implements BookmarkAttributes {
  declare id: string;
  declare userId: string;
  declare postId: string;
  declare createdAt: Date;
}

Bookmark.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  postId: { type: DataTypes.UUID, allowNull: false },
}, {
  sequelize,
  modelName: 'Bookmark',
  tableName: 'bookmarks',
  indexes: [{ unique: true, fields: ['userId', 'postId'] }],
  timestamps: true,
  updatedAt: false,
});

export default Bookmark;
