import User from './User';
import RefreshToken from './RefreshToken';

// Define associations
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, RefreshToken };
