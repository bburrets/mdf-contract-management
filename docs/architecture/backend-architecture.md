# Backend Architecture

Simple Next.js API routes with direct database calls, avoiding complex abstractions or service layers.

## API Route Structure
```
src/app/api/
├── contracts/
│   ├── route.ts          # GET /api/contracts, POST /api/contracts
│   └── [id]/
│       └── route.ts      # GET /api/contracts/[id], PUT, DELETE
├── documents/
│   ├── upload/
│   │   └── route.ts      # POST /api/documents/upload
│   └── extract/
│       └── route.ts      # POST /api/documents/extract
├── styles/
│   ├── route.ts          # GET /api/styles
│   └── match/
│       └── route.ts      # POST /api/styles/match
└── ledger/
    └── route.ts          # GET /api/ledger, POST /api/ledger
```

## Simple Service Functions

```typescript
// lib/services/contract-service.ts
export async function createMDFContract(data: ContractData) {
  const client = await getDbClient();
  
  try {
    await client.query('BEGIN');
    
    // Insert contract
    const contractResult = await client.query(
      'INSERT INTO mdf_contracts (...) VALUES (...) RETURNING *',
      [data.style_number, data.scope, data.customer, data.amount, data.date]
    );
    
    // Create allocations based on scope
    if (data.scope === 'AllStyle') {
      await createBothChannelAllocations(contractResult.rows[0].mdf_id, data.amount);
    } else {
      await createSingleChannelAllocation(contractResult.rows[0].mdf_id, data);
    }
    
    await client.query('COMMIT');
    return contractResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Simple OCR integration
export async function extractDocumentData(buffer: Buffer) {
  try {
    const response = await fetch(`${azureEndpoint}/formrecognizer/documentModels/prebuilt-document:analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'Ocp-Apim-Subscription-Key': azureApiKey,
      },
      body: buffer,
    });
    
    if (!response.ok) {
      throw new Error('OCR processing failed');
    }
    
    const result = await response.json();
    return parseOCRResults(result);
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return { success: false, error: 'OCR processing failed' };
  }
}
```
