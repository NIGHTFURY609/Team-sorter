const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsort', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Participant Schema
const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Participant = mongoose.model('Participant', participantSchema);

// Redis Connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Initialize Redis connection
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('Redis client connected successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
}

connectRedis();

// Utility function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Utility function to distribute participants into teams
function distributeIntoTeams(participants, numTeams) {
  const shuffled = shuffleArray(participants);
  const teams = Array.from({ length: numTeams }, () => []);
  
  shuffled.forEach((participant, index) => {
    teams[index % numTeams].push(participant);
  });
  
  return teams.map((team, index) => ({
    teamNumber: index + 1,
    members: team
  }));
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API endpoint to add a new participant
app.post('/api/participants', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Save to MongoDB
    const participant = new Participant({ name: name.trim() });
    await participant.save();

    // Add to Redis list for fast retrieval
    await redisClient.lPush('participants', name.trim());

    // Emit real-time update to admin clients
    io.emit('new_participant', { name: name.trim(), id: participant._id });

    res.json({ 
      success: true, 
      message: 'You have joined the session!',
      participant: { name: name.trim(), id: participant._id }
    });

  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get all participants (fallback for initial load)
app.get('/api/participants', async (req, res) => {
  try {
    // Try to get from Redis first
    const redisParticipants = await redisClient.lRange('participants', 0, -1);
    
    if (redisParticipants.length > 0) {
      // Reverse to maintain chronological order (Redis lPush adds to beginning)
      res.json(redisParticipants.reverse());
    } else {
      // Fallback to MongoDB if Redis is empty
      const participants = await Participant.find().sort({ createdAt: 1 });
      const names = participants.map(p => p.name);
      
      // Populate Redis with current data
      if (names.length > 0) {
        await redisClient.del('participants'); // Clear any existing data
        await redisClient.lPush('participants', ...names.reverse()); // Add in reverse order
      }
      
      res.json(names);
    }
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to clear all participants (useful for testing)
app.delete('/api/participants', async (req, res) => {
  try {
    // Clear MongoDB
    await Participant.deleteMany({});
    
    // Clear Redis
    await redisClient.del('participants');
    
    // Notify all admin clients
    io.emit('participants_cleared');
    
    res.json({ success: true, message: 'All participants cleared' });
  } catch (error) {
    console.error('Error clearing participants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle team generation request from admin
  socket.on('generate_teams', async (data) => {
    try {
      const { numTeams } = data;
      
      if (!numTeams || numTeams < 1) {
        socket.emit('error', { message: 'Invalid number of teams' });
        return;
      }

      // Get participants from Redis
      const participants = await redisClient.lRange('participants', 0, -1);
      
      if (participants.length === 0) {
        socket.emit('error', { message: 'No participants available' });
        return;
      }

      // Reverse to maintain chronological order
      const orderedParticipants = participants.reverse();
      
      // Generate teams
      const teams = distributeIntoTeams(orderedParticipants, parseInt(numTeams));
      
      // Emit teams to all admin clients
      io.emit('teams_generated', { 
        teams, 
        totalParticipants: orderedParticipants.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating teams:', error);
      socket.emit('error', { message: 'Failed to generate teams' });
    }
  });

  // Handle request for current participants list
  socket.on('get_participants', async () => {
    try {
      const participants = await redisClient.lRange('participants', 0, -1);
      socket.emit('participants_list', participants.reverse());
    } catch (error) {
      console.error('Error getting participants:', error);
      socket.emit('error', { message: 'Failed to get participants' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Participant page: http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});