# Stride

Web app to visualize run & ride activities from FIT files with charts, maps, and performance metrics.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![codecov](https://codecov.io/gh/vlegout/stride/graph/badge.svg?token=KJ5PHYJVFQ)](https://codecov.io/gh/vlegout/stride)

## Tech Stack

- React + TypeScript frontend
- Rust + Python API backend

## Environment Variables

### Backend

```bash
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
BUCKET=your-s3-bucket-name
DATABASE_URL=postgresql://username:password@localhost:5432/sport_db
JWT_SECRET_KEY=your-super-secret-jwt-key-here-make-it-long-and-random
```

### Frontend

```bash
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```
