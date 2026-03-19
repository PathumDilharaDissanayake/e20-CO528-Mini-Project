/**
 * API Documentation routes — serves OpenAPI spec + Swagger UI via CDN.
 * No npm packages required: Swagger UI assets loaded from unpkg.com CDN.
 * Agent: A-09 (DevOps Agent) | 2026-03-03
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Serve raw OpenAPI YAML spec
router.get('/api/docs/openapi.yaml', (_req: Request, res: Response) => {
  const specPath = path.resolve(__dirname, '../../../../docs/openapi/openapi.yaml');
  if (!fs.existsSync(specPath)) {
    res.status(404).json({ success: false, message: 'OpenAPI spec not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/yaml');
  res.sendFile(specPath);
});

// Swagger UI HTML (loads assets from unpkg.com CDN)
router.get('/api/docs', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DECP Platform — API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
  <style>
    body { margin: 0; }
    #swagger-ui .topbar { background-color: #10b981; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: '/api/docs/openapi.yaml',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
        deepLinking: true,
        displayRequestDuration: true
      });
    };
  </script>
</body>
</html>`);
});

export default router;
