const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  neo4j: {
    uri: process.env.NEO4J_URI,
    // Accept either NEO4J_USER or NEO4J_USERNAME from environment (.env may use either)
    user: process.env.NEO4J_USER || process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    // optional: allow specifying database name
    database: process.env.NEO4J_DATABASE || 'neo4j'
  },
  
  llm: {
    apiKey: process.env.LLM_API_KEY,
    apiUrl: process.env.LLM_API_URL,
    model: process.env.LLM_MODEL || 'gpt-4'
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024,
    allowedFormats: ['csv', 'json', 'xls', 'xlsx'],
    dir: process.env.UPLOAD_DIR || './uploads'
  },
  
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  metadataDir: path.resolve(process.env.METADATA_DIR || './metadata'),
  
  processing: {
    batchSize: parseInt(process.env.BATCH_SIZE) || 1000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3
  }
};