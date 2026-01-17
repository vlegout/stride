# Development Guide for Stride

## Project Overview

Stride is a web app to visualize run & ride activities from FIT files with charts, maps, and performance metrics.

**Tech Stack**:
- Frontend: React + TypeScript
- Backend: Python + Rust API
- Database: PostgreSQL
- Storage: Scaleway Object Storage

## Project Structure

```
/
├── api/              # Backend (Python + Rust)
│   ├── python/       # Python API code
│   ├── src/          # Rust code
│   └── tests/        # Python tests
├── src/              # Frontend React code
├── tests/            # Frontend tests
├── e2e/              # Playwright E2E tests
└── public/           # Static assets
```

## Development Workflow

### Working Directory
**IMPORTANT**: Never change working directory. Run commands from project root:

```bash
# Python/API commands
uv --project api run <command>

# Frontend commands
npm run <command>
```

### Python Development

**Environment**: Managed by `uv` in `api/` directory

```bash
# Install dependencies
uv --project api sync

# Run code
uv --project api run python <script>
```

**Code Quality** (run before committing):
```bash
uv --project api run ruff check
uv --project api run ruff format
```

**Testing**:
```bash
uv --project api run pytest
```

### Frontend Development

**Code Quality**:
```bash
npm run lint
npm run typecheck
npm run format
```

**Testing**:
```bash
npm run test          # Vitest
npm run test:ci       # CI mode with coverage
npm run test:ui       # UI mode
```

**Development server**:
```bash
npm run dev
```

**Build**:
```bash
npm run build
```

### E2E Testing
```bash
npx playwright test
```

## Environment Variables

### Backend (`.env`)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/sport_db
SCW_ACCESS_KEY=your-scaleway-access-key
SCW_SECRET_KEY=your-scaleway-secret-key
BUCKET=your-scaleway-bucket-name
OBJECT_STORAGE_ENDPOINT=https://s3.fr-par.scw.cloud
OBJECT_STORAGE_REGION=fr-par
JWT_SECRET_KEY=your-jwt-secret-key
```

### Frontend (`.env`)
```bash
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

## Code Quality Standards

### Python
- Use `ruff` for linting and formatting
- Minimal code comments
- All checks must pass before committing

### TypeScript
- ESLint for linting
- Prettier for formatting
- TypeScript strict mode

## Key Technologies

### Backend
- **FastAPI**: Web framework
- **SQLModel**: Database ORM
- **FIT file parsing**: Extract activity data from FIT files

### Frontend
- **React Query**: Data fetching and caching
- **Zustand**: State management
- **MUI**: Component library
- **Chart.js**: Data visualization
- **Leaflet/Mapbox**: Maps
- **Vitest**: Testing

## Common Tasks

### Add Python dependency
```bash
uv --project api add <package>
```

### Remove Python dependency
```bash
uv --project api remove <package>
```

### Add npm dependency
```bash
npm install <package>
```

## Pre-commit Workflow

1. Run linting: `uv --project api run ruff check`
2. Run formatting: `uv --project api run ruff format`
3. Run tests if relevant
4. Commit changes

## Best Practices

1. **Prefer editing existing files over creating new ones**
2. **Never create documentation unless explicitly requested**
3. **Keep code comments minimal**
4. **Always run code quality checks before committing**
5. **Use `uv` for all Python operations**
6. **Stay in project root directory for all commands**
