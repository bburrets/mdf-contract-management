# MDF Contract Management System - AI Frontend Generation Prompt

## High-Level Goal
Create a responsive, production-ready contract intake interface for an enterprise financial operations system that processes MDF (Marketing Development Fund) contracts with AI-powered document processing, Style matching, and channel allocation capabilities.

## Project Context & Tech Stack
- **Framework**: Next.js 15 with App Router and TypeScript
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Vercel with global edge optimization
- **PDF Processing**: Client-side PDF viewing with OCR integration
- **State Management**: React hooks with optimistic updates
- **API Layer**: tRPC for type-safe internal APIs, REST for external integrations

## Visual Design System
- **Color Palette**: 
  - Primary: #1E40AF (navigation, focus indicators)
  - Success: #10B981 (high confidence ≥90%, validations, active states)
  - Warning: #F59E0B (medium confidence 70-89%, pending states)
  - Error: #EF4444 (low confidence <70%, errors, overdrawn balances)
  - Neutral: #6B7280, #F3F4F6, #E5E7EB (text, borders, backgrounds)
- **Typography**: Inter (primary), Source Sans Pro (fallback), JetBrains Mono (data)
- **Spacing**: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64px)
- **Professional Style**: Clean enterprise interface emphasizing accuracy and confidence

## Detailed Step-by-Step Instructions

### 1. Create Contract Intake Layout Structure
1. Build a responsive layout with CSS Grid (desktop 1024px+)
2. Left panel (40%): PDF viewer container with collapsible functionality
3. Right panel (60%): Dynamic form sections container
4. Top banner: Contract type detection results with confidence scoring
5. Implement mobile-first responsive behavior (mobile: vertical stack, tablet: tabbed interface)

### 2. Implement PDF Upload & Display Component
1. Create drag-drop zone using react-dropzone for PDF file uploads
2. Integrate PDF.js for client-side PDF rendering and text extraction
3. Add text highlighting functionality to show OCR-detected fields
4. Include zoom controls, page navigation, and text search capabilities
5. Add collapsible functionality to maximize form space when needed

### 3. Build Dynamic Form Sections System
1. Create contract type toggle component (Inline/E-Com/Both Channels)
2. Implement dynamic section rendering based on detection results
3. Add smooth height animations (200ms ease-out) for section expand/collapse
4. Pre-populate form fields with OCR-extracted data
5. Handle empty sections when user adds non-detected contract types

### 4. Implement Style Matching Widget
1. Create confidence-based Style selection dropdown with search autocomplete
2. Display pre-selected Style with confidence percentage badge (color-coded)
3. Show ranked alternative Styles with reasoning when expanded
4. Add OCS (contract linkage) status indicators with warning icons
5. Include manual Style search fallback for low-confidence matches

### 5. Add Real-time Validation & Auto-save
1. Implement field-level validation with inline error messaging
2. Add auto-save functionality (throttled to prevent excessive API calls)
3. Create loading states with skeleton screens and shimmer effects
4. Add success confirmation animations (150ms fade-in)
5. Display draft status indicators with last-saved timestamps

### 6. Build Balance & Status Integration
1. Create quick balance lookup modal accessible during channel allocation
2. Implement near real-time balance updates (30-second refresh intervals)
3. Add subtle pulse animations (150ms) for balance change indicators
4. Display funding availability context during form completion
5. Show allocation warnings for insufficient balances

## Code Examples, Data Structures & API Contracts

### TypeScript Interfaces
```typescript
interface Style {
  style_number: string;
  item_number: string;
  item_desc: string;
  season: string;
  business_line: string;
  gender: string;
  country: string;
}

interface MDFContract {
  mdf_id: bigint;
  style_number: string;
  scope: 'Channel' | 'AllStyle';
  customer?: string;
  contract_number?: string;
  total_committed_amount?: number;
  effective_start?: Date;
  effective_end?: Date;
}

interface ContractFormData {
  contractType: 'Inline' | 'Ecomm' | 'Both';
  styleNumber: string;
  confidenceScore: number;
  inlineAmount?: number;
  ecommAmount?: number;
  campaignDates: { start: Date; end: Date };
  extractedFields: Record<string, any>;
}
```

