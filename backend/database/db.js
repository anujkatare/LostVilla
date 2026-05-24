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

  const postCount = await Post.count();
  if (postCount === 0) {
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

    // Seeding "For You" Section (Editorial posts by admin)
    await Post.bulkCreate([
      {
        title: 'The Wendigo: Insatiable Hunger of the Frozen Wilderness',
        content: 'An ancient malevolent spirit originating from the Algonquian traditional belief system. It is a creature born of human cannibalism during brutal winter famines. Descriptions characterize the Wendigo as a tall, skeletal giant with skin pulled tight over its bones, eyes buried deep in sockets, emitting a sickening stench of decay. It wanders freezing northern woodlands, endlessly seeking fresh flesh, but each meal only causes it to grow in size, rendering its hunger eternally unappeased.',
        mediaUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80',
        mediaType: 'image',
        tags: 'cryptid,forest,legend,folklore',
        type: 'info',
        isAi: false,
        isEditorial: true,
        likes: 134,
        authorName: admin.username,
        authorAvatar: admin.avatarUrl
      },
      {
        title: 'Skinwalkers: The Taboo Shapeshifters of the Southwest',
        content: 'Known in Navajo folklore as the *yee naaldlooshii*, meaning "with it, he goes on all fours." The Skinwalker represents a powerful medicine man or witch who has corrupted sacred arts to acquire the ability to transform into, or possess, animals—frequently coyotes, wolves, owls, or cougars. Traditional lore advises never to make eye contact with them, nor speak their name aloud after dusk, as they are drawn to dread and can replicate human voices perfectly to lure their prey into the night.',
        mediaUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
        mediaType: 'image',
        tags: 'witchcraft,shapeshifter,desert,navajo',
        type: 'info',
        isAi: false,
        isEditorial: true,
        likes: 89,
        authorName: admin.username,
        authorAvatar: admin.avatarUrl
      },
      {
        title: 'The Mothman of Point Pleasant: Harbinger of Tragedy',
        content: 'First sighted in November 1966 in the TNT area near Point Pleasant, West Virginia, the Mothman is described as a man-sized creature with large, folded, feather-like wings and massive, glowing red eyes anchored directly in its chest. For over a year, residents reported terrifying fly-bys and sudden electrical disruptions. The sightings culminated on December 15, 1967, with the catastrophic collapse of the Silver Bridge, which claimed 46 lives, leading many to believe the creature is an omen of doom.',
        mediaUrl: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&auto=format&fit=crop&q=80',
        mediaType: 'image',
        tags: 'cryptid,urban-legend,tragedy,omen',
        type: 'info',
        isAi: false,
        isEditorial: true,
        likes: 211,
        authorName: admin.username,
        authorAvatar: admin.avatarUrl
      },
      {
        title: 'Classification Matrix: Shadow People & Dark Entities',
        content: 'Shadow entities are divided into three recognized classes: 1. The Looming Silhouette (standard human-shaped shadow, holds static positions in corners), 2. The Hooded Lurker (wears a dark cowl, displays active curiosity and moves swiftly when detected), and 3. The Hat Man (wears a wide-brimmed fedora, feeds off intense sleep paralysis, and displays absolute hostility). If encountered, avoid showing panic, as panic acts as an immediate energetic accelerant.',
        mediaUrl: 'https://images.unsplash.com/photo-1502481851512-e9e2529beff9?w=600&auto=format&fit=crop&q=80',
        mediaType: 'image',
        tags: 'entities,guide,shadows,sleep-paralysis',
        type: 'info',
        isAi: false,
        isEditorial: true,
        likes: 176,
        authorName: admin.username,
        authorAvatar: admin.avatarUrl
      }
    ]);

    // Seeding "Feed" Section (Community stories)
    await Post.bulkCreate([
      {
        title: 'My Reflection Smiled Back at Me—Slightly Out of Sync',
        content: 'I live alone in a small apartment. Last night, around 2:00 AM, I went to the bathroom to splash cold water on my face. As I stood up and wiped my eyes, I looked into the mirror. My reflection was staring back, which was fine. But then I turned my head to grab the towel. Out of the corner of my eye, I saw my reflection remain completely static. It did not turn. It just slowly stood there, and then gave me a wide, toothy grin that reached its temples. I haven\'t looked in a mirror all day.',
        mediaUrl: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=600&auto=format&fit=crop&q=80',
        mediaType: 'image',
        tags: 'story,creepypasta,mirror,paranormal',
        type: 'story',
        isAi: false,
        isEditorial: false,
        likes: 42,
        authorName: user1.username,
        authorAvatar: user1.avatarUrl
      },
      {
        title: 'Cursed Radio Signals on Route 9',
        content: 'I work long-haul trucking. Last night I was driving through the pitch-black fields of Route 9 in Nebraska. The radio static suddenly died down, and a strange channel started broadcasting. It wasn\'t music or news—just a flat, synthesized voice repeating coordinate coordinates, followed by what sounded like my name and a timestamp for tomorrow night. I checked the dash, and the radio dials were rapidly spinning backward on their own. I turned off the truck\'s power, but the voice kept coming out of the dead speakers.',
        mediaUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=600&auto=format&fit=crop&q=80',
        mediaType: 'image',
        tags: 'story,highway,radio,creepy',
        type: 'story',
        isAi: false,
        isEditorial: false,
        likes: 56,
        authorName: user2.username,
        authorAvatar: user2.avatarUrl
      },
      {
        title: 'The Tapping in the Attic',
        content: 'Every night at precisely 3:14 AM, the tapping starts. *Tap. Tap. Tap-tap-tap.* It sounds like fingernails running along the ceiling directly above my bed. The weird thing is, my house doesn\'t have an attic. It\'s a flat-roofed modern build. Yesterday, I took a ladder out to check the roof, thinking it was birds or a tree branch. The black gravel on the roof was completely undisturbed, except for a single set of bare, thin, four-toed footprints starting in the very center of the roof and disappearing off the edge.',
        mediaUrl: 'https://images.unsplash.com/photo-1505705694340-019e1e335916?w=600&auto=format&fit=crop&q=80',
        mediaType: 'image',
        tags: 'story,haunted,footprints,nightmare',
        type: 'story',
        isAi: false,
        isEditorial: false,
        likes: 31,
        authorName: user1.username,
        authorAvatar: user1.avatarUrl
      }
    ]);

    // Seed some initial messages
    await Message.bulkCreate([
      {
        senderName: 'GhostChaser42',
        senderAvatar: user1.avatarUrl,
        roomName: 'public',
        text: 'Hello survivors! Has anyone ever explored the tunnels underneath the old sanitarium?'
      },
      {
        senderName: 'WitchyVibes',
        senderAvatar: user2.avatarUrl,
        roomName: 'public',
        text: 'Yes! They are extremely active. Bring iron and keep your salt circle intact, the residual shadows there are highly territorial.'
      },
      {
        senderName: 'KeeperOfTheVilla',
        senderAvatar: admin.avatarUrl,
        roomName: 'public',
        text: 'Welcome to the Lost Villa. Share your encounters, but guard your soul.'
      }
    ]);

    console.log('Spooky seed data successfully planted.');
  } else {
    console.log('Database already exists with content. Upgrading legacy schema records...');
    await Post.update({ type: 'info' }, { where: { isEditorial: true } });
  }
}
