# External APIs

## Azure AI Document Intelligence API
- **Purpose:** Primary OCR service for extracting structured data from MDF contract PDFs
- **Documentation:** https://docs.microsoft.com/en-us/azure/applied-ai-services/form-recognizer/
- **Base URL(s):** https://{region}.api.cognitive.microsoft.com/formrecognizer/v3.0
- **Authentication:** API Key in request headers
- **Rate Limits:** 15 requests/second for S0 tier

**Key Endpoints Used:**
- `POST /documentModels/{modelId}:analyze` - Analyze document with prebuilt model
- `GET /documentModels/{modelId}/analyzeResults/{resultId}` - Get analysis results

**Integration Notes:** Single OCR provider for simplicity. Manual fallback for low-confidence extractions. Cost controls through monthly API limits.