### API Endpoints
```typescript
// OCR Processing
POST /api/contracts/process-pdf
Request: FormData with PDF file
Response: { extractedData: object, contractType: string, confidence: number }

// Style Matching
GET /api/styles/match?itemNumber=${string}&description=${string}
Response: { matches: Array<{style: Style, confidence: number, reasoning: string}> }

// Balance Lookup
GET /api/balances/style/${styleNumber}/channel/${channel}
Response: { availableBalance: number, committedAmount: number, lastUpdated: string }
```

### Component Structure Requirements
- Use React Server Components for initial data loading
- Implement optimistic updates for form interactions
- Add Suspense boundaries with loading states
- Use Tailwind CSS classes exclusively (no custom CSS)
- Include ARIA labels and accessibility attributes (WCAG 2.1 AA compliance)

## Strict Scope Definition

### Files to Create:
1. `components/contract-intake/ContractIntakeLayout.tsx` - Main layout component
2. `components/contract-intake/PDFViewer.tsx` - PDF display and interaction
3. `components/contract-intake/DynamicFormSections.tsx` - Form section management
4. `components/contract-intake/StyleMatchingWidget.tsx` - Style selection with confidence
5. `components/contract-intake/ContractTypeToggle.tsx` - Channel type selection
6. `components/contract-intake/BalanceLookupModal.tsx` - Quick balance checking
7. `components/ui/ConfidenceScoreWidget.tsx` - Reusable confidence display
8. `types/contract-intake.ts` - TypeScript interfaces and types

### Files NOT to Modify:
- Do NOT alter existing navigation components or layout files
- Do NOT modify authentication or user management components  
- Do NOT change database schema or API route implementations
- Do NOT update global CSS or Tailwind configuration
- Do NOT modify any components outside the contract-intake directory

### Accessibility Requirements:
- Minimum 4.5:1 color contrast ratios for all text
- 44px minimum touch targets for interactive elements
- Keyboard navigation support (Tab, Enter, Space, Arrow keys)
- Screen reader compatibility with semantic HTML and ARIA labels
- Support for prefers-reduced-motion CSS media query

### Performance Constraints:
- All animations must maintain 60fps performance
- Form interactions must respond within 200ms
- PDF processing should show progress indicators for operations >500ms
- Implement lazy loading for non-critical components
- Use React.memo for expensive rendering operations

## Important Implementation Notes:

1. **Financial Data Accuracy**: This system processes financial contracts - prioritize data validation and user confirmation over automation
2. **Desktop-First Design**: 95% of usage occurs on desktop workstations - optimize for this experience first
3. **Confidence-Based UX**: Always show AI confidence scores and allow user override - never hide AI decision-making
4. **Progressive Enhancement**: Start with manual entry capabilities, then layer on OCR and AI assistance
5. **Audit Trail Integration**: Every user action should be trackable for compliance requirements

## Usage Instructions

This prompt is optimized for AI-powered frontend development tools such as:
- Vercel v0 (https://v0.dev)
- Lovable.ai (https://lovable.dev)  
- Similar AI code generation platforms

### How to Use:
1. Copy the entire prompt above
2. Paste into your preferred AI development tool
3. Specify which component you want to start with (recommend beginning with ContractIntakeLayout.tsx)
4. Iterate on the results, providing feedback and refinements
5. Review all generated code carefully before implementation

### Best Practices:
- Generate one component at a time for better results
- Provide specific feedback on styling, behavior, and functionality
- Test accessibility and responsive behavior thoroughly
- Validate all form handling and data processing logic
- Ensure TypeScript interfaces match your actual data models

---

**Important Reminder**: All AI-generated code requires careful human review, testing, and refinement before being considered production-ready. Pay special attention to form validation logic, accessibility compliance, and financial data handling accuracy in this enterprise financial system.