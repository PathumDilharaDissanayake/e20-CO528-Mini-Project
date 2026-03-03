import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProfileAttributes {
  id: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: string;
  department?: string;
  graduationYear?: number;
  isEmailVerified?: boolean;
  bio?: string;
  headline?: string;
  location?: string;
  website?: string;
  phone?: string;
  skills?: string[];
  interests?: string[];
  education?: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear?: number;
    current: boolean;
  }[];
  experience?: {
    company: string;
    title: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProfileCreationAttributes extends Optional<ProfileAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Profile extends Model<ProfileAttributes, ProfileCreationAttributes> implements ProfileAttributes {
  public id!: string;
  public userId!: string;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: string;
  public avatar!: string;
  public department!: string;
  public graduationYear!: number;
  public isEmailVerified!: boolean;
  public bio!: string;
  public headline!: string;
  public location!: string;
  public website!: string;
  public phone!: string;
  public skills!: string[];
  public interests!: string[];
  public education!: any[];
  public experience!: any[];
  public socialLinks!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'student'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    graduationYear: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    headline: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    skills: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    interests: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    education: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    experience: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    socialLinks: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    tableName: 'profiles',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },               // already unique but makes intent explicit
      { fields: ['role'] },                 // role-based filter in searchUsers
      { fields: ['firstName', 'lastName'] }, // name-based sorting/search
      { fields: ['skills'], using: 'gin' }, // GIN index for @> (contains) skill filter
      { fields: ['createdAt'] }             // list ordering
    ]
  }
);

export default Profile;
