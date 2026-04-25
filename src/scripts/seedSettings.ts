import mongoose from 'mongoose';
import { seedMissingDefaultSettings } from '../services/settingsService';
import { logger } from '../lib/logger';

export async function seedSettings() {
  try {
    logger.info('seedSettings:start');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const MONGODB_DB = process.env.MONGODB_DB || 'badrikidukan';
      await mongoose.connect(`${MONGODB_URI}/${MONGODB_DB}`);
      logger.info('seedSettings:connected to MongoDB');
    }

    const { created, skipped, total } = await seedMissingDefaultSettings();

    logger.info({ created, skipped, total }, 'seedSettings:complete');
    
    console.log(`\n✅ Settings seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${total}\n`);

  } catch (error) {
    logger.error({ error }, 'seedSettings:error');
    console.error('❌ Error seeding settings:', error);
    throw error;
  }
}

// Allow running this script directly
if (require.main === module) {
  seedSettings()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

