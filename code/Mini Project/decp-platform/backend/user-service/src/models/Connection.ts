import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ConnectionAttributes {
  id: string;
  followerId: string;
  followingId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConnectionCreationAttributes extends Optional<ConnectionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Connection extends Model<ConnectionAttributes, ConnectionCreationAttributes> implements ConnectionAttributes {
  public id!: string;
  public followerId!: string;
  public followingId!: string;
  public status!: 'pending' | 'accepted' | 'blocked';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Connection.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    followerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    followingId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
      defaultValue: 'pending'
    }
  },
  {
    sequelize,
    tableName: 'connections',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['followerId', 'followingId']
      }
    ]
  }
);

export default Connection;
