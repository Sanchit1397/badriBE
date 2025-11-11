import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IMedia extends Document {
  hash: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    hash: { type: String, required: true, unique: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { timestamps: true }
);

export const Media: Model<IMedia> = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);


