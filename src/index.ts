import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './shared/infrastructure/database';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler.middleware';
import {
  createSimulationController,
  SimulationService,
  PatientSimulationService,
  PatientCalculatorService,
  SignalGeneratorService,
  ClinicalCasesService,
  WSGateway,
  MqttClient,
  HexParser,
  HexEncoder,
  InfluxTelemetryService,
} from './modules/simulation';

// Importar rutas desde módulos
import authRoutes from './modules/auth/auth.controller';
import evaluationRoutes from './modules/evaluation/evaluation.controller';
import usersRoutes from './modules/profile/profile.controller';
import adminRoutes from './modules/admin/admin.controller';
import groupsRoutes from './modules/admin/groups.controller';
import scoresRoutes from './modules/admin/scores.controller';
import activityRoutes from './modules/activities/activity.controller';
import activityAssignmentsRoutes from './modules/activities/assignment.controller';
import activitySubmissionsRoutes from './modules/activities/submission.controller';
import {
  teachingRoutes,
  progressRoutes,
  modulesRoutes,
  lessonsRoutes,
  curriculumRoutes,
  teacherStudentsRoutes,
  levelsRoutes,
  cardsRoutes,
  changelogRoutes,
  overridesRoutes,
  pagesRoutes,
} from './modules/teaching/router';

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================
// Load environment variables based on NODE_ENV
// Priority: process.env.NODE_ENV > .env.development (default)
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = NODE_ENV === 'production' ? '.env.production' : '.env.development';

const envResult = dotenv.config({ path: envFile });

if (envResult.error) {
  console.error(`❌ Error loading ${envFile}:`, envResult.error.message);
  console.error('Falling back to .env file...');
  dotenv.config(); // Fallback to .env
} else {
  console.log(`✅ Loaded environment from: ${envFile}`);
  console.log(`🔧 NODE_ENV: ${NODE_ENV}`);
}

// Validar variables de entorno requeridas
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingEnvVars.join(', '));
  console.error('Por favor, configura estas variables en tu archivo .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;
// NODE_ENV already defined above after dotenv.config()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Trust proxy for rate limiting (needed when behind reverse proxy)
// Cambiado a 1 para evitar error con express-rate-limit v7+
app.set('trust proxy', 1);

// ============================================
// Configuración de CORS
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4000',
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'https://ventylab.vercel.app', // URL principal de producción
  'https://ventylab-git-main.vercel.app', // Branch principal
  'https://ventilab-web.vercel.app', // URL alternativa de producción
  'https://ventilab-web-git-main.vercel.app', // Branch principal alternativo
].filter(Boolean);

// Logging para debug de CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('🌐 Request from:', req.headers.origin || 'no-origin');
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Postman, curl, server-to-server, etc.)
    if (!origin) return callback(null, true);

    // Normalize origin (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Permitir dominios en whitelist
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Permitir cualquier subdominio de Vercel
    if (normalizedOrigin.match(/https:\/\/.*\.vercel\.app$/)) {
      return callback(null, true);
    }

    console.error('🚫 CORS bloqueó origen:', normalizedOrigin);
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-user-id',
    'x-auth-token',
    'x-request-id',
    'cache-control'
  ],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200,
}));

// ============================================
// Middleware de seguridad
// ============================================
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// ============================================
// Middleware de compresión
// ============================================
app.use(compression());

// ============================================
// Rate Limiting global
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // 500 requests por IP (progress tracking fires frequently)
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Por favor, intenta nuevamente más tarde.',
  },
  standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  skip: (req) => {
    // Saltar rate limiting en health check
    return req.path === '/health';
  },
});

app.use('/api', limiter);

// ============================================
// Body Parsers
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Logger de requests (solo en desarrollo)
// ============================================
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // En producción, log más simple
  app.use(morgan('combined'));
}

// ============================================
// Rutas de API
// ============================================

// Normalize double /api prefix (e.g. /api/api/levels → /api/levels)
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});

