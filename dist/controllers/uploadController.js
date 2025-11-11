"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const errors_1 = require("../lib/errors");
const Media_1 = require("../models/Media");
async function uploadImage(req, res) {
    const file = req.file;
    if (!file)
        throw errors_1.errors.badRequest('No file uploaded');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype))
        throw errors_1.errors.badRequest('Unsupported file type');
    if (file.size > 5 * 1024 * 1024)
        throw errors_1.errors.badRequest('File too large');
    const hash = crypto_1.default.createHash('sha256').update(file.buffer).digest('hex');
    await Media_1.Media.updateOne({ hash }, { $setOnInsert: { filename: file.originalname, mimeType: file.mimetype, size: file.size } }, { upsert: true });
    const uploadRoot = path_1.default.resolve(process.cwd(), 'uploads');
    await promises_1.default.mkdir(uploadRoot, { recursive: true });
    const abs = path_1.default.join(uploadRoot, hash);
    try {
        await promises_1.default.access(abs);
    }
    catch {
        await promises_1.default.writeFile(abs, file.buffer);
    }
    return res.status(201).json({ hash });
}
