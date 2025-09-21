# Contributing to CollabQuest

Thank you for your interest in contributing to CollabQuest! This document provides guidelines and standards to ensure consistency and readability for all contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and constructive
- Focus on what's best for the community
- Accept constructive criticism gracefully
- Help others learn and grow
- Follow our coding standards

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Docker (for code execution)
- Git

### Local Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/CollabQuest.git
   cd CollabQuest
   ```

2. **Set up environment**
   ```bash
   # Windows
   setup-local-dev.bat
   
   # macOS/Linux
   cp env.example .env
   cp server/env.example server/.env
   cp client/.env.example client/.env.local
   ```

3. **Install dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

4. **Start development servers**
   ```bash
   # Backend
   cd server && npm run dev
   
   # Frontend (new terminal)
   cd client && npm start
   ```

## 📁 Project Structure

### Standard Directory Layout

```
CollabQuest/
├── 📁 client/                    # React frontend application
│   ├── 📁 public/               # Static assets
│   ├── 📁 src/                  # Source code
│   │   ├── 📁 components/       # Reusable UI components
│   │   │   ├── 📁 DSA/         # DSA practice components
│   │   │   ├── 📁 quiz/        # Quiz system components
│   │   │   └── 📁 battle/      # Battle system components
│   │   ├── 📁 battle/          # Battle system modules
│   │   ├── 📁 contexts/        # React contexts
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   ├── 📁 utils/           # Utility functions
│   │   └── 📁 types/           # TypeScript definitions
│   ├── 📄 package.json         # Dependencies and scripts
│   ├── 📄 tsconfig.json        # TypeScript configuration
│   └── 📄 README.md            # Component documentation
│
├── 📁 server/                   # Node.js backend server
│   ├── 📁 config/              # Configuration files
│   ├── 📁 middleware/          # Express middleware
│   ├── 📁 models/              # Database models
│   │   ├── 📁 dsa/            # DSA-related models
│   │   └── 📄 *.js            # Other models
│   ├── 📁 routes/              # API routes
│   ├── 📁 services/            # Business logic
│   ├── 📁 utils/               # Utility functions
│   ├── 📁 scripts/             # Database scripts
│   ├── 📁 tests/               # Test files
│   ├── 📄 server.js            # Main server file
│   └── 📄 README.md            # Server documentation
│
├── 📁 docs/                     # Documentation
│   ├── 📁 deployment/          # Deployment guides
│   ├── 📁 development/         # Development docs
│   ├── 📁 modules/             # Module documentation
│   └── 📄 README.md            # Documentation index
│
├── 📁 tests/                    # Integration and E2E tests
│   └── 📁 manual/              # Manual test scripts
│
├── 📁 executor/                 # Code execution service
│
├── 📄 README.md                 # Main project documentation
├── 📄 CONTRIBUTING.md           # This file
├── 📄 package.json              # Root dependencies
├── 📄 docker-compose.yml        # Docker configuration
├── 📄 render.yaml               # Render deployment config
└── 📄 .gitignore                # Git ignore rules
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `DSAProblemPage.tsx`)
- **Utilities**: camelCase (e.g., `codeExecutor.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`)
- **Configuration**: kebab-case (e.g., `render.yaml`)
- **Documentation**: UPPER_SNAKE_CASE (e.g., `CONTRIBUTING.md`)

## 🔧 Development Guidelines

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add OAuth login functionality
fix(battle): resolve scoring calculation bug
docs(readme): update installation instructions
refactor(dsa): optimize problem loading performance
test(quiz): add unit tests for power-ups
```

### Code Organization

#### Frontend (React/TypeScript)
- **Components**: One component per file
- **Hooks**: Custom hooks in separate files
- **Types**: Shared types in `types/` directory
- **Utils**: Pure utility functions
- **Styles**: CSS modules or styled-components

#### Backend (Node.js/Express)
- **Routes**: One route file per resource
- **Models**: Mongoose schemas with validation
- **Services**: Business logic separated from routes
- **Middleware**: Reusable Express middleware
- **Utils**: Pure utility functions

## 📝 Code Standards

### TypeScript/JavaScript
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Add JSDoc comments for functions
- Use meaningful variable names

### React Components
```tsx
// Good: Clear component structure
interface DSAProblemProps {
  problemId: string;
  onComplete: (result: ProblemResult) => void;
}

export const DSAProblem: React.FC<DSAProblemProps> = ({ 
  problemId, 
  onComplete 
}) => {
  // Component logic here
  return (
    <div className="dsa-problem">
      {/* JSX content */}
    </div>
  );
};
```

### API Routes
```javascript
// Good: Clear route structure
router.post('/problems', 
  authMiddleware,
  validateRequest(problemSchema),
  async (req, res, next) => {
    try {
      const problem = await problemService.create(req.body);
      res.status(201).json(problem);
    } catch (error) {
      next(error);
    }
  }
);
```

### Error Handling
```javascript
// Good: Consistent error handling
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new AppError('Operation failed', 500);
}
```

## 🧪 Testing Guidelines

### Test Structure
- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test API endpoints
- **E2E Tests**: Test complete user flows
- **Manual Tests**: Scripts for manual testing

### Test Naming
```javascript
// Good: Descriptive test names
describe('DSA Problem Service', () => {
  it('should create a new problem with valid data', async () => {
    // Test implementation
  });
  
  it('should throw error when creating problem without title', async () => {
    // Test implementation
  });
});
```

### Test Coverage
- Aim for 80%+ code coverage
- Test happy paths and error cases
- Mock external dependencies
- Use meaningful test data

## 📤 Pull Request Process

### Before Submitting
1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new functionality**
5. **Update documentation**
6. **Run the test suite**
7. **Ensure code passes linting**

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process
1. **Automated checks must pass**
2. **Code review by maintainers**
3. **Address feedback**
4. **Merge after approval**

## 🐛 Issue Reporting

### Bug Reports
```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Version: [e.g., 1.2.3]
```

### Feature Requests
```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should it work?

**Alternatives**
Other solutions considered
```

## 📚 Documentation Standards

### README Files
- Clear project overview
- Installation instructions
- Usage examples
- API documentation
- Contributing guidelines

### Code Comments
```javascript
/**
 * Creates a new DSA problem with validation
 * @param {Object} problemData - Problem data
 * @param {string} problemData.title - Problem title
 * @param {string} problemData.description - Problem description
 * @returns {Promise<Object>} Created problem
 * @throws {ValidationError} When data is invalid
 */
async function createProblem(problemData) {
  // Implementation
}
```

## 🔍 Code Review Guidelines

### For Reviewers
- Be constructive and helpful
- Focus on code quality and standards
- Check for security issues
- Verify test coverage
- Ensure documentation is updated

### For Authors
- Respond to feedback promptly
- Ask questions if unclear
- Make requested changes
- Update tests if needed
- Keep PRs focused and small

## 🚀 Deployment

### Development
- Use `npm run dev` for development
- Use `npm run test` for testing
- Use `npm run lint` for linting

### Production
- Follow deployment guides in `docs/deployment/`
- Ensure all tests pass
- Update environment variables
- Monitor deployment logs

## 📞 Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Questions and community chat
- **Documentation**: Check `docs/` directory
- **Code Examples**: Look at existing code

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to CollabQuest! 🎉
