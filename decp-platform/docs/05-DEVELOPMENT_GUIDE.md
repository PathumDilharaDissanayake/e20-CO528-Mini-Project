# DECP Platform - Development Guide

## Prerequisites

### Required Software
- **Node.js:** 20.x or higher ([Download](https://nodejs.org/))
- **npm:** 10.x or higher (comes with Node.js)
- **Git:** 2.x or higher
- **Docker:** 24.x or higher ([Download](https://www.docker.com/))
- **Docker Compose:** 2.x or higher

### Optional Software
- **VS Code:** Recommended IDE ([Download](https://code.visualstudio.com/))
- **Postman:** API testing ([Download](https://www.postman.com/))
- **pgAdmin:** PostgreSQL GUI ([Download](https://www.pgadmin.org/))

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/university/decp-platform.git
cd decp-platform
```

### 2. Install VS Code Extensions
- ESLint
- Prettier
- TypeScript Hero
- Docker
- Thunder Client (REST API testing)
- GitLens

### 3. Environment Variables

Create `.env` files in each service directory:

#### Backend `.env`
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=decp
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# AWS (optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=decp-media

# Other
NODE_ENV=development
PORT=3001
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3007
```

## Development Workflow

### 1. Start Infrastructure Services
```bash
# Start PostgreSQL, Redis, RabbitMQ
docker-compose -f backend/docker-compose.infra.yml up -d
```

### 2. Database Setup
```bash
cd backend
npm run db:create
npm run db:migrate
npm run db:seed
```

### 3. Start Backend Services
```bash
# Start all services
npm run dev:all

# Or start individual services
npm run dev:auth
npm run dev:user
npm run dev:feed
# etc.
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Start Mobile
```bash
cd mobile
npm install
npm start
# Press 'i' for iOS simulator or 'a' for Android
```

## Git Workflow

### Branching Strategy
```
main
├── develop
├── feature/auth-improvements
├── feature/job-search
├── bugfix/login-error
└── hotfix/security-patch
```

### Commit Convention
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build process, dependencies

**Examples:**
```
feat(auth): add OAuth Google login
fix(feed): resolve infinite scroll bug
docs(api): update authentication docs
```

### Pull Request Process
1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR
4. Ensure CI passes
5. Request code review
6. Merge after approval

## Code Style Guide

### TypeScript/JavaScript
```typescript
// Use strict TypeScript
"strict": true

// Naming conventions
interface UserProfile { }     // PascalCase for types
const userProfile: UserProfile; // camelCase for variables
function getUserProfile(): UserProfile { } // camelCase for functions
const API_BASE_URL = '';      // UPPER_SNAKE_CASE for constants

// Use async/await
async function fetchData(): Promise<Data> {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch data', error);
    throw error;
  }
}
```

### React Components
```typescript
// Functional components with TypeScript
interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(user.id);
  }, [onSelect, user.id]);

  return (
    <Card onClick={handleClick}>
      <Avatar src={user.avatar} />
      <Typography>{user.name}</Typography>
    </Card>
  );
};
```

### Database Models
```typescript
// Sequelize model example
interface UserAttributes {
  id: string;
  email: string;
  // ...
}

class User extends Model<UserAttributes> {
  // Model definition
}

User.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  }
}, { sequelize, tableName: 'users' });
```

## Testing Guidelines

### Unit Tests
```typescript
// Example test
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await authService.login('user@test.com', 'password');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        authService.login('user@test.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### E2E Tests
```javascript
describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('[data-testid=email]').type('user@test.com');
    cy.get('[data-testid=password]').type('password');
    cy.get('[data-testid=submit]').click();
    cy.url().should('include', '/feed');
  });
});
```

## Debugging

### Backend Debugging
```bash
# Debug with Node.js inspector
node --inspect-brk=0.0.0.0:9229 dist/server.js

# Or use VS Code debugger
# .vscode/launch.json configuration provided
```

### Frontend Debugging
- Use React DevTools browser extension
- Use Redux DevTools for state debugging
- Source maps enabled in development

### Mobile Debugging
```bash
# React Native debugger
npm install -g react-native-debugger

# Flipper for debugging
# https://fbflipper.com/
```

## Common Issues

### Issue: Port already in use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Issue: Database connection failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs decp-postgres
```

### Issue: Module not found
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

### Issue: Migration failed
```bash
# Reset database
npm run db:drop
npm run db:create
npm run db:migrate
```

## Performance Optimization

### Backend
- Use database indexes for frequent queries
- Implement caching with Redis
- Use connection pooling
- Optimize SQL queries

### Frontend
- Lazy load routes
- Optimize images (WebP format)
- Use React.memo for expensive components
- Implement virtual scrolling for long lists

### Mobile
- Optimize bundle size
- Use Hermes engine
- Implement code splitting
- Cache API responses

## Security Checklist

- [ ] No secrets in code
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting enabled
- [ ] HTTPS in production
- [ ] Security headers configured

## Useful Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Start production server
npm run start
```

## Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Patterns](https://reactpatterns.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Docker Documentation](https://docs.docker.com/)

## Getting Help

- Check [Troubleshooting Guide](13-TROUBLESHOOTING.md)
- Review [API Documentation](03-API_DOCUMENTATION.md)
- Ask in team Slack channel
- Create GitHub issue
