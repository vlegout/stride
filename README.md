# Sport

Web app to visualize run & ride activities from FIT files with charts, maps, and performance metrics.

## Tech Stack

- React + TypeScript frontend
- Rust + Python API backend

## Environment Variables

### Backend
```bash
JWT_SECRET_KEY=your-super-secret-jwt-key-here-make-it-long-and-random
DATABASE_URL=postgresql://username:password@localhost:5432/sport_db
BUCKET=your-s3-bucket-name
```

### Frontend
```bash
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```
