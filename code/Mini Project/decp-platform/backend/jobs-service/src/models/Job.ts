import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface JobAttributes {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: 'hourly' | 'monthly' | 'yearly';
  };
  requirements: string[];
  skills: string[];
  postedBy: string;
  status: 'active' | 'closed' | 'draft';
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'salary' | 'status' | 'expiresAt' | 'createdAt' | 'updatedAt'> {}

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public company!: string;
  public location!: string;
  public type!: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  public salary!: any;
  public requirements!: string[];
  public skills!: string[];
  public postedBy!: string;
  public status!: 'active' | 'closed' | 'draft';
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Job.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  company: { type: DataTypes.STRING(200), allowNull: false },
  location: { type: DataTypes.STRING(200), allowNull: false },
  type: { type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'remote'), allowNull: false },
  salary: { type: DataTypes.JSONB, defaultValue: {} },
  requirements: { type: DataTypes.JSONB, defaultValue: [] },
  skills: { type: DataTypes.JSONB, defaultValue: [] },
  postedBy: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'closed', 'draft'), defaultValue: 'active' },
  expiresAt: { type: DataTypes.DATE, allowNull: true }
}, { sequelize, tableName: 'jobs', timestamps: true });

export default Job;
