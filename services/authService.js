const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const SALT_ROUNDS = 10;

async function registerUser(email, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
    return { message: 'User created successfully', email };
  } catch (error) {
    if (error.code === '23505') {
      return { error: 'Email already exists' };
    }
    throw error;
  }
}

async function loginUser(email, password) {
  const { rows } = await pool.query('SELECT id, email, password, role FROM users WHERE email = $1', [email]);

  if (rows.length === 0) {
    return { error: 'Invalid email or password' };
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return { error: 'Invalid email or password' };
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '1h' });

  return { message: 'Login successful', token, user: { id: user.id, email: user.email, role: user.role } };
}

async function changePassword(userId, currentPassword, newPassword) {
  const { rows } = await pool.query('SELECT id, password FROM users WHERE id = $1', [userId]);

  if (rows.length === 0) {
    return { error: 'User not found' };
  }

  const match = await bcrypt.compare(currentPassword, rows[0].password);
  if (!match) {
    return { error: 'Current password is incorrect' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

  return { message: 'Password changed successfully' };
}

module.exports = { registerUser, loginUser, changePassword };
 