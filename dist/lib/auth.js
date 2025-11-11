"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function hashPassword(plain) {
    const saltRounds = 10;
    return bcrypt_1.default.hash(plain, saltRounds);
}
async function verifyPassword(plain, hash) {
    return bcrypt_1.default.compare(plain, hash);
}
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('Missing JWT_SECRET');
    return secret;
}
async function signJwt(payload) {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), { algorithm: 'HS256', expiresIn: '7d' });
}
async function verifyJwt(token) {
    try {
        return jsonwebtoken_1.default.verify(token, getJwtSecret());
    }
    catch {
        return null;
    }
}
