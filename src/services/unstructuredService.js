const fs = require('fs').promises;
const path = require('path');

// Lazy require for heavier libs so startup is faster
let pdfParse;
let mammoth;

async function ensureLibs() {
  if (!pdfParse) pdfParse = require('pdf-parse');
  if (!mammoth) mammoth = require('mammoth');
}

exports.extractText = async (filePath, format) => {
  await ensureLibs();

  format = format ? format.toLowerCase() : path.extname(filePath).slice(1).toLowerCase();

  if (format === 'pdf') {
    const data = await fs.readFile(filePath);
    const parsed = await pdfParse(data);
    return parsed.text || '';
  }

  if (format === 'docx' || format === 'doc') {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // fallback for plain text or other formats
  if (format === 'txt' || format === 'csv' || format === 'json') {
    return await fs.readFile(filePath, 'utf8');
  }

  // Unknown format: attempt to read as text
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Unsupported format for text extraction: ${format}`);
  }
};
