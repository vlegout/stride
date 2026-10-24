# Development Guide for Stride

## Project Overview

Stride is a web app to visualize run & ride activities from FIT files with charts, maps, and performance metrics.

**Tech Stack**:
- Frontend: React + TypeScript (Vite), MUI, Chart.js, Konva, framer-motion, arktype, axios
- Backend: Python 3.14 (FastAPI) + Rust extension (PyO3, built with maturin)
- Database: PostgreSQL (Alembic migrations)
- Storage: Scaleway Object Storage

## Project Structure

```
/
├── api/              # Backend (Python + Rust)
│   ├── python/       # Python API code (api/, alembic/)
│   ├── src/          # Rust code (compiled into the api.abi3.so extension)
│   └── tests/        # Python tests
├── src/              # Frontend React code (components/, components/ui/, pages/, hooks/)
├── tests/            # Frontend tests (components/, hooks/, pages/, mocks/)
├── e2e/              # Playwright E2E tests
├── docs/             # Docusaurus documentation site
├── data/             # Local data (FIT files)
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

**Rust extension**: Python tests need the compiled extension. Rebuild it after any change in `api/src/`:

```bash
uv --project api run maturin develop --manifest-path api/Cargo.toml
```

**Code Quality** (all must pass, same as CI):
```bash
uv --project api run ruff check
uv --project api run ruff format
uv --project api run ty check
uv --project api run mypy ./api
```

**Rust Quality** (when touching `api/src/`):
```bash
cargo fmt --check --manifest-path api/Cargo.toml
cargo clippy --manifest-path api/Cargo.toml -- -D warnings
```

**Testing**:
```bash
uv --project api run pytest
```

### Frontend Development

**Code Quality** (same as CI):
```bash
npm run format
npm run lint
npm run typecheck
npm run build
```

**Testing**:
```bash
npm run test          # Vitest (watch)
npm run test:ci       # CI mode: unit + storybook projects, with coverage
npm run test:ui       # UI mode
```

**Storybook** (components have `*.stories.tsx`, which are also run as tests):
```bash
npm run storybook
npm run build-storybook
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
VITE_MAPBOX_TOKEN=your-mapbox-token
```

## Code Quality Standards

### Python
- Use `ruff` for linting and formatting, `ty` and `mypy` for type checking
- Minimal code comments
- All checks must pass before committing

### Rust
- `cargo fmt` and `cargo clippy -D warnings` must pass

### TypeScript
- Biome for linting and formatting
- TypeScript strict mode

## Key Technologies

### Backend
- **FastAPI**: Web framework
- **SQLModel**: Database ORM
- **Alembic**: Database migrations
- **FIT file parsing**: Extract activity data from FIT files (Rust extension)

### Frontend
- **React Query**: Data fetching and caching
- **Zustand**: State management
- **MUI**: Component library (shared building blocks in `src/components/ui/`)
- **Chart.js**: Data visualization (Konva for the lap chart)
- **Leaflet / OpenLayers / Mapbox**: Maps
- **Vitest + Storybook**: Testing

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

1. Python: `ruff check`, `ruff format`, `ty check`, `mypy ./api`
2. Rust (if changed): `cargo fmt --check`, `cargo clippy -- -D warnings`
3. Frontend: `npm run format`, `npm run lint`, `npm run typecheck`
4. Run tests if relevant
5. Commit changes

## Best Practices

1. **Prefer editing existing files over creating new ones**
2. **Never create documentation unless explicitly requested**
3. **Keep code comments minimal**
4. **Always run code quality checks before committing**
5. **Use `uv` for all Python operations**
6. **Stay in project root directory for all commands**
