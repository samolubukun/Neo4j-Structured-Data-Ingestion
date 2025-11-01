// Load .env when running this script directly
require('dotenv').config();
const neo4jService = require('../src/services/neo4jService');

(async () => {
  try {
    console.log('Testing Neo4j connection...');
    // Quick config check
    const config = require('../src/config');
    if (!config.neo4j.uri || !config.neo4j.user || !config.neo4j.password) {
      console.error('Missing Neo4j configuration. Make sure NEO4J_URI, NEO4J_USER and NEO4J_PASSWORD are set in your environment or in a .env file.');
      process.exit(1);
    }

    await neo4jService.testConnection();
    console.log('Connected to Neo4j successfully. Running a quick count query...');

    const driver = require('neo4j-driver');
    // reuse config loaded above
    const d = driver.driver(
      config.neo4j.uri,
      driver.auth.basic(config.neo4j.user, config.neo4j.password)
    );
    const session = d.session();
    try {
      const result = await session.run('MATCH (n) RETURN count(n) AS cnt');
      const cnt = result.records[0].get('cnt').toNumber ? result.records[0].get('cnt').toNumber() : result.records[0].get('cnt');
      console.log('Node count in database:', cnt);
    } finally {
      await session.close();
      await d.close();
    }
  } catch (err) {
    console.error('Neo4j test failed:', err.message);
    process.exit(1);
  }
})();
