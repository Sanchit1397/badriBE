#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const stockMonitorService_1 = require("../services/stockMonitorService");
const logger_1 = require("../lib/logger");
/**
 * Manual script to test low stock alert emails
 *
 * Usage:
 *   npx ts-node src/scripts/testLowStock.ts
 */
async function testLowStockAlert() {
    try {
        logger_1.logger.info('testLowStock:connecting to MongoDB');
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not configured');
        }
        await mongoose_1.default.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB || 'badrikidukan'
        });
        logger_1.logger.info('testLowStock:connected');
        console.log('\n🔍 Checking for low stock products...\n');
        await (0, stockMonitorService_1.checkLowStockAndNotify)();
        console.log('\n✅ Low stock check complete!');
        console.log('   Check your backend logs for email preview URL (if using Ethereal)');
        console.log('   Or check admin email inbox (if configured)\n');
        await mongoose_1.default.disconnect();
        logger_1.logger.info('testLowStock:disconnected');
    }
    catch (error) {
        logger_1.logger.error({ error }, 'testLowStock:error');
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}
testLowStockAlert();
