# Project Structure

Simple monorepo structure without complex tooling or multiple packages.

```
mdf-contract-management/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── contracts/    # Contract pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── api/         # API routes
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── ui/          # Basic UI components
│   │   ├── forms/       # Form components
│   │   └── layout/      # Layout components
│   ├── lib/             # Utilities and services
│   │   ├── db.ts        # Database connection
│   │   ├── auth.ts      # Authentication
│   │   ├── ocr.ts       # OCR integration
│   │   └── utils.ts     # Shared utilities
│   └── types/           # TypeScript definitions
│       ├── database.ts  # Database types
│       ├── api.ts       # API types
│       └── global.d.ts  # Global types
├── public/              # Static assets
├── migrations/          # Database migrations
├── tests/              # Test files
├── .env.example         # Environment template
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind configuration
├── package.json         # Dependencies
└── README.md           # Project documentation
```
