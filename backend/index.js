import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { bootstrapDatabase, getDatabaseStatus, closeDatabase } from './database/index.js';

// Logging & Reliability Imports
import logger, { requestLogger } from './middleware/logger.js';
import { emitWithLogging, emitToRoom, getSocketStats } from './services/socketLogger.js';

// Route Imports
import authRoutes from './authentication/auth.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import mechanicRoutes from './routes/mechanics.js';
import notificationRoutes from './routes/notifications.js';
import paymentRoutes from './routes/payments.js';
import chatRoutes from './routes/chat.js';
import emergencyRoutes from './routes/emergency.js';
import workflowRoutes from './booking_workflow/routes.js';
import { initWorkflowDatabase } from './booking_workflow/db.js';

// Admin Module Route Imports
import servicesRoutes from './routes/services.js';
import emergencyTypesRoutes from './routes/emergencyTypes.js';
import exportRoutes from './routes/exportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Pricing Module Route Imports
import pricingRoutes from './routes/pricingRoutes.js';
import enhancedServiceRoutes from './routes/serviceRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import zoneRoutes from './routes/zoneRoutes.js';
import emergencyPricingRoutes from './routes/emergencyPricingRoutes.js';

// Reliability Module Route Imports
import healthRoutes from './routes/healthRoutes.js';
import configRoutes from './routes/configRoutes.js';
import featureRoutes from './routes/featureRoutes.js';

// Middleware Imports
import { verifyAdmin } from './authentication/middleware.js';
import { apiLimiter, authLimiter, paymentLimiter, emergencyLimiter, adminLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sanitizeInput, blockMaliciousPayload } from './middleware/sanitize.js';

// Load environment variables
config();

// ============================================================
// LOGGING INITIALIZATION
// ============================================================
const logsDir = join(process.cwd(), 'logs');
logger.init(logsDir);
logger.info('[Server] Logger initialized', { logDir: logsDir });

const app = express();
const server = createServer(app);

// ============================================================
// STRICT CORS CONFIGURATION
// ============================================================
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // Preflight cache: 24 hours
};

// Socket.IO with restricted CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// ============================================================
// SECURITY & PARSING MIDDLEWARE
// ============================================================

// Helmet security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Disable for development flexibility
}));

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Input sanitization - trim strings and escape XSS
app.use(sanitizeInput);

// Block malicious payloads (SQL injection, XSS, NoSQL injection, path traversal)
app.use(blockMaliciousPayload);

// Request logging middleware
app.use(requestLogger);

// ============================================================
// RATE LIMITING
// ============================================================

// Specific rate limiters for sensitive routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api/emergency', emergencyLimiter);
app.use('/api/admin', adminLimiter);

// General API rate limiter for all other routes
app.use('/api/', apiLimiter);

// ============================================================
// STATIC FILES
// ============================================================
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ============================================================
// DATABASE INITIALIZATION (with migrations, repositories, services)
// ============================================================
const dbPath = join(process.cwd(), 'roadrescue.db');
const { db, repositories, services, migrationResults } = bootstrapDatabase(dbPath);
initWorkflowDatabase(db);

// ============================================================
// RUN STARTUP HEALTH CHECKS
// ============================================================
// Set Socket.IO reference on health service (io is created after bootstrap)
services.health.io = io;
services.health.runStartupChecks();

// Attach DB, Socket.IO, repositories, and services to every request
app.use((req, res, next) => {
  req.db = db;
  req.io = io;
  req.repos = repositories;
  req.services = services;
  next();
});

// ============================================================
// HEALTH & READINESS PROBES (before rate limiting)
// ============================================================
app.use(healthRoutes);

// ============================================================
// API ROUTING
// ============================================================

// Auth routes (rate limited individually above)
app.use('/api/auth', authRoutes);

// Core routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', verifyAdmin, adminRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api', workflowRoutes);

// Admin Module Routes
app.use('/api/admin/services', verifyAdmin, servicesRoutes);
app.use('/api/admin/emergency-types', verifyAdmin, emergencyTypesRoutes);
app.use('/api/admin/export', verifyAdmin, exportRoutes);
app.use('/api/admin/audit-logs', verifyAdmin, auditRoutes);
app.use('/api/admin/analytics', verifyAdmin, analyticsRoutes);

// Pricing Module Routes
app.use('/api/pricing', pricingRoutes);
app.use('/api/services', enhancedServiceRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/emergency-pricing', emergencyPricingRoutes);

// Reliability Module Routes
app.use('/api/config', configRoutes);
app.use('/api/features', featureRoutes);

// Root Status Check (includes database health)
app.get('/status', (req, res) => {
  const dbStatus = getDatabaseStatus(db);
  res.json({
    success: true,
    message: 'RoadRescue Backend API is fully operational.',
    database: dbStatus,
    migrations: migrationResults.length > 0 ? migrationResults : 'No new migrations',
  });
});

// ============================================================
// SOCKET.IO EVENTS (with logging)
// ============================================================
io.on('connection', (socket) => {
  logger.info('Socket client connected', { socketId: socket.id });

  socket.on('join_admin', () => {
    socket.join('admin_room');
  });

  socket.on('join_user', (userId) => {
    if (userId && typeof userId === 'string') {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('join_conversation', (conversationId) => {
    if (conversationId && typeof conversationId === 'string') {
      socket.join(`conv_${conversationId}`);
    }
  });

  socket.on('join_emergency', (emergencyId) => {
    if (emergencyId && typeof emergencyId === 'string') {
      socket.join(`emergency_track_${emergencyId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info('Socket client disconnected', { socketId: socket.id });
  });
});

app.set('io', io);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler (must be last middleware)
app.use(errorHandler);

// ============================================================
// SERVER START
// ============================================================
const dbStatus = getDatabaseStatus(db);
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info('RoadRescue API server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: allowedOrigins.join(', '),
    schemaVersion: dbStatus.schemaVersion,
    migrationsApplied: migrationResults.length || 'none',
    openai: process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured',
    uptime: '0s',
  });
  console.log(`\nRoadRescue API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`Database Schema Version: ${dbStatus.schemaVersion}`);
  console.log(`Migrations Applied: ${migrationResults.length || 'none'}`);
  console.log(`OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log('');
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
function gracefulShutdown(signal) {
  logger.info(`[Server] Received ${signal}, shutting down gracefully...`);
  console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);

  server.close(() => {
    closeDatabase(db);
    logger.info('[Server] Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  gracefulShutdown('uncaughtException');
});
