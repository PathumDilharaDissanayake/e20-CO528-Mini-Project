import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RSVPAttributes {
  id: string;
  eventId: string;
  userId: string;
  status: 'going' | 'maybe' | 'not_going';
  createdAt?: Date;
  updatedAt?: Date;
}

interface RSVPCreationAttributes extends Optional<RSVPAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class RSVP extends Model<RSVPAttributes, RSVPCreationAttributes> implements RSVPAttributes {
  public id!: string;
  public eventId!: string;
  public userId!: string;
  public status!: 'going' | 'maybe' | 'not_going';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RSVP.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  eventId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('going', 'maybe', 'not_going'), defaultValue: 'going' }
}, { 
  sequelize, 
  tableName: 'rsvps', 
  timestamps: true,
  indexes: [{ unique: true, fields: ['eventId', 'userId'] }]
});

export default RSVP;
