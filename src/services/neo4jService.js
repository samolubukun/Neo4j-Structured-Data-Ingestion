const neo4j = require('neo4j-driver');
const config = require('../config');

let driver;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    );
  }
  return driver;
}

exports.executeBatch = async (cypherTemplate, paramsArray) => {
  const driver = getDriver();
  const session = driver.session();

  try {
    await session.executeWrite(async tx => {
      for (const params of paramsArray) {
        await tx.run(cypherTemplate, params);
      }
    });
  } finally {
    await session.close();
  }
};

exports.testConnection = async () => {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    await session.run('RETURN 1');
    return true;
  } catch (error) {
    throw new Error(`Neo4j connection failed: ${error.message}`);
  } finally {
    await session.close();
  }
};

exports.closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};

process.on('exit', () => {
  if (driver) driver.close();
});