const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');

exports.getSampleData = async (metadata, sampleSize = 50) => {
  const { format, path: filePath } = metadata;

  if (format === 'csv') {
    return getSampleFromCSV(filePath, sampleSize);
  } else if (format === 'json') {
    return getSampleFromJSON(filePath, sampleSize);
  } else if (format === 'xls' || format === 'xlsx') {
    return getSampleFromExcel(filePath, sampleSize);
  }

  throw new Error(`Unsupported format: ${format}`);
};

// Return an async iterable for the file data. Do NOT make this a generator function
// (no star) — it should return the async generator produced by the format-specific
// stream functions so consumers can `for await` over it.
exports.streamData = function (metadata) {
  const { format, path: filePath } = metadata;

  if (format === 'csv') {
    return streamCSV(filePath);
  } else if (format === 'json') {
    return streamJSON(filePath);
  } else if (format === 'xls' || format === 'xlsx') {
    return streamExcel(filePath);
  }

  throw new Error(`Unsupported format: ${format}`);
};

async function getSampleFromCSV(filePath, limit) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (results.length < limit) results.push(data);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function getSampleFromJSON(filePath, limit) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const array = Array.isArray(data) ? data : [data];
  return array.slice(0, limit);
}

async function getSampleFromExcel(filePath, limit) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return data.slice(0, limit);
}

async function* streamCSV(filePath) {
  const stream = fs.createReadStream(filePath).pipe(csv());
  for await (const row of stream) {
    yield row;
  }
}

async function* streamJSON(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const array = Array.isArray(data) ? data : [data];
  for (const item of array) {
    yield item;
  }
}

async function* streamExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  for (const row of data) {
    yield row;
  }
}