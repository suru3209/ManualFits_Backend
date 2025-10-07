import mongoose from "mongoose";

// Demo User Data for Dashboard Testing
export const createDemoUserData = async () => {
  const userId = new mongoose.Types.ObjectId();

  const demoUser = {
    _id: userId,
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    username: "suru",
    email: "suru@example.com",
    phone: "+91 9876543210",
    password: "qwer1234",
    dob: new Date("1990-05-15"),
    gender: "Male" as const,

    // Addresses
    addresses: [
      {
        address_id: new mongoose.Types.ObjectId(),
        type: "Home",
        name: "John Doe",
        phone: "+91 9876543210",
        street: "123 Main Street, Apartment 4B",
        city: "Mumbai",
        state: "Maharashtra",
        zip: "400001",
        country: "India",
        is_default: true,
      },
      {
        address_id: new mongoose.Types.ObjectId(),
        type: "Work",
        name: "John Doe",
        phone: "+91 9876543210",
        street: "456 Business Park, Floor 2",
        city: "Mumbai",
        state: "Maharashtra",
        zip: "400002",
        country: "India",
        is_default: false,
      },
    ],

    // Saved Payments
    saved_payments: {
      upi: [
        {
          upi_id: "john.doe@paytm",
          name: "John Doe",
          is_default: true,
        },
        {
          upi_id: "john.doe@ybl",
          name: "John Doe",
          is_default: false,
        },
      ],
      cards: [
        {
          card_id: new mongoose.Types.ObjectId(),
          card_type: "Credit",
          brand: "Visa",
          last4: "1234",
          expiry_month: 12,
          expiry_year: 2025,
          cardholder_name: "John Doe",
          is_default: true,
        },
        {
          card_id: new mongoose.Types.ObjectId(),
          card_type: "Debit",
          brand: "MasterCard",
          last4: "5678",
          expiry_month: 8,
          expiry_year: 2026,
          cardholder_name: "John Doe",
          is_default: false,
        },
      ],
      gift_cards: [
        {
          giftcard_id: new mongoose.Types.ObjectId(),
          code: "GIFT123456",
          balance: 500,
          expiry_date: new Date("2024-12-31"),
          is_active: true,
        },
        {
          giftcard_id: new mongoose.Types.ObjectId(),
          code: "GIFT789012",
          balance: 1000,
          expiry_date: new Date("2025-06-30"),
          is_active: true,
        },
      ],
    },

    // Cart Items
    cart: [
      {
        productId: new mongoose.Types.ObjectId(),
        quantity: 2,
        addedAt: new Date(),
      },
      {
        productId: new mongoose.Types.ObjectId(),
        quantity: 1,
        addedAt: new Date(),
      },
    ],

    // Wishlist Items
    wishlist: [
      {
        productId: new mongoose.Types.ObjectId(),
        addedAt: new Date(),
      },
      {
        productId: new mongoose.Types.ObjectId(),
        addedAt: new Date(),
      },
    ],

    created_at: new Date(),
    updated_at: new Date(),
  };

  return demoUser;
};

// Demo Orders Data
export const createDemoOrdersData = async (userId: mongoose.Types.ObjectId) => {
  return [
    {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 1500,
        },
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 2500,
        },
      ],
      totalAmount: 5500,
      status: "completed",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 3000,
        },
      ],
      totalAmount: 3000,
      status: "pending",
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20"),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 3,
          price: 800,
        },
      ],
      totalAmount: 2400,
      status: "cancelled",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
  ];
};

// Demo Wishlist with Product Details
export const createDemoWishlistData = async (
  userId: mongoose.Types.ObjectId
) => {
  return [
    {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      wishlist: [
        {
          productId: {
            _id: new mongoose.Types.ObjectId(),
            name: "Wireless Headphones",
            price: 2500,
            images: [
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
            ],
          },
          addedAt: new Date("2024-01-15"),
        },
        {
          productId: {
            _id: new mongoose.Types.ObjectId(),
            name: "Smart Watch",
            price: 15000,
            images: [
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
            ],
          },
          addedAt: new Date("2024-01-10"),
        },
        {
          productId: {
            _id: new mongoose.Types.ObjectId(),
            name: "Laptop Stand",
            price: 1200,
            images: [
              "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop",
            ],
          },
          addedAt: new Date("2024-01-05"),
        },
      ],
    },
  ];
};

// Demo Return/Replace Requests
export const createDemoReturnReplaceData = async (
  userId: mongoose.Types.ObjectId,
  orderId: mongoose.Types.ObjectId
) => {
  return [
    {
      _id: new mongoose.Types.ObjectId(),
      order: orderId,
      user: userId,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          reason: "Product damaged during shipping",
          quantity: 1,
        },
      ],
      type: "return",
      status: "requested",
      createdAt: new Date("2024-01-18"),
      updatedAt: new Date("2024-01-18"),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      order: orderId,
      user: userId,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          reason: "Wrong size received",
          quantity: 1,
        },
      ],
      type: "replace",
      status: "approved",
      createdAt: new Date("2024-01-12"),
      updatedAt: new Date("2024-01-12"),
    },
  ];
};

// Demo Cart Data
export const createDemoCartData = async (userId: mongoose.Types.ObjectId) => {
  return {
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    items: [
      {
        product: new mongoose.Types.ObjectId(),
        quantity: 2,
      },
      {
        product: new mongoose.Types.ObjectId(),
        quantity: 1,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Complete Demo Data Setup
export const setupDemoDashboardData = async () => {
  try {
    console.log("🚀 Setting up demo dashboard data...");

    const demoUser = await createDemoUserData();
    const demoOrders = await createDemoOrdersData(demoUser._id);
    const demoWishlist = await createDemoWishlistData(demoUser._id);
    const demoReturnReplace = await createDemoReturnReplaceData(
      demoUser._id,
      demoOrders[0]._id
    );
    const demoCart = await createDemoCartData(demoUser._id);

    return {
      user: demoUser,
      orders: demoOrders,
      wishlist: demoWishlist,
      returnReplace: demoReturnReplace,
      cart: demoCart,
    };
  } catch (error) {
    console.error("❌ Error setting up demo data:", error);
    throw error;
  }
};
