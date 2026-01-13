# Contributing to Guru Lens

Thank you for your interest in contributing to Guru Lens! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- Help others learn and grow

## Getting Started

### Prerequisites

- Node.js 22.13.0 or higher
- pnpm (recommended) or npm
- Git
- GitHub account

### Setup Development Environment

```bash
# 1. Fork the repository
# Go to https://github.com/jaceyu001/guru-lens and click "Fork"

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/guru-lens.git
cd guru-lens

# 3. Add upstream remote
git remote add upstream https://github.com/jaceyu001/guru-lens.git

# 4. Install dependencies
pnpm install

# 5. Set up environment variables
cp .env.example .env.local

# 6. Start development server
pnpm run dev

# 7. In another terminal, run tests
pnpm test
```

The application will be available at `http://localhost:3000`

## Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test additions
- `perf/` - Performance improvements

### 2. Make Changes

```bash
# Edit files as needed
# Follow code style guidelines (see below)

# Run tests to verify changes
pnpm test

# Run type checking
pnpm run type-check

# Run linting
pnpm run lint
```

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"
```

Commit message format:
```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `test:` - Test additions
- `perf:` - Performance improvements
- `chore:` - Build, dependencies

Example:
```
feat: add trading signal visualization

- Add chart component for signal display
- Implement entry/exit price markers
- Add risk/reward ratio visualization

Closes #123
```

### 4. Push Changes

```bash
# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to https://github.com/jaceyu001/guru-lens
2. Click "Compare & pull request"
3. Fill in PR template:
   - **Title**: Clear, descriptive title
   - **Description**: Explain changes and why
   - **Related Issues**: Link to related issues
   - **Testing**: Describe how you tested
   - **Screenshots**: Add if UI changes

### 6. Code Review

- Maintainers will review your PR
- Address feedback and make changes
- Push updates to the same branch
- PR will be merged once approved

## Code Style Guide

### TypeScript

```typescript
// Use explicit types
const calculateScore = (analyses: AnalysisOutput[]): number => {
  return analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
};

// Use const by default
const name = "Guru Lens";

// Use arrow functions
const handleClick = () => { /* ... */ };

// Use destructuring
const { symbol, score, verdict } = analysis;

// Use template literals
const message = `Analysis for ${symbol}: ${verdict}`;
```

### React Components

```typescript
// Use functional components with hooks
export default function TickerAnalysis() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use custom hooks for logic
  const { data, isLoading } = trpc.analyses.getLatestForTicker.useQuery({
    symbol: "AAPL"
  });

  // Extract complex logic to functions
  const calculateConsensus = (analyses: AnalysisOutput[]) => {
    // ...
  };

  return (
    <div className="space-y-4">
      {/* JSX content */}
    </div>
  );
}
```

### File Organization

```
client/
├── src/
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities and helpers
│   ├── contexts/        # React contexts
│   └── types/           # TypeScript types

server/
├── services/            # Business logic
├── routers.ts           # tRPC procedures
├── db.ts                # Database queries
└── tests/               # Test files
```

### Naming Conventions

```typescript
// Components: PascalCase
function TickerAnalysis() { }
export default TickerAnalysis;

// Functions/variables: camelCase
const calculateScore = () => { };
const personaScores = [];

// Constants: UPPER_SNAKE_CASE
const MAX_POSITION_SIZE = 10;
const DEFAULT_TIMEFRAME = "medium";

// Types: PascalCase
interface AnalysisOutput { }
type Recommendation = "BUY" | "SELL" | "HOLD";

// Files: kebab-case or PascalCase
// Components: PascalCase (TickerAnalysis.tsx)
// Utils: kebab-case (calculate-score.ts)
```

### Formatting

```bash
# Format code with Prettier
pnpm run format

