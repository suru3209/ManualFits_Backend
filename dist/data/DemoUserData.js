"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoOrdersData = exports.DemoUserData = void 0;
exports.DemoUserData = {
    _id: "507f1f77bcf86cd799439011",
    username: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    phone: "+91 98765 43210",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    dob: "1995-06-15T00:00:00.000Z",
    gender: "Male",
    addresses: [
        {
            address_id: "507f1f77bcf86cd799439012",
            type: "Home",
            name: "John Doe",
            phone: "+91 98765 43210",
            street: "123 Main Street, Apartment 4B",
            city: "Mumbai",
            state: "Maharashtra",
            zip: "400001",
            country: "India",
            is_default: true,
        },
        {
            address_id: "507f1f77bcf86cd799439013",
            type: "Work",
            name: "John Doe",
            phone: "+91 98765 43210",
            street: "456 Business Park, Floor 2",
            city: "Mumbai",
            state: "Maharashtra",
            zip: "400002",
            country: "India",
            is_default: false,
        },
    ],
    saved_payments: {
        upi: [
            {
                upi_id: "john.doe@paytm",
                name: "John Doe",
                is_default: true,
            },
            {
                upi_id: "9876543210@ybl",
                name: "John Doe",
                is_default: false,
            },
        ],
        cards: [
            {
                card_id: "507f1f77bcf86cd799439014",
                card_type: "Credit",
                brand: "Visa",
                last4: "1234",
                expiry_month: 12,
                expiry_year: 2025,
                cardholder_name: "John Doe",
                is_default: true,
                token: "tok_visa_1234",
            },
            {
                card_id: "507f1f77bcf86cd799439015",
                card_type: "Debit",
                brand: "MasterCard",
                last4: "5678",
                expiry_month: 8,
                expiry_year: 2026,
                cardholder_name: "John Doe",
                is_default: false,
                token: "tok_mc_5678",
            },
        ],
        gift_cards: [
            {
                giftcard_id: "507f1f77bcf86cd799439016",
                code: "GIFT2024ABC123",
                balance: 500,
                expiry_date: "2024-12-31T23:59:59.000Z",
                is_active: true,
            },
            {
                giftcard_id: "507f1f77bcf86cd799439017",
                code: "WELCOME50XYZ789",
                balance: 250,
                expiry_date: "2024-06-30T23:59:59.000Z",
                is_active: true,
            },
        ],
    },
    created_at: "2024-01-15T10:30:00.000Z",
    updated_at: "2024-01-20T14:45:00.000Z",
};
exports.DemoOrdersData = [
    {
        id: "ORD-2024-001",
        date: "2024-01-20",
        total: 2499,
        status: "Delivered",
    },
    {
        id: "ORD-2024-002",
        date: "2024-01-18",
        total: 1299,
        status: "Shipped",
    },
    {
        id: "ORD-2024-003",
        date: "2024-01-15",
        total: 899,
        status: "Pending",
    },
];
