import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/db";
import { authenticateToken } from "../middleware/auth";
import nodemailer from "nodemailer";
const crypto = require("crypto");

const router = Router();

interface User {
  id: number;
  email: string;
  password_hash: string;
  username: string;
  reset_token?: string;
  reset_token_expires?: Date;
}

interface RegisterRequest {
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587, // Replace with your SMTP port
  secure: false, // or 'STARTTLS'
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Get current user
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const result = await query<User>(
        "SELECT id, email, username FROM users WHERE id = $1",
        [req.user.userId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const user = result.rows[0];
      res.json({
        user: { id: user.id, email: user.email, username: user.username },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/register",
  async (
    req: Request<{}, {}, RegisterRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await query<User>(
        "SELECT * FROM users WHERE email = $1",
        [email],
      );

      if (existingUser.rows.length > 0) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user with email as username
      const result = await query<User>(
        "INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username",
        [email, passwordHash, email],
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" },
      );

      res.status(201).json({
        user: { id: user.id, email: user.email, username: user.username },
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/login",
  async (
    req: Request<{}, {}, LoginRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user
      const result = await query<User>("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (result.rows.length === 0) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const user = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" },
      );

      res.json({
        user: { id: user.id, email: user.email, username: user.username },
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/password-reset/request",
  async (
    req: Request<{}, {}, { email: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email } = req.body;

      // Find user by email
      const result = await query<User>(
        "SELECT id, email FROM users WHERE email = $1",
        [email],
      );

      if (result.rows.length === 0) {
        res.status(400).json({ error: "User not found with this email" });
        return;
      }

      const user = result.rows[0];

      // Generate reset token (cryptographically secure)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date();
      tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 30); // Token valid for 30 minutes

      // Update user with reset token and expiry
      await query<User>(
        "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
        [resetToken, tokenExpiry, user.id],
      );

      // Send email with reset link
      const resetLink = `${req.headers.origin}/reset-password?token=${resetToken}`;

      await transporter.sendMail({
        from: "info@codescribble.com", // Replace with your email
        to: user.email,
        subject: "Password Reset Request",
        text: `Please reset your password by clicking this link: ${resetLink}`,
        html: `<p>Please reset your password by clicking this link: <a href="${resetLink}">${resetLink}</a></p>`,
      });

      res
        .status(200)
        .json({ message: "Password reset email has been sent successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/password-reset/reset",
  async (
    req: Request<{}, {}, { token: string; newPassword: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      if (!token) {
        res.status(400).json({ error: "Reset token is required" });
        return;
      }
      if (newPassword === "") {
        res.status(400).json({ error: "New password is required" });
        return;
      }
      // Find user by reset token
      const result = await query<User>(
        "SELECT id, reset_token, reset_token_expires FROM users WHERE reset_token = $1",
        [token],
      );
      if (result.rows.length === 0) {
        res.status(400).json({ error: "Invalid or expired reset link" });
        return;
      }
      const user = result.rows[0];
      // Check if token has expired
      if (user.reset_token_expires && new Date() > user.reset_token_expires) {
        res.status(400).json({ error: "Reset link has expired" });
        return;
      }
      // Verify token by direct comparison
      if (token !== user.reset_token) {
        res.status(400).json({ error: "Invalid reset token" });
        return;
      }
      // Update user password
      const salt = await bcrypt.genSalt(10);
      console.log(newPassword, salt);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      await query(
        "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
        [passwordHash, user.id],
      );
      res.status(200).json({ message: "Password has been successfully reset" });
    } catch (error) {
      console.error("Error in password reset:", error);
      next(error);
    }
  },
);
export const authRouter = router;
