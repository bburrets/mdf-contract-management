# Deployment Architecture

Simple deployment using standard hosting with managed database.

## Deployment Strategy

**Frontend/Backend Deployment:**
- **Platform:** Standard cloud hosting (Vercel/Netlify/AWS)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment:** Production environment variables

**Database Deployment:**
- **Platform:** Managed PostgreSQL (AWS RDS/GCP SQL/Azure Database)
- **Migration Strategy:** Run migrations during deployment
- **Backup Strategy:** Automated daily backups

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Run database migrations
          npm run db:migrate
          # Deploy application
          npm run deploy
```
