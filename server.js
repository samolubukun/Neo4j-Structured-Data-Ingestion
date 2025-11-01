require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${config.uploadDir}`);
  console.log(`🔗 Neo4j URI: ${config.neo4j.uri}`);
});