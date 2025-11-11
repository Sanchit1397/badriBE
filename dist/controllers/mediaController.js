"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedUrl = getSignedUrl;
exports.serveMedia = serveMedia;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const errors_1 = require("../lib/errors");
const signing_1 = require("../lib/signing");
async function getSignedUrl(req, res) {
    const hash = req.params.hash;
    if (!hash)
        throw errors_1.errors.badRequest('Missing hash');
    const ttlMs = Number(process.env.MEDIA_URL_TTL_MS || 24 * 60 * 60 * 1000);
    const filePath = `/media/${hash}`;
    const exp = Date.now() + ttlMs;
    const { sig } = (0, signing_1.signPath)(filePath, exp);
    const url = new URL(`/media/${hash}`, `${req.protocol}://${req.get('host')}`);
    url.searchParams.set('exp', String(exp));
    url.searchParams.set('sig', sig);
    return res.json({ url: url.toString(), exp });
}
async function serveMedia(req, res) {
    const hash = req.params.hash;
    const exp = Number(req.query.exp || 0);
    const sig = String(req.query.sig || '');
    const filePath = `/media/${hash}`;
    if (!(0, signing_1.verifySignature)(filePath, exp, sig))
        return res.status(403).send('Forbidden');
    const root = path_1.default.resolve(process.cwd(), 'uploads');
    const abs = path_1.default.join(root, hash);
    try {
        await promises_1.default.access(abs);
    }
    catch {
        return res.status(404).send('Not found');
    }
    return res.sendFile(abs);
}
