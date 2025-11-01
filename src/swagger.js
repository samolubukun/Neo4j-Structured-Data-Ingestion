module.exports = {
  openapi: '3.0.1',
  info: {
    title: 'Neo4j Structured ingestion API',
    version: 'v1',
    description: 'API endpoints for uploading and ingesting files into Neo4j'
  },
  servers: [
    { url: '/' }
  ],
  paths: {
    '/v1/ingest/upload': {
      post: {
        tags: ['ingest'],
        summary: 'Upload a file for ingestion',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' }
                },
                required: ['file']
              }
            }
          }
        },
        responses: {
          '200': { description: 'File uploaded', content: { 'application/json': { schema: { type: 'object' } } } },
          '400': { description: 'Validation error' }
        }
      }
    },
    '/v1/ingest/file/{fileId}': {
      get: {
        tags: ['ingest'],
        summary: 'Get metadata for an uploaded file',
        parameters: [{ name: 'fileId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'File metadata', content: { 'application/json': { schema: { type: 'object' } } } }, '404': { description: 'Not found' } }
      }
    },
    '/v1/ingest/process/{fileId}': {
      post: {
        tags: ['ingest'],
        summary: 'Start ingestion process for a file',
        parameters: [{ name: 'fileId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '202': { description: 'Process started', content: { 'application/json': { schema: { type: 'object' } } } }, '404': { description: 'File not found' } }
      }
    },
    '/v1/ingest/status/{jobId}': {
      get: {
        tags: ['ingest'],
        summary: 'Get ingestion job status',
        parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job status', content: { 'application/json': { schema: { type: 'object' } } } }, '404': { description: 'Not found' } }
      }
    }
  }
};
