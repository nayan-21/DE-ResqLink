const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const usersRouter = require('./routes/users');
const sosRouter = require('./routes/sos');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// attach io to request
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/sos', sosRouter);

const PORT = process.env.PORT || 5000;
const MONGO_URI = "mongodb+srv://testuser:Test%401234@cluster0.ts66lut.mongodb.net/test";

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment variables');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
