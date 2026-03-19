import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ApplicationAttributes {
  id: string;
  jobId: string;
  userId: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offered' | 'rejected' | 'withdrawn';
  answers?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApplicationCreationAttributes extends Optional<ApplicationAttributes, 'id' | 'resumeUrl' | 'coverLetter' | 'answers' | 'status' | 'createdAt' | 'updatedAt'> {}

class Application extends Model<ApplicationAttributes, ApplicationCreationAttributes> implements ApplicationAttributes {
  public id!: string;
  public jobId!: string;
  public userId!: string;
  public resumeUrl!: string;
  public coverLetter!: string;
  public status!: 'pending' | 'reviewing' | 'interview' | 'offered' | 'rejected' | 'withdrawn';
  public answers!: Record<string, string>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Application.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  resumeUrl: { type: DataTypes.STRING(500), allowNull: true },
  coverLetter: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'reviewing', 'interview', 'offered', 'rejected', 'withdrawn'), defaultValue: 'pending' },
  answers: { type: DataTypes.JSONB, defaultValue: {} }
}, { 
  sequelize, 
  tableName: 'applications', 
  timestamps: true,
  indexes: [{ unique: true, fields: ['jobId', 'userId'] }]
});

export default Application;
