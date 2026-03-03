import dotenv from 'dotenv';
dotenv.config();
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3007', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'decp_messaging',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345'
  },
  jwt: { secret: process.env.JWT_SECRET || 'default-secret' },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' }
};
