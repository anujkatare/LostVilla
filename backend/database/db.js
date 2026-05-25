import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'database.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

// User Schema
export const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'password123'
  },
  avatarUrl: {
    type: DataTypes.STRING,
    defaultValue: '/avatars/default.png'
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: 'Spooky wanderer in the Lost Villa.'
  },
  pronouns: {
    type: DataTypes.STRING,
    defaultValue: 'they/them'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  followersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Follower Schema (Join Table)
export const Follower = sequelize.define('Follower', {
  followerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  followingName: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Post Schema (Stories & Species)
export const Post = sequelize.define('Post', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mediaType: {
    type: DataTypes.STRING, // "image" or "video" or null
    allowNull: true
  },
  tags: {
    type: DataTypes.STRING, // Comma separated tags e.g. "cryptid,forest,legend"
    defaultValue: 'horror'
  },
  type: {
    type: DataTypes.STRING, // "info", "story", "fictional", "real incident"
    defaultValue: 'story',
    allowNull: false
  },
  isAi: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  isEditorial: {
    type: DataTypes.BOOLEAN, // true = For You (Holder posts), false = Feed (User posts)
    defaultValue: false
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Anonymous Ghost'
  },
  authorAvatar: {
    type: DataTypes.STRING,
    defaultValue: '/avatars/default.png'
  }
});

// Message Schema
export const Message = sequelize.define('Message', {
  senderName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderAvatar: {
    type: DataTypes.STRING,
    defaultValue: '/avatars/default.png'
  },
  roomName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

// Seed data to populate empty database
export async function initDb() {
  await sequelize.sync({ alter: true });

  const userCount = await User.count();
  if (userCount === 0) {
    console.log('Database empty. Seeding eerie records into Lost Villa database...');

    // Create default accounts
    const admin = await User.create({
      username: 'KeeperOfTheVilla',
      avatarUrl: 'https://images.unsplash.com/photo-1570158268183-d296b289020b?w=150&auto=format&fit=crop&q=80',
      bio: 'The permanent host and curator of Lost Villa. Seeking anomalies, cataloging nightmares.',
      pronouns: 'he/him'
    });

    const user1 = await User.create({
      username: 'GhostChaser42',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Exploring haunted psychiatric wards and cursed countrysides since 2018.',
      pronouns: 'they/them'
    });

    const user2 = await User.create({
      username: 'WitchyVibes',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      bio: 'Practicing herbalism and seeking stories of shadow people. Blessed be.',
      pronouns: 'she/her'
    });

    console.log('Database empty. Seeding admin credentials only...');
  } else {
    console.log('Database already exists with content.');
  }
}
