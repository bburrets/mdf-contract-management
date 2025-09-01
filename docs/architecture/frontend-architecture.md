# Frontend Architecture

Simple React components with standard patterns, avoiding complex state management or real-time features.

## Component Organization
```
src/
├── app/                    # Next.js App Router
│   ├── contracts/         # Contract management pages
│   ├── dashboard/         # Style dashboard
│   ├── api/              # API route handlers
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utilities and database
│   ├── db.ts            # Database connection
│   ├── auth.ts          # Authentication
│   └── utils.ts         # Shared utilities
└── types/                # TypeScript definitions
```

## State Management
- **Server State:** React Query for API data caching
- **Client State:** React useState for simple UI state
- **Form State:** React Hook Form for form handling
- **No Real-time:** Manual refresh buttons instead of subscriptions

## Key Components

```typescript
// Contract upload component
export function ContractUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  
  const handleUpload = async (file: File) => {
    setExtracting(true);
    // Call OCR API and handle results
    const result = await extractDocument(file);
    // Show results for user validation
    setExtracting(false);
  };
  
  return (
    <div className="upload-zone">
      <input type="file" accept=".pdf" onChange={handleFileSelect} />
      {extracting && <div>Processing document...</div>}
    </div>
  );
}

// Simple balance display component
export function AllocationBalance({ allocationId }: { allocationId: number }) {
  const { data: balance, isLoading, refetch } = useQuery({
    queryKey: ['balance', allocationId],
    queryFn: () => fetchBalance(allocationId),
  });
  
  return (
    <div className="balance-card">
      <div>Allocated: ${balance?.allocated_amount}</div>
      <div>Remaining: ${balance?.remaining_balance}</div>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```
