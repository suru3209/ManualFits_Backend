import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name?: string;
        email?: string;
        profilePic?: string;
        role?: string;
      };
      admin?: {
        id: string;
        username: string;
        role: string;
        permissions: string[];
      };
    }
  }
}
