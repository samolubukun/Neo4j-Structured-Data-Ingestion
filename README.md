# Neo4j Structured Ingestion

Simple Node.js + Express service to upload structured files (CSV, JSON, XLSX) and load them into Neo4j using LLM-generated Cypher.

## Requirements
- Node.js 18+ (or compatible)
- A Neo4j instance (Aura or self-hosted)
- An LLM API (OpenAI-compatible endpoint)

## Quick start
1. Install dependencies:

```powershell
npm install
```

2. Create a `.env` file with at minimum:

```
NEO4J_URI=neo4j+s://<host>.databases.neo4j.io
NEO4J_USER=neo4j           # or NEO4J_USERNAME
NEO4J_PASSWORD=<password>
LLM_API_KEY=<your-llm-key>
LLM_API_URL=https://api.openai.com/v1/chat/completions
```

3. Start the server:

```powershell
npm start
```

The server will run on port 3000 by default.

## API (short)
- POST /v1/ingest/upload — upload a file (multipart/form-data)
- GET  /v1/ingest/file/:fileId — get file metadata
- POST /v1/ingest/process/:fileId — start processing; returns jobId
- GET  /v1/ingest/status/:jobId — job progress and totalProcessed

Explore the API via Swagger UI:

- Swagger UI: http://localhost:3000/api-docs
- Raw spec:   http://localhost:3000/api-docs.json

## Tests & verification
- Test Neo4j connection:

```powershell
node .\test\testNeo4j.js
```

- Quick write test (creates a small TestWrite node):

```powershell
node .\test\testWriteNeo4j.js
```

## Notes
- Uploaded files and metadata are stored locally in `uploads/` and `metadata/`.
- The LLM is asked to return a parameterized Cypher template and a transform function. The transform logic is executed in-process — review and secure this in production.
- Do not commit secrets (`.env`) to source control. `.gitignore` excludes `.env`, `uploads/`, and `metadata/`.
  
## Screenshots
<img width="2560" height="1208" alt="Screenshot (601)" src="https://github.com/user-attachments/assets/9adaff7c-aea5-4185-9be8-eb6347dfa1d7" />
<img width="2536" height="1166" alt="Screenshot (598)" src="https://github.com/user-attachments/assets/2465c5f4-aa56-4657-89f0-c9c7ba1d2f2f" />
<img width="2518" height="1170" alt="Screenshot (600)" src="https://github.com/user-attachments/assets/d97b7cf6-51ce-44f1-b2b3-ad0e4b87c921" />

## Next steps (optional)
- Replace eval-based transform parsing with a safe mapping format.
- Add a health-check endpoint for Neo4j.
- Add unit tests for LLM response handling.

  
```text
│   Handler   │     │  (Local FS)  │     │   Pipeline  │
└─────────────┘     └──────────────┘     └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │     LLM     │
                                          │  (Cypher)   │
                                          └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │   Neo4j     │
                                          │  Database   │
                                          └─────────────┘


## Features

✅ Local file storage (no S3 required)  
✅ Support for CSV, JSON, XLS/XLSX  
✅ LLM-generated Cypher queries  
✅ Batch processing with streaming  
✅ Async job processing with status tracking  
✅ Automatic retry logic  
✅ Transactional Neo4j loading  

## Example Workflow

1. Upload a CSV file with customer data
2. System generates unique file ID and stores metadata
3. Trigger processing with optional mapping context
4. LLM analyzes sample data and generates Cypher template
5. Data streams in batches to Neo4j
6. Monitor progress via job status endpoint

## Configuration

Key settings in `.env`:
- `BATCH_SIZE`: Records per Neo4j transaction (default: 1000)
- `MAX_FILE_SIZE`: Upload limit in bytes (default: 50MB)
- `MAX_RETRIES`: LLM retry attempts (default: 3)

## Error Handling

The pipeline includes:
- File validation on upload
- LLM fallback to simple mapping
- Transaction rollback on failures
- Comprehensive error logging
- Job status tracking for monitoring
