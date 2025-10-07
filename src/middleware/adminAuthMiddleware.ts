import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin";

interface AdminRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

export const adminAuth = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Admin not found or inactive" });
    }

    req.admin = {
      id: admin._id.toString(),
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    if (
      req.admin.role === "super_admin" ||
      req.admin.permissions.includes(permission)
    ) {
      next();
    } else {
      res.status(403).json({ message: "Insufficient permissions" });
    }
  };
};
