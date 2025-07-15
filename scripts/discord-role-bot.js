const { Client, GatewayIntentBits, PermissionsBitField, Colors } = require('discord.js');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc, setDoc } = require('firebase/firestore');

// Hardcoded configuration for development
const DISCORD_BOT_TOKEN = 'MTM1OTIwNDYwOTI1MTQ3OTgwMw.GPi2sJ.-GIkl5SgJk2N9d0Nl7u1Hg9hdF-Qcag2x5aKbM';
const DISCORD_GUILD_ID = '1270790896396275813';
const firebaseConfig = {
  apiKey: 'AIzaSyC668padzEobx0Py-rW3aS4fHOlAyvEavg',
  authDomain: 'catcents-app.firebaseapp.com',
  projectId: 'catcents-app',
  storageBucket: 'catcents-app.firebasestorage.app',
  messagingSenderId: '1002495574842',
  appId: '1:1002495574842:web:4a689a075d7bda2bb00603',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// Role definitions
const BADGE_ROLES = [
  { milestone: 500, name: 'Whisker Initiate', id: '1366405807398326324' },
  { milestone: 1000, name: 'Pawthfinder', id: '1366405809717772308' },
  { milestone: 2000, name: 'Claw Collector', id: '1366405811508744323' },
  { milestone: 5000, name: 'Yarnmaster', id: '1366405813190525008' },
  { milestone: 10000, name: 'Alley Alpha', id: '1366405815149396018' },
  { milestone: 50000, name: 'Shadow Stalker', id: '1366405817263460393' },
  { milestone: 100000, name: 'Furion Elite', id: '1366405819423395864' },
  { milestone: 500000, name: 'Mythic Pouncer', id: '1366405821206102046' },
  { milestone: 1000000, name: 'Catcents Legend', id: '1366405823080693860' },
];

const NFT_ROLES = [
  { threshold: 20, name: 'Meowgaverse OG', id: '1394315298550579240' },
  { threshold: 10, name: 'Prime Pouncer', id: '1394315521922568326' },
  { threshold: 5, name: 'Big Whisker', id: '1394315707856060418' },
  { threshold: 1, name: 'Solo Purr', id: '1394315844116545637' },
];

const OTHER_ROLES = [
  { name: 'Test Catlist Role', id: '1372582503407157368' },
];

const MANAGED_ROLES = [...BADGE_ROLES, ...NFT_ROLES, ...OTHER_ROLES];

/**
 * Retry a Discord API request with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise<any>}
 */
async function retryRequest(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.code === 'Ratelimit' || err.status === 429) {
        const retryAfter = err.headers?.['retry-after'] ? parseInt(err.headers['retry-after']) * 1000 : delay * Math.pow(2, i);
        console.log(`Rate limit hit, retrying after ${retryAfter}ms`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries reached');
}

// Cache for guild roles
let guildRoleCache = new Map();

/**
 * Ensure all managed roles exist in the guild
 * @param {Object} guild - Discord guild object
 * @returns {Promise<Map<string, Object>>} - Map of role names to role objects
 */
async function ensureGuildRoles(guild) {
  if (guildRoleCache.size > 0) return guildRoleCache;

  await retryRequest(async () => {
    const roles = await guild.roles.fetch();
    guildRoleCache = new Map(roles.map((role) => [role.name, role]));
  });

  for (const roleDef of MANAGED_ROLES) {
    if (!guildRoleCache.has(roleDef.name)) {
      try {
        const role = await retryRequest(() =>
          guild.roles.create({
            name: roleDef.name,
            color: Colors.Purple,
            reason: 'Created for Catcents role system',
            permissions: [],
          })
        );
        console.log(`Created role ${roleDef.name} in guild ${guild.name}`);
        guildRoleCache.set(roleDef.name, role);
      } catch (error) {
        console.error(`Failed to create role ${roleDef.name}:`, error.message);
      }
    }
  }

  return guildRoleCache;
}

/**
 * Sync roles for a single user
 * @param {Object} member - Discord guild member
 * @param {number[]} claimedBadges - Array of badge milestones
 * @param {string[]} discordRoles - Array of additional role IDs
 * @param {number} nftCount - Number of NFTs owned
 */
async function syncUserRoles(member, claimedBadges, discordRoles, nftCount) {
  try {
    const guild = member.guild;
    const rolesToAdd = [];
    const rolesToRemove = [];

    // Map claimed badge milestones to role names
    const badgeRoleNames = claimedBadges
      .map((milestone) => {
        const badge = BADGE_ROLES.find((b) => b.milestone === milestone);
        return badge ? badge.name : null;
      })
      .filter((name) => name);

    // Map discord roles (e.g., Test Catlist Role)
    const otherRoleNames = discordRoles
      .map((roleId) => {
        const role = OTHER_ROLES.find((r) => r.id === roleId);
        return role ? role.name : null;
      })
      .filter((name) => name);

    // Determine NFT-based role
    const nftRole = NFT_ROLES.find((r) => nftCount >= r.threshold);
    const nftRoleName = nftRole ? nftRole.name : null;

    // Combine all roles to assign
    const rolesToAssign = [...badgeRoleNames, ...otherRoleNames, ...(nftRoleName ? [nftRoleName] : [])];

    // Get guild roles
    const guildRoles = await ensureGuildRoles(guild);

    // Determine roles to add/remove
    for (const roleDef of MANAGED_ROLES) {
      const role = guildRoles.get(roleDef.name);
      if (!role) continue;

      // For NFT roles, only add the highest eligible role and remove others
      if (NFT_ROLES.some((r) => r.name === roleDef.name)) {
        if (roleDef.name === nftRoleName && !member.roles.cache.has(role.id)) {
          rolesToAdd.push(role);
        } else if (roleDef.name !== nftRoleName && member.roles.cache.has(role.id)) {
          rolesToRemove.push(role);
        }
      } else {
        // Handle badge and other roles
        if (rolesToAssign.includes(roleDef.name) && !member.roles.cache.has(role.id)) {
          rolesToAdd.push(role);
        } else if (!rolesToAssign.includes(roleDef.name) && member.roles.cache.has(role.id)) {
          rolesToRemove.push(role);
        }
      }
    }

    // Apply role changes
    if (rolesToAdd.length > 0) {
      await retryRequest(() => member.roles.add(rolesToAdd));
      console.log(`Added roles to ${member.user.tag}: ${rolesToAdd.map((r) => r.name).join(', ')}`);
    }

    if (rolesToRemove.length > 0) {
      await retryRequest(() => member.roles.remove(rolesToRemove));
      console.log(`Removed roles from ${member.user.tag}: ${rolesToRemove.map((r) => r.name).join(', ')}`);
    }

    if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
      console.log(`No role changes needed for ${member.user.tag}`);
    }
  } catch (error) {
    console.error(`Error syncing roles for ${member.user.tag}:`, error.message);
  }
}

/**
 * Sync roles for all users in Firestore
 */
async function syncAllUsers() {
  console.log('Syncing roles for all users...');
  try {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Found ${usersSnapshot.size} user entries in Firestore`);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const discordUsername = userData.discordUsername;
      const claimedBadges = userData.claimedBadges || [];
      const discordRoles = userData.discordRoles || [];

      if (!discordUsername) {
        console.log(`No Discord username for user ${userDoc.id}`);
        continue;
      }

      let discordMember = null;
      try {
        const members = await guild.members.fetch();
        discordMember = members.find(
          (m) => m.user.username === discordUsername || m.user.tag === discordUsername
        );
      } catch (error) {
        console.error(`Error fetching members in guild ${guild.id}:`, error.message);
        continue;
      }

      if (!discordMember) {
        console.log(`User ${discordUsername} not found in guild ${guild.id}`);
        continue;
      }

      // Fetch NFT count from wallets collection
      const walletDoc = doc(db, 'wallets', userDoc.id);
      const walletSnap = await getDoc(walletDoc);
      const nftCount = walletSnap.exists() ? walletSnap.data().nftCount || 0 : 0;

      await syncUserRoles(discordMember, claimedBadges, discordRoles, nftCount);
    }
    console.log('Role sync completed.');
  } catch (error) {
    console.error('Error syncing users:', error.message);
  }
}

// When the bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await syncAllUsers();
  // Sync every hour
  setInterval(syncAllUsers, 60 * 60 * 1000);
});

// Slash command to manually trigger role sync
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'syncroles') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({
        content: 'You need Manage Roles permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();
    await syncAllUsers();
    await interaction.editReply('Role sync completed for all users.');
  }
});

// Register slash command
client.on('ready', async () => {
  try {
    await client.application.commands.create({
      name: 'syncroles',
      description: 'Manually sync roles for all users based on Firebase data',
    });
    console.log('Registered /syncroles command');
  } catch (error) {
    console.error('Error registering slash command:', error.message);
  }
});

// Login to Discord
client.login(DISCORD_BOT_TOKEN).catch((error) => {
  console.error('Failed to login to Discord:', error.message);
  process.exit(1);
});