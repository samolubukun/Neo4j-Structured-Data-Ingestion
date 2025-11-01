// Small script to test writes to Neo4j via neo4jService
require('dotenv').config();
const neo4jService = require('../src/services/neo4jService');
const config = require('../src/config');

(async () => {
  try {
    console.log('Testing write to Neo4j...');
    if (!config.neo4j.uri || !config.neo4j.user || !config.neo4j.password) {
      console.error('Missing Neo4j configuration. Set NEO4J_URI, NEO4J_USER/NEO4J_USERNAME and NEO4J_PASSWORD.');
      process.exit(1);
    }

    // Use a simple cypher and params array to test executeBatch
    const cypher = 'CREATE (t:TestWrite {name: $name, createdAt: datetime()}) RETURN id(t) as id';
    const paramsArray = [{ name: `test-${Date.now()}` }];

    await neo4jService.executeBatch(cypher, paramsArray);
    console.log('Write succeeded. Now checking count of TestWrite nodes...');

    // quick count using a driver directly
    const driver = require('neo4j-driver');
    const d = driver.driver(
      config.neo4j.uri,
      driver.auth.basic(config.neo4j.user, config.neo4j.password)
    );
    const session = d.session({ defaultAccessMode: driver.session.WRITE });
    try {
      const result = await session.run('MATCH (n:TestWrite) RETURN count(n) AS cnt');
      const cntRec = result.records[0].get('cnt');
      const cnt = typeof cntRec.toNumber === 'function' ? cntRec.toNumber() : cntRec;
      console.log('TestWrite node count:', cnt);
    } finally {
      await session.close();
      await d.close();
    }

    process.exit(0);
  } catch (err) {
    console.error('Write test failed:', err.message || err);
    process.exit(1);
  }
})();
