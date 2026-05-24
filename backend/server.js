import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, Post, User, Message } from './database/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

// Allow cross-origin requests from frontend (usually port 5173 for Vite)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration for handling media uploads (images and videos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only web-compatible images and videos are allowed!'));
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limits
});

// API Routes

// Get all posts (supports filters for feeds vs. editorial, tags, and searching)
app.get('/api/posts', async (req, res) => {
  try {
    const { isEditorial, tag, q } = req.query;
    const filter = {};

    if (isEditorial !== undefined) {
      filter.isEditorial = isEditorial === 'true';
    }

    const posts = await Post.findAll({
      order: [['createdAt', 'DESC']]
    });

    let filteredPosts = posts;

    // Filter by tags locally or via sequelize
    if (tag) {
      filteredPosts = filteredPosts.filter(p => 
        p.tags.toLowerCase().split(',').map(t => t.trim()).includes(tag.toLowerCase())
      );
    }

    // Dynamic search query matching titles, tags, content, or usernames
    if (q) {
      const query = q.toLowerCase();
      filteredPosts = filteredPosts.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.tags.toLowerCase().includes(query) ||
        p.authorName.toLowerCase().includes(query)
      );
    }

    res.json(filteredPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new post
app.post('/api/posts', upload.single('media'), async (req, res) => {
  try {
    const { title, content, tags, type, isAi, isEditorial, authorName, authorAvatar } = req.body;
    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      // Create static path link
      mediaUrl = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      mediaType = ['.mp4', '.mov', '.avi'].includes(ext) ? 'video' : 'image';
    }

    const newPost = await Post.create({
      title,
      content,
      mediaUrl,
      mediaType,
      tags: tags || 'horror',
      type: type || 'story',
      isAi: isAi === 'true',
      isEditorial: isEditorial === 'true',
      authorName: authorName || 'Anonymous Ghost',
      authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    });

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like a post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.likes += 1;
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile
app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: req.params.username } });
    if (!user) {
      // Auto-create a mock user if not exists for easy testing
      const newUser = await User.create({
        username: req.params.username,
        bio: 'Just entered the Lost Villa gates.'
      });
      return res.json(newUser);
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile details
app.post('/api/users/profile', upload.single('avatar'), async (req, res) => {
  try {
    const { username, bio, oldUsername, pronouns } = req.body;
    const user = await User.findOne({ where: { username: oldUsername } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser && username !== oldUsername) {
        return res.status(400).json({ error: 'Username already in use' });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (pronouns !== undefined) user.pronouns = pronouns;

    if (req.file) {
      user.avatarUrl = `/uploads/${req.file.filename}`;
    }

    await user.save();

    // If username changed, update all posts authored by this user
    if (username && username !== oldUsername) {
      await Post.update(
        { authorName: username, authorAvatar: user.avatarUrl },
        { where: { authorName: oldUsername } }
      );
    } else if (req.file) {
      await Post.update(
        { authorAvatar: user.avatarUrl },
        { where: { authorName: user.username } }
      );
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Messages from a Room
app.get('/api/messages/:roomName', async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { roomName: req.params.roomName },
      order: [['createdAt', 'ASC']],
      limit: 100
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io Real-Time Messaging Gateway
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`Socket user connected: ${socket.id}`);

  // User joins a room (either 'public' or a custom private hash room)
  socket.on('join_room', async (roomName) => {
    socket.join(roomName);
    console.log(`Socket client ${socket.id} joined room: ${roomName}`);
  });

  // User broadcasts a message
  socket.on('send_message', async (data) => {
    const { senderName, senderAvatar, roomName, text } = data;
    try {
      // Persist to database
      const msg = await Message.create({
        senderName,
        senderAvatar: senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        roomName,
        text
      });

      // Broadcast to other clients inside the exact room
      io.to(roomName).emit('receive_message', msg);
    } catch (err) {
      console.error('Error saving socket message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket user disconnected: ${socket.id}`);
  });
});

// Start database and launch web server
const PORT = 5050;
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(` Lost Villa Spooky Server Operational!`);
    console.log(` Portal active: http://localhost:${PORT}`);
    console.log(`========================================\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
