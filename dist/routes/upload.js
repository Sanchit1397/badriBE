"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authz_1 = require("../middleware/authz");
const uploadController_1 = require("../controllers/uploadController");
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
router.post('/image', authz_1.requireAdmin, upload.single('file'), (req, res, next) => {
    Promise.resolve((0, uploadController_1.uploadImage)(req, res)).catch(next);
});
exports.default = router;
