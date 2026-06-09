import { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from './auth.routes.js';
import { registerAnticipoRoutes } from './anticipo.routes.js';
import { registerFacturaRoutes } from './factura.routes.js';
import { registerViaticoRoutes } from './viatico.routes.js';
import { registerLegalizacionRoutes } from './legalizacion.routes.js';
import { registerGastoRoutes } from './gasto.routes.js';
import { registerDashboardRoutes } from './dashboard.routes.js';
import { registerUserRoutes } from './user.routes.js';

export const registerRoutes = (app: FastifyInstance) => {
  app.get('/health', async () => ({ status: 'ok' }));

  app.register(registerAuthRoutes, { prefix: '/auth' });
  app.register(registerAnticipoRoutes, { prefix: '/api/v1/anticipos' });
  app.register(registerFacturaRoutes, { prefix: '/api/v1/facturas' });
  app.register(registerViaticoRoutes, { prefix: '/api/v1/viaticos' });
  app.register(registerLegalizacionRoutes, { prefix: '/api/v1/legalizaciones' });
  app.register(registerGastoRoutes, { prefix: '/api/v1/gastos' });
  app.register(registerDashboardRoutes, { prefix: '/api/v1/dashboard' });
  app.register(registerUserRoutes, { prefix: '/api/v1/users' });
};