// Ruta de salud (antes de autenticación)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
// También sin prefijo /api para compatibilidad con frontend
app.use('/auth', authRoutes);

// Rutas de usuarios
app.use('/api/users', usersRoutes);

// Rutas de progreso
app.use('/api/progress', progressRoutes);
// También sin prefijo /api para compatibilidad con frontend
app.use('/progress', progressRoutes);

// Rutas de casos clínicos (evaluación)
app.use('/api/cases', evaluationRoutes);

// Rutas de módulos educativos
app.use('/api/modules', modulesRoutes);

// Rutas de lecciones
app.use('/api/lessons', lessonsRoutes);

// Rutas de niveles (CRUD para niveles curriculares)
app.use('/api/levels', levelsRoutes);

// Rutas de tarjetas/pasos (CRUD para contenido atómico dentro de lecciones)
app.use('/api/cards', cardsRoutes);

// Rutas de curriculum (orden explícito de módulos por nivel)
app.use('/api/curriculum', curriculumRoutes);

// Rutas de relación profesor-estudiante
// Includes: /api/teacher-students, /api/teachers/:id/students, /api/students/:id/teachers
app.use('/api', teacherStudentsRoutes);

// Rutas de historial de cambios (audit trail)
// RBAC: TEACHER+ can view (teachers see own changes, admins see all)
app.use('/api/changelog', changelogRoutes);

// Rutas de overrides de contenido (personalización por estudiante)
// RBAC: TEACHER+ can manage (teachers manage assigned students, admins manage all)
app.use('/api/overrides', overridesRoutes);

// Rutas de progresión docente (unlock + completion)
app.use('/api/teaching', teachingRoutes);

// Rutas de páginas (Phase 1 - Content Hierarchy Refactoring)
app.use('/api/pages', pagesRoutes);

// Rutas de administración (TEACHER+ para ver estudiantes, ADMIN+ para gestión)
app.use('/api/admin', adminRoutes);
// También sin prefijo /api para compatibilidad con frontend
app.use('/admin', adminRoutes);

// Rutas de grupos (TEACHER+)
app.use('/api/groups', groupsRoutes);

// Rutas de calificaciones del profesor (TEACHER+)
app.use('/api/scores', scoresRoutes);

// Rutas de actividades (evaluaciones: exámenes/quizzes/talleres)
app.use('/api/activities', activityRoutes);
app.use('/api/activity-assignments', activityAssignmentsRoutes);
app.use('/api/activity-submissions', activitySubmissionsRoutes);

// Rutas de simulación (WebSocket gateway + ventilador físico)
// NOTE: simulationRouter is registered after the HTTP server is created
// (see startServer below) so that the Socket.io server is ready first.

// TODO: Rutas de servicios de IA (cuando se implementen)
// app.use('/api/ai', aiRoutes);

// ============================================
// Manejo de errores
// ============================================
// NOTE: Error handlers are registered inside startServer() AFTER the
// simulation router, which needs the HTTP server (Socket.io) to exist.
// Registering them here would block any routes mounted later.

// ============================================
// Configuración del servidor
// ============================================

let server: http.Server;
let influxService: InfluxTelemetryService | null = null;

