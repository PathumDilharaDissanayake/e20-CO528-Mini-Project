import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EventAttributes {
  id: string;
  title: string;
  description: string;
  type: 'webinar' | 'workshop' | 'seminar' | 'networking' | 'career_fair' | 'other';
  startDate: Date;
  endDate: Date;
  location?: string;
  isVirtual: boolean;
  meetingLink?: string;
  organizerId: string;
  capacity?: number;
  imageUrl?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface EventCreationAttributes extends Optional<EventAttributes, 'id' | 'location' | 'isVirtual' | 'meetingLink' | 'capacity' | 'imageUrl' | 'status' | 'tags' | 'createdAt' | 'updatedAt'> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public type!: 'webinar' | 'workshop' | 'seminar' | 'networking' | 'career_fair' | 'other';
  public startDate!: Date;
  public endDate!: Date;
  public location!: string;
  public isVirtual!: boolean;
  public meetingLink!: string;
  public organizerId!: string;
  public capacity!: number;
  public imageUrl!: string;
  public status!: 'draft' | 'published' | 'cancelled' | 'completed';
  public tags!: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Event.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('webinar', 'workshop', 'seminar', 'networking', 'career_fair', 'other'), allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  location: { type: DataTypes.STRING(300), allowNull: true },
  isVirtual: { type: DataTypes.BOOLEAN, defaultValue: false },
  meetingLink: { type: DataTypes.STRING(500), allowNull: true },
  organizerId: { type: DataTypes.UUID, allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  imageUrl: { type: DataTypes.STRING(500), allowNull: true },
  status: { type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'), defaultValue: 'draft' },
  tags: { type: DataTypes.JSONB, defaultValue: [] }
}, { sequelize, tableName: 'events', timestamps: true });

export default Event;
