const express = require('express');
const uploadController = require('../controllers/uploadController');
const ingestionController = require('../controllers/ingestionController');
const { validateUpload } = require('../middleware/validator');

const router = express.Router();

// API root for v1 - provides a small summary so GET /v1 returns useful info
router.get('/', (req, res) => {
	res.json({
		name: 'Neo4j Structured ingestion API',
		version: 'v1',
		description: 'API endpoints for uploading and ingesting files into Neo4j',
		endpoints: [
			{ method: 'POST', path: '/v1/ingest/upload' },
			{ method: 'GET', path: '/v1/ingest/file/:fileId' },
			{ method: 'POST', path: '/v1/ingest/process/:fileId' },
			{ method: 'GET', path: '/v1/ingest/status/:jobId' }
		]
	});
});

router.post('/ingest/upload', validateUpload, uploadController.uploadFile);
router.get('/ingest/file/:fileId', uploadController.getFileMetadata);
router.post('/ingest/process/:fileId', ingestionController.processFile);
router.get('/ingest/status/:jobId', ingestionController.getJobStatus);

module.exports = router;