import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { loadEnv } from './config/env.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './errors/errorHandler.js';
import { initStorage } from './lib/supabase.js';

loadEnv();

const server = Fastify({ logger: true });

// Register CORS
server.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
});

// Register multipart for file uploads
server.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

// Register Swagger
server.register(swagger, {
  openapi: {
    info: {
      title: 'Portal API',
      description: 'API documentation for the Portal',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  }
});

server.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
});

// Register routes
registerRoutes(server);

// Global error handler
server.setErrorHandler(errorHandler);

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    await server.listen({ port, host: '0.0.0.0' });
    
    // Initialize storage
    await initStorage();

    server.log.info(`🚀 Server listening on http://localhost:${port}`);
    server.log.info(`📖 Swagger UI available at http://localhost:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
