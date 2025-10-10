import mongoose, { Schema, Document } from "mongoose";

export interface IAddress {
  address_id: mongoose.Types.ObjectId;
  type: string; // "Home", "Work"
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
}

export interface IUPI {
  upi_id: string;
  name: string;
  is_default: boolean;
}

export interface ICard {
  card_id: mongoose.Types.ObjectId;
  card_type: string; // Debit / Credit
  brand: string; // Visa, MasterCard, RuPay
  last4: string; // last 4 digits only
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  is_default: boolean;
  token?: string;
}

export interface IGiftCard {
  giftcard_id: mongoose.Types.ObjectId;
  code: string;
  balance: number;
  expiry_date: Date;
  is_active: boolean;
}

export interface IUser extends Document {
  image: String; // Cloudinary URL for user profile image
  cloudinaryPublicId?: String; // Store Cloudinary public ID for deletion
  username: string;
  email: string;
  phone: string;
  password: string;
  dob?: Date; // ✅ Date of Birth
  gender?: "Male" | "Female" | "Other"; // ✅ Gender
  isEmailVerified: boolean; // Email verification status
  otp?: string; // OTP for email verification
  otpExpiresAt?: Date; // OTP expiry time
  otpVerified?: boolean; // OTP verification status

  addresses: IAddress[];
  saved_payments: {
    upi: IUPI[];
    cards: ICard[];
    gift_cards: IGiftCard[];
  };

  cart: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    addedAt: Date;
  }>;

  wishlist: Array<{
    productId: mongoose.Types.ObjectId;
    addedAt: Date;
  }>;

  created_at: Date;
  updated_at: Date;
}

const AddressSchema = new Schema<IAddress>({
  address_id: { type: Schema.Types.ObjectId, auto: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  is_default: { type: Boolean, default: false },
});

const UPISchema = new Schema<IUPI>({
  upi_id: { type: String, required: true },
  name: { type: String, required: true },
  is_default: { type: Boolean, default: false },
});

const CardSchema = new Schema<ICard>({
  card_id: { type: Schema.Types.ObjectId, auto: true },
  card_type: String,
  brand: String,
  last4: String,
  expiry_month: Number,
  expiry_year: Number,
  cardholder_name: String,
  is_default: { type: Boolean, default: false },
  token: String,
});

const GiftCardSchema = new Schema<IGiftCard>({
  giftcard_id: { type: Schema.Types.ObjectId, auto: true },
  code: String,
  balance: Number,
  expiry_date: Date,
  is_active: { type: Boolean, default: true },
});

const UserSchema = new Schema<IUser>(
  {
    image: { type: String }, // Cloudinary URL for user profile image
    cloudinaryPublicId: { type: String }, // Store Cloudinary public ID for deletion
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String }, // ✅ Added phone (non-unique for now)
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    otpVerified: { type: Boolean },

    addresses: [AddressSchema],
    saved_payments: {
      upi: [UPISchema],
      cards: [CardSchema],
      gift_cards: [GiftCardSchema],
    },

    cart: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    wishlist: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
