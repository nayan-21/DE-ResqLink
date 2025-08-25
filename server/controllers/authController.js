const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { email, password, userType = 'user' } = req.body;

    console.log('Registration request:', { email, userType, hasPassword: !!password });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!['user', 'rescue_team'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = { email, password: hashedPassword, userType };
    console.log('Creating user with data:', userData);

    const user = await User.create(userData);
    console.log('User created:', { id: user._id, email: user.email, userType: user.userType });

    const token = generateToken(user._id);
    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, email: user.email, userType: user.userType },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login request for:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Found user:', { id: user._id, email: user.email, userType: user.userType });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, userType: user.userType },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
