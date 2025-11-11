#!/usr/bin/env ts-node
import 'dotenv/config';
import mongoose from 'mongoose';
import { checkLowStockAndNotify } from '../services/stockMonitorService';
import { logger } from '../lib/logger';

/**
 * Manual script to test low stock alert emails
 * 
 * Usage:
 *   npx ts-node src/scripts/testLowStock.ts
 */

async function testLowStockAlert() {
  try {
    logger.info('testLowStock:connecting to MongoDB');
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'badrikidukan'
    });
    
    logger.info('testLowStock:connected');

    console.log('\n🔍 Checking for low stock products...\n');
    
    await checkLowStockAndNotify();
    
    console.log('\n✅ Low stock check complete!');
    console.log('   Check your backend logs for email preview URL (if using Ethereal)');
    console.log('   Or check admin email inbox (if configured)\n');

    await mongoose.disconnect();
    logger.info('testLowStock:disconnected');
  } catch (error) {
    logger.error({ error }, 'testLowStock:error');
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testLowStockAlert();

