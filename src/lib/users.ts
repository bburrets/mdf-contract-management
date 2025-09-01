import { query } from './db';
import { User, UserInsert, UserUpdate, UserPublic } from '../types/database';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// User service functions for authentication system
// Story 1.2: Basic User Authentication System

export async function createUser(userData: Omit<UserInsert, 'user_id' | 'password_hash'> & { password: string }): Promise<UserPublic> {
  const { password, ...userFields } = userData;
  
  // Hash the password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);
  
  // Generate unique user ID
  const user_id = randomUUID();
  
  const insertData: UserInsert = {
    user_id,
    password_hash,
    ...userFields
  };
  
  const result = await query(`
    INSERT INTO users (user_id, email, password_hash, full_name, role, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING user_id, email, full_name, role, is_active, created_at, last_login
  `, [
    insertData.user_id,
    insertData.email,
    insertData.password_hash,
    insertData.full_name,
    insertData.role || 'operations',
    insertData.is_active ?? true
  ]);
  
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );
  
  return result.rows[0] || null;
}

export async function getUserById(user_id: string): Promise<UserPublic | null> {
  const result = await query(`
    SELECT user_id, email, full_name, role, is_active, created_at, last_login
    FROM users 
    WHERE user_id = $1 AND is_active = true
  `, [user_id]);
  
  return result.rows[0] || null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function updateLastLogin(user_id: string): Promise<void> {
  await query(
    'UPDATE users SET last_login = NOW() WHERE user_id = $1',
    [user_id]
  );
}

export async function updateUser(user_id: string, updates: UserUpdate): Promise<UserPublic | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;
  
  if (updates.email !== undefined) {
    setClauses.push(`email = $${paramCount++}`);
    values.push(updates.email);
  }
  
  if (updates.password_hash !== undefined) {
    setClauses.push(`password_hash = $${paramCount++}`);
    values.push(updates.password_hash);
  }
  
  if (updates.full_name !== undefined) {
    setClauses.push(`full_name = $${paramCount++}`);
    values.push(updates.full_name);
  }
  
  if (updates.role !== undefined) {
    setClauses.push(`role = $${paramCount++}`);
    values.push(updates.role);
  }
  
  if (updates.is_active !== undefined) {
    setClauses.push(`is_active = $${paramCount++}`);
    values.push(updates.is_active);
  }
  
  if (updates.last_login !== undefined) {
    setClauses.push(`last_login = $${paramCount++}`);
    values.push(updates.last_login);
  }
  
  if (setClauses.length === 0) {
    return await getUserById(user_id);
  }
  
  values.push(user_id);
  
  const result = await query(`
    UPDATE users 
    SET ${setClauses.join(', ')}
    WHERE user_id = $${paramCount}
    RETURNING user_id, email, full_name, role, is_active, created_at, last_login
  `, values);
  
  return result.rows[0] || null;
}

export async function changePassword(user_id: string, newPassword: string): Promise<boolean> {
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(newPassword, saltRounds);
  
  const result = await query(
    'UPDATE users SET password_hash = $1 WHERE user_id = $2 AND is_active = true',
    [password_hash, user_id]
  );
  
  return (result.rowCount ?? 0) > 0;
}

export async function deactivateUser(user_id: string): Promise<boolean> {
  const result = await query(
    'UPDATE users SET is_active = false WHERE user_id = $1',
    [user_id]
  );
  
  return (result.rowCount ?? 0) > 0;
}

export async function getAllUsers(): Promise<UserPublic[]> {
  const result = await query(`
    SELECT user_id, email, full_name, role, is_active, created_at, last_login
    FROM users
    ORDER BY created_at DESC
  `);
  
  return result.rows;
}

export async function getUsersByRole(role: string): Promise<UserPublic[]> {
  const result = await query(`
    SELECT user_id, email, full_name, role, is_active, created_at, last_login
    FROM users
    WHERE role = $1 AND is_active = true
    ORDER BY created_at DESC
  `, [role]);
  
  return result.rows;
}