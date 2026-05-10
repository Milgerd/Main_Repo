const { registerUser, loginUser, changePassword } = require('../services/authService');

async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const result = await registerUser(email, password);
    if (result.error) {
      return res.status(409).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await loginUser(email, password);
    if (result.error) {
      return res.status(401).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
}

async function changePasswordHandler(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required' });
  }

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const result = await changePassword(req.user.id, currentPassword, newPassword);
    if (result.error) {
      return res.status(401).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to change password' });
  }
}

module.exports = { register, login, changePasswordHandler };
