import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface LikeAttributes {
  id: string;
  postId: string;
  userId: string;
  createdAt?: Date;
}

interface LikeCreationAttributes extends Optional<LikeAttributes, 'id' | 'createdAt'> {}

class Like extends Model<LikeAttributes, LikeCreationAttributes> implements LikeAttributes {
  public id!: string;
  public postId!: string;
  public userId!: string;
  public readonly createdAt!: Date;
}

Like.init(
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
    }
  },
  {
    sequelize,
    tableName: 'likes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['postId', 'userId']
      }
    ]
  }
);

export default Like;
