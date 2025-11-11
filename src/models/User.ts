import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpiresAt?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: false, unique: true, sparse: true },
    address: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    isVerified: { type: Boolean, default: false, index: true },
    verificationToken: { type: String, required: false, index: true },
    verificationTokenExpiresAt: { type: Date, required: false },
    resetPasswordToken: { type: String, required: false, index: true },
    resetPasswordExpiresAt: { type: Date, required: false }
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);


