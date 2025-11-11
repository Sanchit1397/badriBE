"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Setting = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SettingSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    value: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    },
    type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'json'],
        required: true
    },
    category: {
        type: String,
        enum: ['checkout', 'delivery', 'fees', 'loyalty', 'business', 'notifications'],
        required: true,
        index: true
    },
    label: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    editable: {
        type: Boolean,
        default: true
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });
// Ensure value matches type before saving
SettingSchema.pre('save', function (next) {
    const setting = this;
    // Type validation
    if (setting.type === 'number' && typeof setting.value !== 'number') {
        return next(new Error(`Setting ${setting.key} must be a number`));
    }
    if (setting.type === 'boolean' && typeof setting.value !== 'boolean') {
        return next(new Error(`Setting ${setting.key} must be a boolean`));
    }
    if (setting.type === 'string' && typeof setting.value !== 'string') {
        return next(new Error(`Setting ${setting.key} must be a string`));
    }
    next();
});
exports.Setting = mongoose_1.default.models.Setting || mongoose_1.default.model('Setting', SettingSchema);
