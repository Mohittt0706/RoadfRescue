import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { initDatabase } from './database.js';

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

// Middlewares
import { verifyAdmin } from './authentication/middleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';

config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

// Security & Formatting Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading uploaded profile images in browser
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all standard API routes
app.use('/api/', apiLimiter);

// Serve static uploads
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Database Initialization
const db = initDatabase();
initWorkflowDatabase(db);

// Attach DB and Socket.IO to request
app.use((req, res, next) => {
  req.db = db;
  req.io = io;
  next();
});

// API Routing Setup
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', verifyAdmin, adminRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api', workflowRoutes);

// Admin Module Routes (Services, Emergency Types, Export, Audit, Analytics)
app.use('/api/admin/services', verifyAdmin, servicesRoutes);
app.use('/api/admin/emergency-types', verifyAdmin, emergencyTypesRoutes);
app.use('/api/admin/export', verifyAdmin, exportRoutes);
app.use('/api/admin/audit-logs', verifyAdmin, auditRoutes);
app.use('/api/admin/analytics', verifyAdmin, analyticsRoutes);

// Root Status Check
app.get('/status', (req, res) => {
  res.json({ success: true, message: 'RoadRescue Backend API is fully operational.' });
});

// Socket.IO Events Namespace
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log('Admin joined room:', socket.id);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room:`, socket.id);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
    console.log(`Client joined conversation room: conv_${conversationId}`);
  });

  socket.on('join_emergency', (emergencyId) => {
    socket.join(`emergency_track_${emergencyId}`);
    console.log(`Client joined tracking room for: ${emergencyId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack || err.toString()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`RoadRescue Production-Grade API running on port ${PORT}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured (using local AI)'}`);
});
