\

# Backend API Documentation

Base URL

http://localhost:8000/api

Notes

- Authentication is a demo implementation backed by SQLite (Drizzle ORM).
- Login/register return a JWT token. The current API does not enforce JWT on all endpoints (demo scope).
- Seed users (including demo credentials) are controlled via SEED_USERS_JSON in backend/.env.

Authentication

POST /auth/login

Request body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:

```json
{
  "message": "Login successful",
  "user": {
    "id": "user_admin",
    "username": "admin",
    "name": "Admin User",
    "role": "admin"
  },
  "token": "<jwt>"
}
```

POST /auth/register

Request body:

```json
{
  "username": "newuser",
  "password": "password123",
  "name": "New User",
  "role": "demo"
}
```

Response:

```json
{
  "message": "Registration successful",
  "user": {
    "id": "user_newuser_1730000000000",
    "username": "newuser",
    "name": "New User",
    "role": "demo"
  },
  "token": "<jwt>"
}
```

Health

GET /health

Response:

```json
{
  "status": "ok",
  "message": "Backend server is running",
  "timestamp": "2026-01-10T00:00:00.000Z"
}
```

Documents

POST /documents/upload

Request:

- Content-Type: multipart/form-data
- Field: file (PDF)

Response:

```json
{
  "message": "Document processed successfully",
  "document": {
    "id": "uuid-here",
    "filename": "safety-manual.pdf",
    "size": 245678,
    "summary": "...",
    "keyPoints": ["..."],
    "chunks": 45
  }
}
```

GET /documents

Response:

```json
{
  "documents": [
    {
      "id": "uuid-1",
      "filename": "safety-procedures.pdf",
      "uploadDate": "2026-01-10T10:30:00.000Z",
      "size": 245678,
      "summary": "...",
      "keyPoints": ["..."]
    }
  ]
}
```

GET /documents/:id

Response:

```json
{
  "document": {
    "id": "uuid-here",
    "filename": "safety-manual.pdf",
    "uploadDate": "2026-01-10T10:30:00.000Z",
    "size": 245678,
    "summary": "...",
    "keyPoints": ["..."],
    "fullText": "..."
  }
}
```

## Q&A System

### POST /qa/ask

Ask questions about uploaded documents

**Request Body:**

```json
{
  "question": "What PPE is required for working at heights?",
  "docId": "optional-document-id-to-search-specific-doc"
}
```

**Response:**

```json
{
  "answer": "According to the safety procedures, the required PPE for working at heights includes:\n\n- Full body harness\n- Safety helmet with chin strap\n- Steel-toed boots with slip-resistant soles\n- High-visibility vest\n- Safety goggles\n\nAll PPE must be inspected before each use and meet relevant safety standards.",
  "sources": 5
}
```

**Features:**

- Semantic search across documents using vector embeddings
- Context-aware answers from Claude AI
- Can filter by specific document
- Cites number of relevant sources found

---

## Document Comparison

### POST /compare

Compare two documents for gap analysis

**Request Body:**

```json
{
  "docIdA": "uuid-of-site-procedures",
  "docIdB": "uuid-of-legislation-document"
}
```

**Response:**

```json
{
  "comparison": {
    "documentA": {
      "id": "uuid-1",
      "filename": "site-procedures.pdf"
    },
    "documentB": {
      "id": "uuid-2",
      "filename": "legislation-requirements.pdf"
    },
    "analysis": "# Gap Analysis Report\n\n## 1. Missing Requirements\n\n- Emergency response plan not detailed enough\n- Lack of specific chemical handling procedures\n- No mention of regular safety audits\n\n## 2. Compliance Gaps\n\n- Training frequency (Site: annually, Required: quarterly)\n- Incident reporting timeline (Site: 48hrs, Required: 24hrs)\n\n## 3. Key Differences\n\n- Site procedures focus on operational safety\n- Legislation emphasizes regulatory compliance and documentation\n\n## 4. Recommendations\n\n- Implement quarterly safety training program\n- Update incident reporting procedures to meet 24-hour requirement\n- Develop comprehensive chemical handling protocols\n- Establish regular audit schedule"
  }
}
```

**Features:**

- Comprehensive gap analysis using Claude AI
- Identifies missing requirements
- Highlights compliance gaps
- Provides actionable recommendations
- Structured markdown output

---

## Error Responses

All endpoints may return error responses:

**400 Bad Request:**

```json
{
  "error": "Question is required"
}
```

**404 Not Found:**

```json
{
  "error": "Document not found"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Failed to process document"
}
```

---

## Technical Implementation

### AI Integration

- **LLM**: Anthropic Claude 3.5 Sonnet
- **Model Parameters**:
  - Temperature: 0.2 (consistent, focused responses)
  - Max Tokens: 800
  - Context window: Up to 8000 characters per analysis

### Vector Database

- **Service**: Pinecone
- **Vector Dimensions**: 1024
- **Similarity Metric**: Cosine
- **Top-K**: 5 most relevant chunks

### Storage

- **Type**: In-memory (Map-based)
- **Persistence**: Session-based (cleared on restart)
- **Production**: Migrate to PostgreSQL/MongoDB recommended

### Document Processing

- **Parser**: pdf-parse library
- **Chunking**: 500 characters with 50 character overlap
- **Text Limit**: First 8000 characters for summarization
- **Supported Format**: PDF only (digital text, not scanned images)

---

## Rate Limiting & Performance

- No rate limiting currently implemented
- Claude API has per-minute rate limits (check Anthropic dashboard)
- Pinecone free tier: 100K operations/month
- Embedding generation time: ~100ms per chunk
- Claude response time: 1-3 seconds per request

---

## Security Considerations

⚠️ **Current Implementation (Development Only)**

- Mock authentication (hardcoded credentials)
- No JWT validation
- No input sanitization
- CORS enabled for all origins

✅ **Production Recommendations**

- Implement real authentication (JWT, OAuth)
- Add input validation and sanitization
- Enable CORS only for specific origins
- Add rate limiting
- Implement API key rotation
- Add request logging and monitoring

---

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Upload document
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@safety-manual.pdf"

# Ask question
curl -X POST http://localhost:8000/api/qa/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the emergency procedure?"}'

# Compare documents
curl -X POST http://localhost:8000/api/compare \
  -H "Content-Type: application/json" \
  -d '{"docIdA":"uuid-1","docIdB":"uuid-2"}'
```

### Using Postman

Import the following collection structure:

1. Create collection "Compliance Analyzer"
2. Add requests for each endpoint
3. Set base URL variable: `{{baseUrl}}` = `http://localhost:8000/api`

---

## Monitoring & Logs

Console logs provide information about:

- Server startup
- Document processing status
- API errors with stack traces
- Claude API responses

Example log output:

```
🚀 Server running on port 8000
✅ Document processed: safety-manual.pdf (45 chunks)
❌ Error answering question: Failed to connect to Pinecone
```

---

## Future API Enhancements

- [ ] PATCH /documents/:id - Update document metadata
- [ ] DELETE /documents/:id - Delete document
- [ ] GET /documents/search?q=query - Search documents
- [ ] POST /documents/batch - Bulk upload
- [ ] GET /analytics - Usage analytics
- [ ] POST /qa/feedback - User feedback on answers
- [ ] WebSocket support for real-time Q&A
