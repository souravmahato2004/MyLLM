import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/db.js';
import { sendTransactionalEmail } from '../config/mailer.js';
import jwt from 'jsonwebtoken';
const { OAuth2Client } = await import('google-auth-library');

const client = new OAuth2Client();

const SALT_ROUNDS = 10;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || "";

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      res.status(400).json({ error: 'User already exists with this email' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert user into database as unverified
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified, verification_token) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, passwordHash, 'user', false, verificationToken]
    );

    // Send the verification email
    const verificationLink = `${FRONTEND_URL}/verify-email?code=${verificationToken}`;
    const emailHtml = `
      <h2>Welcome to NavQuill!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    `;

    sendTransactionalEmail(email, 'Verify Your NavQuill Account', emailHtml);

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. VERIFY EMAIL
export const verifyEmail = async (req: Request, res: Response) => {
  const { code } = req.query;

  try {
    // Find the user with this token and update their status in one query
    const result = await pool.query(
      `UPDATE users SET is_verified = true, verification_token = NULL 
       WHERE verification_token = $1 RETURNING id, email`,
      [code]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired verification link' });
      return;
    }

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 3. SIGN IN USER
export const signinUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = userCheck.rows[0];

    // Check if user is verified
    if (!user.is_verified) {
      res.status(401).json({ error: 'Please verify your email address' });
      return;
    }

    if (!user.password_hash) {
      res.status(401).json({ error: 'This account uses Google Sign-In. Please log in with Google.' });
      return;
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({ 
      access_token:token,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url
    });
  } catch (error) {
    console.error('Sign In Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleSignin = async (req: Request, res: Response) => {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  try{
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const {name, email, picture, sub} = payload || {};

    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    let user;
    
    if(userResult.rows.length === 0){
       const newUser = await pool.query(`INSERT INTO users (name, email, role, is_verified, auth_provider, google_id, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, email, 'user', true, 'google', sub, picture]
      );
      user = newUser.rows[0];
    }else{
      user = userResult.rows[0];
      if(!user.google_id){
        const updateUser = await pool.query(`UPDATE users SET google_id = $1, is_verified = true, avatar_url = $2 WHERE id = $3 RETURNING *`,
          [sub, picture, user.id]
        );
        user = updateUser.rows[0];
      }
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      access_token: token,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url
    });
  }catch(error){
    console.error('Google Sign-In Error:', error);
    res.status(500).json({ error: 'Google Authentication Failed' });
  }
}

export const sendForgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  
  try{
    if(!email){
      res.status(400).json({error: 'Email is required'});
      return;
    }
    const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if(userResult.rows.length === 0){
      res.status(404).json({error: 'Email is not registered'});
      return;
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    // Send the verification email
    const verificationLink = `${FRONTEND_URL}/reset-password?code=${resetToken}`;
    const emailHtml = `
      <h2>Welcome to NavQuill!</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    `;

    await pool.query(`UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3`,
      [resetToken, resetTokenExpiry, email]
    );
    sendTransactionalEmail(email, 'Reset Your NavQuill Password', emailHtml);
    res.status(200).json({message: 'Password reset email sent. Please check your inbox.'});

  }catch(error){
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  const { code, newPassword } = req.body;

  try{
    if(!code || !newPassword){
      res.status(400).json({error: 'Code and new password are required'});
      return;
    }
    const userResult = await pool.query(`SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()`, [code]);
    const user= userResult.rows[0];
    if(userResult.rows.length === 0){
      res.status(400).json({error: 'Invalid or expired reset token'});
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(`UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2`, 
      [passwordHash, user.id]
    );
    res.status(200).json({message: 'Password reset successful. You can now log in with your new password.'});
  }catch(error){
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}