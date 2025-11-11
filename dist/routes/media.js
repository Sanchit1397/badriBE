"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mediaController_1 = require("../controllers/mediaController");
const router = (0, express_1.Router)();
router.get('/sign/:hash', (req, res, next) => { Promise.resolve((0, mediaController_1.getSignedUrl)(req, res)).catch(next); });
router.get('/:hash', (req, res, next) => { Promise.resolve((0, mediaController_1.serveMedia)(req, res)).catch(next); });
exports.default = router;
