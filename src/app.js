const express = require('express');
const fs = require('fs');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

// Ensure directories exist
[config.uploadDir, config.metadataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/v1', routes);

// Serve raw OpenAPI spec
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route: provide a simple redirect to the API base or a small welcome message.
// This avoids the default "Cannot GET /" message when visiting the server root in a browser.
app.get('/', (req, res) => {
  // If you prefer a JSON response instead of redirect, change this to res.json({ message: 'Welcome' })
  res.redirect('/v1');
});

app.use(errorHandler);

module.exports = app;