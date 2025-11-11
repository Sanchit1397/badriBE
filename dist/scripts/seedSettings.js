"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSettings = seedSettings;
const mongoose_1 = __importDefault(require("mongoose"));
const Setting_1 = require("../models/Setting");
const logger_1 = require("../lib/logger");
const defaultSettings = [
    // Checkout Settings
    {
        key: 'minimum_order_value',
        value: 0,
        type: 'number',
        category: 'checkout',
        label: 'Minimum Order Value (₹)',
        description: 'Minimum cart subtotal required for checkout (excluding delivery fee). Set to 0 to disable.',
        editable: true
    },
    {
        key: 'max_items_per_order',
        value: 50,
        type: 'number',
        category: 'checkout',
        label: 'Maximum Items Per Order',
        description: 'Maximum number of items allowed in a single order',
        editable: true
    },
    // Delivery Settings
    {
        key: 'delivery_base_fee',
        value: 50,
        type: 'number',
        category: 'delivery',
        label: 'Base Delivery Fee (₹)',
        description: 'Standard delivery charge for all orders',
        editable: true
    },
    {
        key: 'free_delivery_threshold',
        value: 500,
        type: 'number',
        category: 'delivery',
        label: 'Free Delivery Above (₹)',
        description: 'Cart value above which delivery is free. Set to 0 to disable free delivery.',
        editable: true
    },
    {
        key: 'estimated_delivery_time',
        value: '30-45 minutes',
        type: 'string',
        category: 'delivery',
        label: 'Estimated Delivery Time',
        description: 'Default delivery time estimate shown to customers',
        editable: true
    },
    // Fee Settings
    {
        key: 'surge_fee_enabled',
        value: false,
        type: 'boolean',
        category: 'fees',
        label: 'Enable Surge Pricing',
        description: 'Charge extra during high-demand periods',
        editable: true
    },
    {
        key: 'surge_fee_percentage',
        value: 20,
        type: 'number',
        category: 'fees',
        label: 'Surge Fee Percentage (%)',
        description: 'Additional charge percentage during surge hours',
        editable: true
    },
    {
        key: 'late_night_fee_enabled',
        value: false,
        type: 'boolean',
        category: 'fees',
        label: 'Enable Late Night Fee',
        description: 'Charge extra for late night orders',
        editable: true
    },
    {
        key: 'late_night_fee',
        value: 30,
        type: 'number',
        category: 'fees',
        label: 'Late Night Fee (₹)',
        description: 'Additional charge for late night orders',
        editable: true
    },
    {
        key: 'late_night_start_hour',
        value: 22,
        type: 'number',
        category: 'fees',
        label: 'Late Night Start Hour',
        description: 'Hour when late night fee starts (24-hour format)',
        editable: true
    },
    {
        key: 'late_night_end_hour',
        value: 6,
        type: 'number',
        category: 'fees',
        label: 'Late Night End Hour',
        description: 'Hour when late night fee ends (24-hour format)',
        editable: true
    },
    // Business Settings
    {
        key: 'store_name',
        value: 'BadrikiDukan',
        type: 'string',
        category: 'business',
        label: 'Store Name',
        description: 'Your store name displayed to customers',
        editable: true
    },
    {
        key: 'store_phone',
        value: '',
        type: 'string',
        category: 'business',
        label: 'Store Phone Number',
        description: 'Customer support phone number',
        editable: true
    },
    {
        key: 'store_email',
        value: '',
        type: 'string',
        category: 'business',
        label: 'Store Email',
        description: 'Customer support email address',
        editable: true
    },
    {
        key: 'store_address',
        value: '',
        type: 'string',
        category: 'business',
        label: 'Store Address',
        description: 'Physical store address',
        editable: true
    },
    // Loyalty Settings (Future Use)
    {
        key: 'loyalty_points_enabled',
        value: false,
        type: 'boolean',
        category: 'loyalty',
        label: 'Enable Loyalty Points',
        description: 'Reward customers with points for purchases',
        editable: true
    },
    {
        key: 'loyalty_points_per_100',
        value: 1,
        type: 'number',
        category: 'loyalty',
        label: 'Points Per ₹100 Spent',
        description: 'How many points customers earn per ₹100 spent',
        editable: true
    },
    {
        key: 'loyalty_points_value',
        value: 1,
        type: 'number',
        category: 'loyalty',
        label: 'Point Value (₹)',
        description: 'How much each loyalty point is worth in rupees',
        editable: true
    },
    // Email Notification Settings
    {
        key: 'email_notifications_enabled',
        value: true,
        type: 'boolean',
        category: 'notifications',
        label: 'Enable Email Notifications',
        description: 'Master toggle for all email notifications. Turn off to disable all emails.',
        editable: true
    },
    {
        key: 'email_order_confirmation_enabled',
        value: true,
        type: 'boolean',
        category: 'notifications',
        label: 'Order Confirmation Emails',
        description: 'Send confirmation email to customer when order is placed',
        editable: true
    },
    {
        key: 'email_order_status_update_enabled',
        value: true,
        type: 'boolean',
        category: 'notifications',
        label: 'Order Status Update Emails',
        description: 'Notify customers when order status changes (shipped, delivered)',
        editable: true
    },
    {
        key: 'email_admin_new_order_enabled',
        value: true,
        type: 'boolean',
        category: 'notifications',
        label: 'Admin New Order Alerts',
        description: 'Notify admin when a new order is placed',
        editable: true
    },
    {
        key: 'email_low_stock_enabled',
        value: true,
        type: 'boolean',
        category: 'notifications',
        label: 'Low Stock Alerts',
        description: 'Notify admin when products are running low on stock',
        editable: true
    },
    {
        key: 'admin_notification_email',
        value: '',
        type: 'string',
        category: 'notifications',
        label: 'Admin Notification Email',
        description: 'Email address to receive admin notifications (new orders, low stock alerts)',
        editable: true
    },
    {
        key: 'low_stock_threshold',
        value: 5,
        type: 'number',
        category: 'notifications',
        label: 'Low Stock Threshold',
        description: 'Send alert when product stock falls below this number',
        editable: true
    }
];
async function seedSettings() {
    try {
        logger_1.logger.info('seedSettings:start');
        // Connect to MongoDB if not already connected
        if (mongoose_1.default.connection.readyState === 0) {
            const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
            const MONGODB_DB = process.env.MONGODB_DB || 'badrikidukan';
            await mongoose_1.default.connect(`${MONGODB_URI}/${MONGODB_DB}`);
            logger_1.logger.info('seedSettings:connected to MongoDB');
        }
        let created = 0;
        let skipped = 0;
        for (const settingData of defaultSettings) {
            const existing = await Setting_1.Setting.findOne({ key: settingData.key });
            if (existing) {
                logger_1.logger.info({ key: settingData.key }, 'seedSettings:alreadyExists');
                skipped++;
            }
            else {
                await Setting_1.Setting.create(settingData);
                logger_1.logger.info({ key: settingData.key }, 'seedSettings:created');
                created++;
            }
        }
        logger_1.logger.info({ created, skipped, total: defaultSettings.length }, 'seedSettings:complete');
        console.log(`\n✅ Settings seeding complete!`);
        console.log(`   Created: ${created}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${defaultSettings.length}\n`);
    }
    catch (error) {
        logger_1.logger.error({ error }, 'seedSettings:error');
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
