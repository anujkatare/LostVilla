import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, Post, User, Message, Follower } from './database/db.js';

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

// Clean up uploads directory to keep at most 10 files (FIFO)
const cleanUploadsDirectory = () => {
  try {
    const files = fs.readdirSync(uploadsDir);
    if (files.length <= 10) return;

    // Get file details with stats for birthtime (creation time)
    const fileStats = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      return { file, filePath, time: stat.birthtimeMs };
    });

    // Sort by oldest first (ascending time)
    fileStats.sort((a, b) => a.time - b.time);

    // Calculate how many to delete
    const toDeleteCount = fileStats.length - 10;
    for (let i = 0; i < toDeleteCount; i++) {
      fs.unlinkSync(fileStats[i].filePath);
      console.log(`FIFO Cleaned: Deleted old file ${fileStats[i].file}`);
    }
  } catch (error) {
    console.error('Failed to clean uploads directory:', error.message);
  }
};

// Multer Storage Configuration for handling media uploads (images and videos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cleanUploadsDirectory();
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
      where: filter,
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

// Create new post (supports multiple photos OR a single video)
app.post('/api/posts', upload.array('media', 10), async (req, res) => {
  try {
    const { title, content, tags, type, isAi, isEditorial, authorName, authorAvatar, mediaUrl: bodyMediaUrl, mediaType: bodyMediaType } = req.body;
    let mediaUrl = bodyMediaUrl || null;
    let mediaType = bodyMediaType || null;

    if (req.files && req.files.length > 0) {
      const files = req.files;
      const urls = files.map(file => `/uploads/${file.filename}`);
      
      // Determine media type from the first file's extension
      const firstExt = path.extname(files[0].originalname).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.avi'].includes(firstExt);
      mediaType = isVideo ? 'video' : 'image';

      if (isVideo) {
        // Enforce single video storage
        mediaUrl = urls[0];
      } else {
        // If multiple images, store as JSON array. Otherwise store as single string.
        mediaUrl = urls.length > 1 ? JSON.stringify(urls) : urls[0];
      }
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

// Sync Google OAuth User Details with SQLite
app.post('/api/users/sync', async (req, res) => {
  try {
    const { username, avatarUrl, bio, pronouns, email } = req.body;
    let user = null;

    if (email) {
      user = await User.findOne({ where: { email } });
    }

    if (!user) {
      // Fallback or find by username if email not recorded yet
      user = await User.findOne({ where: { username } });
    }

    if (!user) {
      // Check if the generated username is already in use by someone else
      let finalUsername = username;
      const taken = await User.findOne({ where: { username } });
      if (taken) {
        finalUsername = `${username}_${Math.floor(Math.random() * 1000)}`;
      }

      user = await User.create({
        username: finalUsername,
        email: email || null,
        avatarUrl: avatarUrl || '/avatars/default.png',
        bio: bio || 'Just entered the Lost Villa gates.',
        pronouns: pronouns || 'they/them'
      });
    } else {
      // If user exists but email is not yet saved, write it now
      if (email && !user.email) {
        user.email = email;
        await user.save();
      }
      // If user exists but still has default avatar, sync it with Google's high-res avatar
      if ((user.avatarUrl === '/avatars/default.png' || !user.avatarUrl) && avatarUrl) {
        user.avatarUrl = avatarUrl;
        await user.save();
      }
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get follow status of a guest profile
app.get('/api/users/:username/follow-status', async (req, res) => {
  try {
    const { follower } = req.query;
    if (!follower) return res.json({ isFollowing: false });

    const connection = await Follower.findOne({
      where: {
        followerName: follower,
        followingName: req.params.username
      }
    });

    res.json({ isFollowing: !!connection });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow a user
app.post('/api/users/:username/follow', async (req, res) => {
  try {
    const { followerName } = req.body;
    const followingName = req.params.username;

    if (followerName === followingName) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const existing = await Follower.findOne({ where: { followerName, followingName } });
    if (existing) {
      return res.json({ success: true, message: 'Already following' });
    }

    await Follower.create({ followerName, followingName });

    const followedUser = await User.findOne({ where: { username: followingName } });
    const followerUser = await User.findOne({ where: { username: followerName } });

    if (followedUser) {
      followedUser.followersCount += 1;
      await followedUser.save();
    }

    if (followerUser) {
      followerUser.followingCount += 1;
      await followerUser.save();
    }

    res.json({
      success: true,
      followersCount: followedUser ? followedUser.followersCount : 0,
      followingCount: followerUser ? followerUser.followingCount : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unfollow a user
app.post('/api/users/:username/unfollow', async (req, res) => {
  try {
    const { followerName } = req.body;
    const followingName = req.params.username;

    const deleted = await Follower.destroy({ where: { followerName, followingName } });
    if (deleted > 0) {
      const followedUser = await User.findOne({ where: { username: followingName } });
      const followerUser = await User.findOne({ where: { username: followerName } });

      if (followedUser && followedUser.followersCount > 0) {
        followedUser.followersCount -= 1;
        await followedUser.save();
      }

      if (followerUser && followerUser.followingCount > 0) {
        followerUser.followingCount -= 1;
        await followerUser.save();
      }

      res.json({
        success: true,
        followersCount: followedUser ? followedUser.followersCount : 0,
        followingCount: followerUser ? followerUser.followingCount : 0
      });
    } else {
      res.json({ success: false, error: 'Not following' });
    }
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
