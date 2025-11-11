import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type SettingType = 'string' | 'number' | 'boolean' | 'json';
export type SettingCategory = 'checkout' | 'delivery' | 'fees' | 'loyalty' | 'business' | 'notifications';

export interface ISetting extends Document {
  key: string;
  value: string | number | boolean | object;
  type: SettingType;
  category: SettingCategory;
  label: string;
  description?: string;
  editable: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true
    },
    value: {
      type: Schema.Types.Mixed,
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
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

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

export const Setting: Model<ISetting> = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

