const FileMetadata = require('../models/fileMetadata');
const dataRetrievalService = require('../services/dataRetrievalService');
const llmService = require('../services/llmService');
const neo4jService = require('../services/neo4jService');
const config = require('../config');

const jobStatuses = new Map();

exports.processFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { mappingContext, targetSchema } = req.body;

    const metadata = await FileMetadata.findById(fileId);
    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }

    const jobId = `job_${fileId}_${Date.now()}`;
    jobStatuses.set(jobId, { status: 'started', progress: 0 });

    res.status(202).json({
      message: 'Processing started',
      jobId,
      fileId
    });

    processFileAsync(jobId, fileId, metadata, mappingContext, targetSchema).catch(err => {
      console.error('Processing error:', err);
      jobStatuses.set(jobId, { status: 'failed', error: err.message });
    });

  } catch (error) {
    next(error);
  }
};

async function processFileAsync(jobId, fileId, metadata, mappingContext, targetSchema) {
  try {
    jobStatuses.set(jobId, { status: 'sampling', progress: 10 });
    const sampleData = await dataRetrievalService.getSampleData(metadata, 50);

    jobStatuses.set(jobId, { status: 'generating_cypher', progress: 30 });
    const { cypherTemplate, transformLogic } = await llmService.generateCypherQuery(
      sampleData,
      mappingContext,
      targetSchema
    );

    await FileMetadata.update(fileId, {
      cypherTemplate,
      transformLogic,
      status: 'processing'
    });

    jobStatuses.set(jobId, { status: 'loading_data', progress: 50 });
    const dataStream = dataRetrievalService.streamData(metadata);
    
    let batch = [];
    let totalProcessed = 0;

    for await (const record of dataStream) {
      batch.push(record);

      if (batch.length >= config.processing.batchSize) {
          const params = batch.map(r => transformLogic(r));
          try {
            console.log(`job=${jobId} - Executing batch of ${batch.length} records`);
            await neo4jService.executeBatch(cypherTemplate, params);
            totalProcessed += batch.length;
            console.log(`job=${jobId} - Batch write successful, totalProcessed=${totalProcessed}`);
          } catch (err) {
            console.error(`job=${jobId} - Batch write failed:`, err.message || err);
            throw err;
          } finally {
            batch = [];
          }

          const progress = Math.min(90, 50 + (totalProcessed / 10000) * 40);
          jobStatuses.set(jobId, { status: 'loading_data', progress, totalProcessed });
      }
    }

    if (batch.length > 0) {
        const params = batch.map(r => transformLogic(r));
        try {
          console.log(`job=${jobId} - Executing final batch of ${batch.length} records`);
          await neo4jService.executeBatch(cypherTemplate, params);
          totalProcessed += batch.length;
          console.log(`job=${jobId} - Final batch write successful, totalProcessed=${totalProcessed}`);
        } catch (err) {
          console.error(`job=${jobId} - Final batch write failed:`, err.message || err);
          throw err;
        }
    }

    await FileMetadata.update(fileId, { status: 'completed', recordsProcessed: totalProcessed });
    jobStatuses.set(jobId, { status: 'completed', progress: 100, totalProcessed });

  } catch (error) {
    await FileMetadata.update(fileId, { status: 'failed', error: error.message });
    throw error;
  }
}

exports.getJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const status = jobStatuses.get(jobId);

    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  } catch (error) {
    next(error);
  }
};