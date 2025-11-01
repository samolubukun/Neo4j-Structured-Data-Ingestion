const FileMetadata = require('../models/fileMetadata');
const unstructuredService = require('../services/unstructuredService');
const llmService = require('../services/llmService');

// Process unstructured file and extract named entities via LLM
exports.processUnstructured = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const metadata = await FileMetadata.findById(fileId);
    if (!metadata) return res.status(404).json({ error: 'File not found' });

    const format = metadata.format || metadata.filename && metadata.filename.split('.').pop();
    const text = await unstructuredService.extractText(metadata.path, format);

    // Ask LLM to extract named entities (NER) from the text
    const entities = await llmService.extractEntities(text, { fileId, filename: metadata.filename });

    // Save entities into metadata
    await FileMetadata.update(fileId, { status: 'processed_unstructured', entities, recordsProcessed: entities.length });

    res.json({ fileId, entitiesCount: entities.length, entities });
  } catch (error) {
    next(error);
  }
};

exports.getEntities = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const metadata = await FileMetadata.findById(fileId);
    if (!metadata) return res.status(404).json({ error: 'File not found' });
    res.json({ fileId, entities: metadata.entities || [] });
  } catch (error) {
    next(error);
  }
};
