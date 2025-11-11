import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface ProductImage {
  hash: string;
  alt?: string;
  primary?: boolean;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discount?: { type: 'percentage' | 'fixed'; value: number; active: boolean };
  images: ProductImage[];
  categoryId: Types.ObjectId;
  published: boolean;
  seo?: { title?: string; description?: string };
  inventory?: { track: boolean; stock: number };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed']
      },
      value: { type: Number, min: 0 },
      active: { type: Boolean, default: false }
    },
    images: {
      type: [
        new Schema<ProductImage>(
          {
            hash: { type: String, required: true },
            alt: { type: String },
            primary: { type: Boolean, default: false }
          },
          { _id: false }
        )
      ],
      default: []
    },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    published: { type: Boolean, default: false, index: true },
    seo: {
      title: { type: String },
      description: { type: String }
    },
    inventory: {
      track: { type: Boolean, default: false },
      stock: { type: Number, default: 0, min: 0 }
    }
  },
  { timestamps: true }
);

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);


