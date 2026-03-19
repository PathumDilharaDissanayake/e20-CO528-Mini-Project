import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ResearchProjectAttributes {
  id: string;
  title: string;
  abstract: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  startDate?: Date;
  endDate?: Date;
  leadResearcherId: string;
  collaborators?: string[];
  tags?: string[];
  visibility: 'public' | 'private' | 'department';
  documents?: string[];
  progress?: number;
  field?: string;
  coverImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ResearchProjectCreationAttributes extends Optional<ResearchProjectAttributes, 'id' | 'description' | 'status' | 'startDate' | 'endDate' | 'collaborators' | 'tags' | 'visibility' | 'documents' | 'progress' | 'field' | 'coverImage' | 'createdAt' | 'updatedAt'> {}

class ResearchProject extends Model<ResearchProjectAttributes, ResearchProjectCreationAttributes> implements ResearchProjectAttributes {
  public id!: string;
  public title!: string;
  public abstract!: string;
  public description!: string;
  public status!: 'planning' | 'active' | 'completed' | 'on_hold';
  public startDate!: Date;
  public endDate!: Date;
  public leadResearcherId!: string;
  public collaborators!: string[];
  public tags!: string[];
  public visibility!: 'public' | 'private' | 'department';
  public documents!: string[];
  public progress!: number;
  public field!: string;
  public coverImage!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ResearchProject.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(300), allowNull: false },
  abstract: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('planning', 'active', 'completed', 'on_hold'), defaultValue: 'planning' },
  startDate: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
  leadResearcherId: { type: DataTypes.UUID, allowNull: false },
  collaborators: { type: DataTypes.JSONB, defaultValue: [] },
  tags: { type: DataTypes.JSONB, defaultValue: [] },
  visibility: { type: DataTypes.ENUM('public', 'private', 'department'), defaultValue: 'department' },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
  progress: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: true },
  field: { type: DataTypes.STRING(100), allowNull: true },
  coverImage: { type: DataTypes.STRING(500), allowNull: true }
}, { sequelize, tableName: 'research_projects', timestamps: true });

export default ResearchProject;
