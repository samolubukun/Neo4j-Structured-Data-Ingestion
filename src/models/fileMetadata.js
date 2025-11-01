const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

class FileMetadata {
  static async save(metadata) {
    const filePath = path.join(config.metadataDir, `${metadata.fileId}.json`);
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
    return metadata;
  }

  static async findById(fileId) {
    const filePath = path.join(config.metadataDir, `${fileId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  static async update(fileId, updates) {
    const metadata = await this.findById(fileId);
    if (!metadata) throw new Error('Metadata not found');
    
    const updated = { ...metadata, ...updates, updatedAt: new Date().toISOString() };
    return this.save(updated);
  }
}

module.exports = FileMetadata;