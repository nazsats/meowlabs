import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Discord Bot configuration
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

// NFT role thresholds (must match app/lib/discord.ts)
const NFT_ROLE_THRESHOLDS = {
  'Meowgaverse OG': { id: '1394315298550579240', threshold: 20 },
  'Prime Pouncer': { id: '1394315521922568326', threshold: 10 },
  'Big Whisker': { id: '1394315707856060418', threshold: 5 },
  'Solo Purr': { id: '1394315844116545637', threshold: 1 },
};

async function assignDiscordRole(userId, roleName) {
  const role = Object.values(NFT_ROLE_THRESHOLDS).find(r => r.id === roleName || Object.keys(NFT_ROLE_THRESHOLDS).find(key => NFT_ROLE_THRESHOLDS[key].id === roleName));
  if (!role) {
    console.error(`Role ${roleName} not found in NFT_ROLE_THRESHOLDS`);
    return false;
  }

  const roleId = role.id;
  const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log(`Successfully assigned role ${roleName} (ID: ${roleId}) to user ${userId}`);
      return true;
    } else {
      const errorData = await response.json();
      console.error(`Failed to assign role ${roleName} to user ${userId}: ${response.status} ${response.statusText}`, errorData);
      return false;
    }
  } catch (error) {
    console.error(`Error assigning role ${roleName} to user ${userId}:`, error);
    return false;
  }
}

async function processPendingRoles() {
  try {
    // Query Firestore for pending role assignments
    const q = query(collection(db, 'wallet-submissions'), where('roleStatus', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} pending role assignments`);

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const userId = docSnapshot.id;
      const roleName = data.nftBasedRoleName;

      if (!roleName) {
        console.warn(`No roleName found for user ${userId}, skipping`);
        continue;
      }

      console.log(`Processing user ${userId} with pending role ${roleName}`);

      // Assign role via Discord API
      const success = await assignDiscordRole(userId, roleName);

      if (success) {
        // Update Firestore to mark role as assigned
        await updateDoc(doc(db, 'wallet-submissions', userId), {
          roleStatus: 'assigned',
          updatedAt: new Date(),
        });
        console.log(`Updated Firestore for user ${userId}: roleStatus set to 'assigned'`);
      } else {
        console.warn(`Skipping Firestore update for user ${userId} due to failed role assignment`);
      }
    }
  } catch (error) {
    console.error('Error processing pending roles:', error);
  }
}

async function main() {
  if (!DISCORD_BOT_TOKEN || !GUILD_ID) {
    console.error('Missing environment variables: DISCORD_BOT_TOKEN and GUILD_ID must be set');
    process.exit(1);
  }

  console.log('Starting role assignment script...');
  await processPendingRoles();
  console.log('Role assignment script completed');
  process.exit(0);
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});