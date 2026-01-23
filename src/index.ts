import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { prisma } from './config/prisma';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Importar rutas
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import progressRoutes from './routes/progress';
import evaluationRoutes from './routes/evaluation';
import modulesRoutes from './routes/modules';
import lessonsRoutes from './routes/lessons';
import curriculumRoutes from './routes/curriculum';

// Cargar variables de entorno
dotenv.config();

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
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
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
  FRONTEND_URL,
];

// Agregar URL de producción si está definida
if (process.env.PRODUCTION_URL) {
  allowedOrigins.push(process.env.PRODUCTION_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc) en desarrollo
    if (!origin && NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (!origin && NODE_ENV === 'production') {
      // En producción, rechazar requests sin origin
      callback(new Error('No permitido por CORS'));
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',
    'x-auth-token',
    'x-request-id',
    'cache-control'
  ],
  exposedHeaders: ['x-user-id'],
  credentials: true,
  optionsSuccessStatus: 200, // Para navegadores legacy
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
  max: 100, // 100 requests por IP
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

// Rutas de curriculum (orden explícito de módulos por nivel)
app.use('/api/curriculum', curriculumRoutes);

// TODO: Rutas de servicios de IA (cuando se implementen)
// app.use('/api/ai', aiRoutes);

// ============================================
// Manejo de errores
// ============================================

// Capturar rutas no encontradas
app.use(notFoundHandler);

// Middleware de manejo de errores global (debe ir al final)
app.use(errorHandler);

// ============================================
// Configuración del servidor
// ============================================

let server: any;

const startServer = () => {
  server = app.listen(PORT, () => {
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
    console.log('  - GET  /api/modules/* - Módulos educativos');
    console.log('  - GET  /api/lessons/* - Lecciones');
    console.log('  - GET  /api/curriculum/* - Curriculum (orden explícito)');
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
startServer();

export default app;
