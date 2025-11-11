"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSignature = createSignature;
exports.signPath = signPath;
exports.verifySignature = verifySignature;
const crypto_1 = __importDefault(require("crypto"));
function getSigningSecret() {
    return process.env.MEDIA_SIGNING_SECRET || process.env.JWT_SECRET || 'dev_media_secret';
}
function createSignature(payload) {
    const h = crypto_1.default.createHmac('sha256', getSigningSecret());
    h.update(payload);
    return h.digest('hex');
}
function signPath(path, exp) {
    const payload = `${path}:${exp}`;
    const sig = createSignature(payload);
    return { exp, sig };
}
function verifySignature(path, exp, sig) {
    if (Date.now() > exp)
        return false;
    const expected = createSignature(`${path}:${exp}`);
    return crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
