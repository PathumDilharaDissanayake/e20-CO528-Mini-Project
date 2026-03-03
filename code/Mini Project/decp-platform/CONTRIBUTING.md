# Contributing to DECP Platform

Thank you for your interest in contributing to the DECP Platform! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, please include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, versions)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear use case**
- **Expected behavior**
- **Possible implementation approach**
- **Why this would be useful**

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

See [Development Guide](docs/05-DEVELOPMENT_GUIDE.md) for detailed setup instructions.

### Quick Start

```bash
# Clone your fork
git clone https://github.com/your-username/decp-platform.git
cd decp-platform

# Install dependencies
npm run install:all

# Start development environment
docker-compose -f backend/docker-compose.infra.yml up -d
npm run dev
```

## Style Guidelines

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs after the first line

Example:
```
feat(auth): add password reset functionality

- Add email service for sending reset links
- Add token generation and validation
- Add password update endpoint

Fixes #123
```

### TypeScript/JavaScript Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful variable names
- Add JSDoc comments for public APIs

### React Components

- Use functional components with hooks
- Use TypeScript interfaces for props
- Keep components small and focused
- Use custom hooks for reusable logic

### Testing

- Write unit tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

## Review Process

All submissions require review before being merged:

1. **Automated Checks** must pass:
   - Linting
   - Type checking
   - Unit tests
   - Build verification

2. **Code Review** by maintainers:
   - Code quality
   - Architecture alignment
   - Security considerations
   - Documentation

3. **Approval** required from at least one maintainer

## Questions?

- Join our Slack channel: #decp-platform
- Email: decp@eng.pdn.ac.lk
- Create an issue for discussion

Thank you for contributing!
