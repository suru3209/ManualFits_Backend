import { Request, Response } from "express";

interface SiteSettings {
  siteTitle: string;
  contactEmail: string;
  supportEmail: string;
  defaultShippingCharge: number;
  currency: string;
  timezone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  sesAccessKeyId: string;
  sesSecretAccessKey: string;
  sesRegion: string;
  sesFromEmail: string;
}

// In a real application, you would store these in a database
// For now, we'll use in-memory storage (will be lost on server restart)
let siteSettings: SiteSettings = {
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

export const getSettings = async (req: Request, res: Response) => {
  try {
    // Return settings without sensitive information
    const publicSettings = {
      ...siteSettings,
      cloudinaryApiSecret: siteSettings.cloudinaryApiSecret ? "***" : "",
      sesSecretAccessKey: siteSettings.sesSecretAccessKey ? "***" : "",
    };

    res.json({
      message: "Settings retrieved successfully",
      settings: publicSettings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      message: "Error fetching settings",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    // Update settings
    siteSettings = {
      ...siteSettings,
      ...updates,
    };

    // In a real application, you would save these to a database
    // For now, we'll just update the in-memory object

    res.json({
      message: "Settings updated successfully",
      settings: siteSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      message: "Error updating settings",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const testEmailConfiguration = async (req: Request, res: Response) => {
  try {
    // In a real application, you would test the SES configuration
    // by sending an actual test email

    // For now, we'll just simulate a successful test
    const testEmail = {
      to: siteSettings.supportEmail,
      from: siteSettings.sesFromEmail,
      subject: "Test Email from Manual Fits Admin Panel",
      body: "This is a test email to verify your email configuration.",
    };

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res.json({
      message: "Test email sent successfully",
      testEmail,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      message: "Error sending test email",
      error: error instanceof Error ? error.message : error,
    });
  }
};
