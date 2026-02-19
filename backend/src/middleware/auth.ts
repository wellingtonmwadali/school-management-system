import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import User from '../models/User';

interface JwtPayload {
  id: string;
  role: string;
  schoolId: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    res.status(401).json({ success: false, message: 'User not found or deactivated' });
    return;
  }

  req.user = { id: decoded.id, role: decoded.role, schoolId: decoded.schoolId, email: user.email };
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Not authorized for this action' });
      return;
    }
    next();
  };
};
