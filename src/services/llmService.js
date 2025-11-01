const axios = require('axios');
const config = require('../config');

exports.generateCypherQuery = async (sampleData, mappingContext, targetSchema) => {
  const prompt = buildPrompt(sampleData, mappingContext, targetSchema);

  for (let attempt = 0; attempt < config.processing.maxRetries; attempt++) {
    try {
      const response = await axios.post(
        config.llm.apiUrl,
        {
          model: config.llm.model,
          messages: [
            {
              role: 'system',
              content: 'You are a Neo4j Cypher query expert. Generate parameterized MERGE queries and transformation logic.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${config.llm.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = parseResponse(response.data.choices[0].message.content);
      validateCypher(result.cypherTemplate);
      
      return result;
    } catch (error) {
      console.error(`LLM attempt ${attempt + 1} failed:`, error.message);
      if (attempt === config.processing.maxRetries - 1) {
        return getFallbackMapping(sampleData);
      }
      await sleep(1000 * (attempt + 1));
    }
  }
};

function buildPrompt(sampleData, mappingContext, targetSchema) {
  return `
Generate a Neo4j Cypher query template and transformation logic for this data.

Important requirements:
- The Cypher must create the appropriate nodes and relationships using MERGE or CREATE as needed.
- Use parameterized Cypher with $param style placeholders.
- The transformation logic must be a single JavaScript function (as a string) that takes one input record and returns an object with the parameters referenced in the Cypher.
- Return ONLY a single JSON object (no extra text) so it can be parsed automatically.

Sample Data (first 3 records):
${JSON.stringify(sampleData.slice(0, 3), null, 2)}

${mappingContext ? `Mapping Context: ${mappingContext}` : ''}
${targetSchema ? `Target Schema: ${JSON.stringify(targetSchema)}` : ''}

Return a JSON object with these fields:
1. "cypherTemplate": A parameterized Cypher query that creates nodes and relationships where appropriate. Examples:
   - Node-only: "MERGE (p:Person {id: $personId}) SET p.name = $name"
   - Node+relationship: "MERGE (a:Person {id: $personId}) MERGE (b:Company {id: $companyId}) MERGE (a)-[:WORKS_AT]->(b)"
2. "transformLogic": JavaScript function as string that transforms a record to query parameters. Example:
   "function(record) { return { personId: record.person_id, name: record.person_name, companyId: record.company_id }; }"

Ensure the JSON is the only content in the model output (no explanatory text). Strict JSON only.
`;
}

function parseResponse(content) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid LLM response format');

  const parsed = JSON.parse(jsonMatch[0]);
  // Evaluate the transformLogic string into a function. Ensure it's a function after eval.
  const transformFn = eval(`(${parsed.transformLogic})`);
  if (typeof transformFn !== 'function') {
    throw new Error('Invalid transformLogic: must evaluate to a function');
  }

  return {
    cypherTemplate: parsed.cypherTemplate,
    transformLogic: transformFn
  };
}

function validateCypher(cypher) {
  if (!cypher || (cypher.indexOf('MERGE') === -1 && cypher.indexOf('CREATE') === -1)) {
    throw new Error('Invalid Cypher: must contain MERGE or CREATE');
  }

  // Basic sanity: must reference at least one node pattern (parentheses)
  if (cypher.indexOf('(') === -1 || cypher.indexOf(')') === -1) {
    throw new Error('Invalid Cypher: must contain node patterns (e.g. (n:Label {id: $id}))');
  }
}

function getFallbackMapping(sampleData) {
  const fields = Object.keys(sampleData[0] || {});
  const idField = fields.find(f => f.toLowerCase().includes('id')) || fields[0];

  return {
    cypherTemplate: `MERGE (n:Record {id: $id}) SET ${fields.map(f => `n.${f} = $${f}`).join(', ')}`,
    transformLogic: (record) => {
      const params = { id: record[idField] };
      fields.forEach(f => params[f] = record[f]);
      return params;
    }
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}