# Source Tree Structure

## Current Project State (Pre-Development)

The MDF Contract Management System is currently in the planning and documentation phase. No application source code has been created yet.

```
dilutions/ (MDF Contract Management System)
├── .bmad-core/                 # BMAD agent system framework
│   ├── agents/                 # Agent definitions (dev, architect, pm, etc.)
│   ├── agent-teams/            # Team workflows
│   ├── checklists/             # Quality gates and verification checklists
│   ├── data/                   # Reference data and preferences
│   ├── tasks/                  # Executable workflow tasks
│   ├── templates/              # Document templates
│   ├── utils/                  # Utility functions
│   ├── workflows/              # Complex multi-agent workflows
│   └── core-config.yaml        # Project configuration
├── .claude/                    # Claude CLI configuration
│   ├── commands/BMad/          # BMAD command definitions
│   └── settings.local.json     # Local Claude settings
├── .cursor/                    # Cursor IDE configuration
│   └── rules/bmad/            # BMAD-specific IDE rules
├── docs/                       # Project documentation (current)
│   ├── architecture/           # System architecture documentation
│   │   ├── api-specification.md
│   │   ├── backend-architecture.md
│   │   ├── components.md
│   │   ├── core-workflows.md
│   │   ├── data-models.md
│   │   ├── database-schema.md
│   │   ├── deployment-architecture.md
│   │   ├── development-workflow.md
│   │   ├── external-apis.md
│   │   ├── frontend-architecture.md
│   │   ├── high-level-architecture.md
│   │   ├── index.md
│   │   ├── introduction.md
│   │   ├── mvp-success-metrics.md
│   │   ├── project-structure.md
│   │   ├── security-and-performance.md
│   │   ├── tech-stack.md
│   │   ├── testing-strategy.md
│   │   └── source-tree.md (this file)
│   ├── prd/                   # Product Requirements Documentation
│   ├── stories/               # Development stories and tasks
│   └── prd.md                 # Main PRD document
├── docs_backup/               # Backup of previous documentation versions
├── Requirements/              # Original requirements gathering
│   ├── Backend requirements.md
│   ├── ConsolidatedMDFRequirements.md
│   ├── Data Model Specification.md
│   ├── MDF Requirements Clarifications QA.md
│   ├── User journey Requirements.md
│   ├── architectureRecommendations.md
│   └── sampleDdl.md
└── web-bundles/              # Development resources and templates
    ├── agents/               # Additional agent definitions
    ├── expansion-packs/      # Specialized development packs
    └── teams/               # Team configurations
```

## Planned Application Structure (To Be Built)

Based on the architectural documentation, the following application structure will be created:

```
dilutions/ (MDF Contract Management System)
├── src/                      # Application source code (PLANNED)
│   ├── app/                  # Next.js App Router
│   │   ├── contracts/        # Contract management pages
│   │   │   ├── page.tsx      # Contract list/dashboard
│   │   │   ├── [id]/         # Individual contract pages
│   │   │   └── upload/       # Contract upload workflow
│   │   ├── dashboard/        # Main dashboard pages
│   │   │   ├── page.tsx      # Main dashboard
│   │   │   ├── funding/      # Funding balance views
│   │   │   └── reports/      # Reporting interface
│   │   ├── styles/           # Style management pages
│   │   │   ├── page.tsx      # Style catalog
│   │   │   ├── mapping/      # Style mapping interface
│   │   │   └── validation/   # Style validation workflow
│   │   ├── api/              # API routes
│   │   │   ├── contracts/    # Contract CRUD operations
│   │   │   ├── ocr/         # OCR processing endpoints
│   │   │   ├── styles/      # Style management endpoints
│   │   │   ├── funding/     # Funding balance endpoints
│   │   │   └── auth/        # Authentication endpoints
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/           # React components
│   │   ├── ui/              # Basic UI components (buttons, forms, etc.)
│   │   ├── contract/        # Contract-specific components
│   │   │   ├── ContractUploader.tsx
│   │   │   ├── ContractViewer.tsx
│   │   │   └── ContractProcessor.tsx
│   │   ├── style/           # Style management components
│   │   │   ├── StyleMatcher.tsx
│   │   │   ├── StyleValidator.tsx
│   │   │   └── StyleCatalog.tsx
│   │   ├── funding/         # Funding components
│   │   │   ├── FundingBalance.tsx
│   │   │   └── AllocationTracker.tsx
│   │   └── layout/          # Layout components
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── lib/                 # Utilities and services
│   │   ├── db.ts           # Database connection (PostgreSQL)
│   │   ├── auth.ts         # Authentication (NextAuth.js)
│   │   ├── ocr.ts          # OCR integration (Azure AI Document Intelligence)
│   │   ├── style-matching.ts # AI-powered style matching logic
│   │   ├── funding.ts      # Funding calculation utilities
│   │   └── utils.ts        # Shared utilities
│   └── types/              # TypeScript definitions
│       ├── database.ts     # Database schema types
│       ├── api.ts          # API request/response types
│       ├── contract.ts     # Contract-related types
│       ├── style.ts        # Style-related types
│       ├── funding.ts      # Funding-related types
│       └── global.d.ts     # Global type definitions
├── public/                 # Static assets (PLANNED)
│   ├── images/            # Application images
│   ├── icons/             # Icon assets
│   └── documents/         # Sample documents
├── migrations/            # Database migrations (PLANNED)
│   └── [timestamp]_initial_schema.sql
├── tests/                 # Test files (PLANNED)
│   ├── unit/             # Unit tests (Vitest)
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests (Playwright)
├── .env.example          # Environment template (PLANNED)
├── .env.local            # Local environment variables (PLANNED)
├── next.config.js        # Next.js configuration (PLANNED)
├── tailwind.config.js    # Tailwind CSS configuration (PLANNED)
├── tsconfig.json         # TypeScript configuration (PLANNED)
├── package.json          # Dependencies and scripts (PLANNED)
├── vitest.config.ts      # Test configuration (PLANNED)
├── playwright.config.ts  # E2E test configuration (PLANNED)
└── README.md            # Application documentation (PLANNED)
```

## Key Architecture Notes

### Current Phase: Pre-Development
- **Documentation Complete**: Comprehensive PRD and architecture docs
- **Planning Phase**: Ready for development story creation
- **Technology Stack Defined**: Next.js 14, PostgreSQL, Azure OCR, Tailwind CSS
- **Development Workflow**: BMAD agents managing systematic development

### Next Steps for Source Tree Creation
1. Initialize Next.js 14 application with TypeScript
2. Set up PostgreSQL database and migrations
3. Configure authentication with NextAuth.js
4. Implement core directory structure
5. Set up testing framework (Vitest + Playwright)
6. Configure CI/CD pipeline

### Development Methodology
- **Agent-Driven Development**: Using BMAD framework for systematic implementation
- **Story-Driven**: Each feature implemented via structured development stories
- **Quality Gates**: Comprehensive checklists and validation at each stage
- **Incremental Delivery**: MVP-first approach with planned feature expansion

This source tree will evolve as development progresses, with the planned structure serving as the architectural target for the development team.