const startServer = async () => {
  // ------------------------------------------------------------------
  // HTTP server + Socket.io
  // ------------------------------------------------------------------
  server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins as string[],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ------------------------------------------------------------------
  // Simulation module wiring
  // ------------------------------------------------------------------
  const mqttBrokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
  const mqttTelemetryTopic = process.env.MQTT_TOPIC; // undefined → MqttClient uses MQTT_TOPICS.TELEMETRY

  const mqttClient = new MqttClient({
    brokerUrl: mqttBrokerUrl,
    clientId: `ventylab-server-${Math.random().toString(16).slice(2, 8)}`,
    telemetryTopic: mqttTelemetryTopic,
  });
  const wsGateway = new WSGateway(io);
  const hexParser = new HexParser();
  const hexEncoder = new HexEncoder();
  const simulationService = new SimulationService(
    prisma,
    wsGateway,
    mqttClient,
    hexParser,
    hexEncoder,
  );

  // Patient simulation (signal generation from form data)
  const calculator = new PatientCalculatorService();
  const signalGenerator = new SignalGeneratorService();
  const clinicalCasesService = new ClinicalCasesService(calculator);
  const patientSimulationService = new PatientSimulationService(
    calculator,
    signalGenerator,
    clinicalCasesService,
    wsGateway,
  );

  // Register REST routes (needs the instantiated services)
  app.use('/api/simulation', createSimulationController(simulationService, patientSimulationService));

  // Error handlers MUST be registered AFTER all routes (including simulation)
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Connect to MQTT (non-fatal – server starts even if broker is unreachable)
  try {
    await simulationService.initialize();
    console.log('✅ Simulation module initialized (MQTT connected)');
  } catch (err: any) {
    console.warn('⚠️  Simulation module: MQTT connection failed –', err.message);
    console.warn('    REST endpoints are available; real-time data will not stream.');
  }

  // InfluxDB telemetry persistence (optional – server starts without it)
  influxService = InfluxTelemetryService.fromEnv();
  if (influxService) {
    const influx = influxService; // capture for closure narrowing
    mqttClient.subscribeTelemetryJson((payload) => {
      influx.writeTelemetry(payload);
    });
    console.log('✅ InfluxDB telemetry writer attached to MQTT stream');
  }

  // ------------------------------------------------------------------
  // Start listening
  // ------------------------------------------------------------------
  server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Entorno: ${NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
    console.log('='.repeat(50));
    console.log('📋 Endpoints disponibles:');
    console.log('  - GET  /health - Health check');
    console.log('  - POST /api/auth/* - Autenticación');
    console.log('  - GET  /api/users/* - Usuarios');
    console.log('  - GET  /api/progress/* - Progreso');
    console.log('  - GET  /api/cases/* - Casos clínicos');
    console.log('  - CRUD /api/levels/* - Niveles curriculares');
    console.log('  - CRUD /api/modules/* - Módulos educativos');
    console.log('  - CRUD /api/lessons/* - Lecciones');
    console.log('  - CRUD /api/cards/* - Tarjetas/Pasos');
    console.log('  - GET  /api/curriculum/* - Curriculum (orden explícito)');
    console.log('  - GET  /api/teacher-students/* - Relaciones profesor-estudiante');
    console.log('  - GET  /api/changelog/* - Historial de cambios (audit trail)');
    console.log('  - CRUD /api/overrides/* - Overrides de contenido por estudiante');
    console.log('  - GET  /api/pages/* - Páginas (Phase 1 - Content Hierarchy)');
    console.log('  - CRUD /api/admin/* - Dashboard profesor/admin');
    console.log('  - CRUD /api/groups/* - Gestión de grupos');
    console.log('  - CRUD /api/scores/* - Calificaciones por estudiante');
    console.log('  - WS   /socket.io - WebSocket (simulación en tiempo real)');
    console.log('  - CRUD /api/simulation/* - Simulación ventilador');
    console.log('='.repeat(50));
  });
};

// ============================================
// Graceful Shutdown
// ============================================

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} recibido. Iniciando cierre graceful...`);

  // Cerrar servidor HTTP
  if (server) {
    server.close(() => {
      console.log('✅ Servidor HTTP cerrado');
    });
  }

  // Flush y cerrar InfluxDB WriteApi
  if (influxService) {
    try {
      await influxService.close();
      console.log('✅ InfluxDB WriteApi cerrado');
    } catch (err) {
      console.error('❌ Error cerrando InfluxDB:', err);
    }
  }

  // Cerrar conexión de Prisma
  try {
    await prisma.$disconnect();
    console.log('✅ Conexión de base de datos cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar conexión de base de datos:', error);
  }

  // Cerrar proceso
  process.exit(0);
};

// Manejar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection:', reason);
  // En producción, podrías querer cerrar el servidor aquí
  if (NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Iniciar servidor
startServer().catch((err) => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});

export default app;
