# Development Workflow

Simple development setup without complex tooling or multiple services.

## Local Development Setup

### Prerequisites
```bash
# Install Node.js 18+
node --version

# Install PostgreSQL locally or use Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres

# Install dependencies
npm install
```

### Initial Setup
```bash
# Copy environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

### Development Commands
```bash
# Start all services
npm run dev

# Run tests
npm run test

# Run database migrations
npm run db:migrate

# Build for production
npm run build
```

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mdf_system

# Authentication
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Azure AI
AZURE_AI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_AI_KEY=your-api-key-here

# File Storage
UPLOAD_DIR=./uploads
```
