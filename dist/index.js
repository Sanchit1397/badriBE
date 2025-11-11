"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const adminOrders_1 = __importDefault(require("./routes/adminOrders"));
const adminSettings_1 = __importDefault(require("./routes/adminSettings"));
const catalog_1 = __importDefault(require("./routes/catalog"));
const upload_1 = __importDefault(require("./routes/upload"));
const media_1 = __importDefault(require("./routes/media"));
const orders_1 = __importDefault(require("./routes/orders"));
const profile_1 = __importDefault(require("./routes/profile"));
const errors_1 = require("./lib/errors");
const logger_1 = require("./lib/logger");
const requestId_1 = require("./middleware/requestId");
const settingsService_1 = require("./services/settingsService");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(requestId_1.requestIdMiddleware);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use((0, cors_1.default)({
    origin: FRONTEND_ORIGIN,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    // eslint-disable-next-line no-console
    console.error('Missing MONGODB_URI');
    process.exit(1);
}
mongoose_1.default
    .connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'badrikidukan' })
    .then(async () => {
    logger_1.logger.info('Connected to MongoDB');
    // Preload settings into cache on startup
    await (0, settingsService_1.preloadSettings)();
    logger_1.logger.info('Settings preloaded into cache');
})
    .catch((err) => {
    logger_1.logger.error({ err }, 'Mongo connection error');
    process.exit(1);
});
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', auth_1.default);
app.use('/admin', admin_1.default);
app.use('/admin/orders', adminOrders_1.default);
app.use('/admin/settings', adminSettings_1.default);
app.use('/catalog', catalog_1.default);
app.use('/upload', upload_1.default);
app.use('/media', media_1.default);
app.use('/orders', orders_1.default);
app.use('/profile', profile_1.default);
// Error handler last
app.use(errors_1.errorMiddleware);
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => logger_1.logger.info({ port: PORT }, 'API listening'));
