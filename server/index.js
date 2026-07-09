import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';
import { initDatabase } from './database.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import mechanicRoutes from './routes/mechanics.js';
import notificationRoutes from './routes/notifications.js';
import paymentRoutes from './routes/payments.js';
import chatRoutes from './routes/chat.js';
import emergencyRoutes from './routes/emergency.js';

config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const db = initDatabase();

app.use((req, res, next) => {
  req.db = db;
  req.io = io;
  next();
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/emergency', emergencyRoutes);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log('Admin joined:', socket.id);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined:`, socket.id);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
  });

  socket.on('join_emergency', (emergencyId) => {
    socket.join(`emergency_track_${emergencyId}`);
    console.log(`User joined tracking for: ${emergencyId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`RoadRescue API running on port ${PORT}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured (using local AI)'}`);
});