# Or automatically on save (configure your editor)
```

## Testing

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("Portfolio Manager", () => {
  let votes: AgentVote[];

  beforeEach(() => {
    votes = [
      {
        agentName: "Warren Buffett",
        agentType: "persona",
        recommendation: "BUY",
        confidence: 85,
        score: 75,
        weight: 0.08
      }
    ];
  });

  it("should calculate consensus from agent votes", () => {
    const consensus = calculateConsensus(votes);
    
    expect(consensus.finalRecommendation).toBe("BUY");
    expect(consensus.confidenceScore).toBeGreaterThan(0);
    expect(consensus.consensusStrength).toBeGreaterThan(0);
  });

  it("should identify dissenting opinions", () => {
    votes.push({
      agentName: "Benjamin Graham",
      agentType: "persona",
      recommendation: "SELL",
      confidence: 70,
      score: 35,
      weight: 0.08
    });

    const consensus = calculateConsensus(votes);
    expect(consensus.dissent.length).toBeGreaterThan(0);
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/personas.test.ts

# Run tests matching pattern
pnpm test --grep "Portfolio Manager"

# Run with coverage
pnpm test --coverage

# Run in watch mode
pnpm test --watch

# Run with UI
pnpm test:ui
```

### Test Coverage

- Aim for >80% coverage
- Test happy paths and edge cases
- Mock external dependencies
- Test error scenarios

## Documentation

### Adding Documentation

1. **Code comments** - Explain why, not what
   ```typescript
   // Calculate weighted consensus using persona scores (8%), technical (2%), risk (4%)
   const weightedScore = calculateWeightedScore(votes);
   ```

2. **JSDoc comments** - Document functions and types
   ```typescript
   /**
    * Calculate consensus recommendation from all agent votes
    * @param votes - Array of agent votes with weights
    * @returns Consensus result with final recommendation
    */
   export function calculateConsensus(votes: AgentVote[]): ConsensusResult {
     // ...
   }
   ```

3. **README updates** - Document new features
   ```markdown
   ### New Feature: Trading Signals
   
   Generates actionable trading signals with entry/exit prices.
   ```

4. **Architecture docs** - Update ARCHITECTURE.md for major changes

## Submitting Issues

### Bug Reports

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Node.js version
- OS
- Browser (if applicable)

## Screenshots
If applicable
```

### Feature Requests

```markdown
## Description
Clear description of the feature

## Motivation
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternative Solutions
Any alternatives considered?

## Additional Context
Any other relevant information
```

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass: `pnpm test`
- [ ] Type checking passes: `pnpm run type-check`
- [ ] Linting passes: `pnpm run lint`
- [ ] Code is formatted: `pnpm run format`
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Checklist

- [ ] Title is descriptive
- [ ] Description explains changes
- [ ] Related issues are linked
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Screenshots included (if UI changes)

## Areas for Contribution

### High Priority

- [ ] Performance optimizations
- [ ] Bug fixes
- [ ] Test coverage improvements
- [ ] Documentation improvements

### Medium Priority

- [ ] New personas or agents
- [ ] UI/UX improvements
- [ ] Database optimizations
- [ ] API enhancements

### Low Priority

- [ ] Code style improvements
- [ ] Dependency updates
- [ ] Minor documentation fixes

## Development Tips

### Debugging

```bash
# Enable debug logging
DEBUG=guru-lens:* pnpm run dev

# Use VS Code debugger
# Add breakpoints and press F5

# Use browser DevTools
# Open http://localhost:3000 and press F12
```

### Performance Profiling

```bash
# Profile CPU usage
node --prof server/_core/index.ts

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

### Database Debugging

```bash
# Open Drizzle Studio
pnpm db:studio

# View and modify data directly
# Access at http://localhost:5555
```

## Helpful Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Community

- GitHub Issues - Report bugs and request features
- GitHub Discussions - Ask questions and discuss ideas
- Pull Requests - Contribute code

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to:
1. Check existing issues and discussions
2. Create a new issue with your question
3. Reach out to maintainers

---

**Thank you for contributing to Guru Lens! 🚀**
