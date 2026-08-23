import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Resident Registration
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, apartmentBlock, apartmentUnit } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const emailNormalized = String(email).toLowerCase().trim();
    const existingUser = await prisma.user.findFirst({ where: { email: emailNormalized } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: emailNormalized,
        password: hashedPassword,
        apartmentBlock,
        apartmentUnit,
        role: 'RESIDENT',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        apartmentBlock: user.apartmentBlock,
        apartmentUnit: user.apartmentUnit,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Auth Login (Admin & Resident)
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const emailNormalized = String(email).toLowerCase().trim();
    const user = await prisma.user.findFirst({ where: { email: emailNormalized } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        apartmentBlock: user.apartmentBlock,
        apartmentUnit: user.apartmentUnit,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Profile Lookup
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        apartmentBlock: true,
        apartmentUnit: true,
      },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
