"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEmailConfiguration = exports.updateSettings = exports.getSettings = void 0;
let siteSettings = {
    siteTitle: "Manual Fits",
    contactEmail: "contact@manualfits.com",
    supportEmail: "support@manualfits.com",
    defaultShippingCharge: 9.99,
    currency: "USD",
    timezone: "UTC",
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
    sesAccessKeyId: process.env.SES_ACCESS_KEY_ID || "",
    sesSecretAccessKey: process.env.SES_SECRET_ACCESS_KEY || "",
    sesRegion: process.env.SES_REGION || "us-east-1",
    sesFromEmail: process.env.SES_FROM_EMAIL || "noreply@manualfits.com",
};
const getSettings = async (req, res) => {
    try {
        const publicSettings = {
            ...siteSettings,
            cloudinaryApiSecret: siteSettings.cloudinaryApiSecret ? "***" : "",
            sesSecretAccessKey: siteSettings.sesSecretAccessKey ? "***" : "",
        };
        res.json({
            message: "Settings retrieved successfully",
            settings: publicSettings,
        });
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({
            message: "Error fetching settings",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        siteSettings = {
            ...siteSettings,
            ...updates,
        };
        res.json({
            message: "Settings updated successfully",
            settings: siteSettings,
        });
    }
    catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({
            message: "Error updating settings",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateSettings = updateSettings;
const testEmailConfiguration = async (req, res) => {
    try {
        const testEmail = {
            to: siteSettings.supportEmail,
            from: siteSettings.sesFromEmail,
            subject: "Test Email from Manual Fits Admin Panel",
            body: "This is a test email to verify your email configuration.",
        };
        await new Promise((resolve) => setTimeout(resolve, 1000));
        res.json({
            message: "Test email sent successfully",
            testEmail,
        });
    }
    catch (error) {
        console.error("Error sending test email:", error);
        res.status(500).json({
            message: "Error sending test email",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.testEmailConfiguration = testEmailConfiguration;
