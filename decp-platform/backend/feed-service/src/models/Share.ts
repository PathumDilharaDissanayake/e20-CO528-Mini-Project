import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ShareAttributes {
  id: string;
  postId: string;
  userId: string;
  createdAt?: Date;
}

interface ShareCreationAttributes extends Optional<ShareAttributes, 'id' | 'createdAt'> {}

class Share extends Model<ShareAttributes, ShareCreationAttributes> implements ShareAttributes {
  public id!: string;
  public postId!: string;
  public userId!: string;
  public readonly createdAt!: Date;
}

Share.init(
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
    tableName: 'shares',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['postId', 'userId']
      },
      {
        fields: ['postId']
      }
    ]
  }
);

export default Share;
