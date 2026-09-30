/**
 * Firebase Authentication & Role Authorization Middleware
 * Verifies Bearer ID Tokens from Firebase Client Auth.
 * Authorizes user roles: BEEKEEPER, KVIC_ADMIN, PUBLIC_CONSUMER.
 */

import { Request, Response, NextFunction } from 'express';
import { adminAuth, adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { ApiResponseUtil } from '../utils/apiResponse';

export type UserRole = 'BEEKEEPER' | 'KVIC_ADMIN' | 'PUBLIC_CONSUMER';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: UserRole;
  beekeeperId?: string;
  name?: string;
}

// Extend Express Request interface to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Validates Firebase ID token in Authorization header.
 * Expected format: `Authorization: Bearer <ID_TOKEN>`
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponseUtil.error(
      res,
      'Authentication required. Missing or malformed Authorization header.',
      401
    );
    return;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();

  if (!idToken) {
    ApiResponseUtil.error(res, 'Authentication token missing.', 401);
    return;
  }

  try {
    // 1. Verify token cryptographically with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // 2. Resolve Role from user document or claims
    let role: UserRole = 'BEEKEEPER';
    let beekeeperId: string | undefined;
    let name: string | undefined = decodedToken.name;

    try {
      if (hasAdminCredentials) {
        const userDoc = await adminFirestore.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          if (data?.role === 'admin' || email === 'admin@example.com') {
            role = 'KVIC_ADMIN';
          } else {
            role = 'BEEKEEPER';
            beekeeperId = data?.beekeeperId;
          }
          name = data?.name || name;
        } else if (email === 'admin@example.com') {
          role = 'KVIC_ADMIN';
        }
      } else {
        // In local mode without service account, resolve role by email
        if (email === 'admin@example.com') {
          role = 'KVIC_ADMIN';
        } else {
          role = 'BEEKEEPER';
        }
      }
    } catch (dbErr) {
      if (email === 'admin@example.com') {
        role = 'KVIC_ADMIN';
      }
    }

    req.user = {
      uid,
      email,
      role,
      beekeeperId,
      name,
    };

    next();
  } catch (err: any) {
    console.warn('[requireAuth] Token verification failed:', err?.message || err);

    if (err?.code === 'auth/id-token-expired') {
      ApiResponseUtil.error(res, 'Authentication token expired. Please refresh your session.', 401);
      return;
    }

    ApiResponseUtil.error(res, 'Invalid or untrusted authentication token.', 401);
  }
}

/**
 * Role-Based Access Control Middleware
 * Restricts endpoint to authorized roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponseUtil.error(res, 'Unauthorized. Authentication required before role check.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      ApiResponseUtil.error(
        res,
        `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
        403
      );
      return;
    }

    next();
  };
}

/**
 * Optional Authentication Middleware
 * Populates req.user if a valid token is provided, but continues without error if unauthenticated.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    let role: UserRole = 'BEEKEEPER';
    let beekeeperId: string | undefined;
    let name: string | undefined = decodedToken.name;

    try {
      if (hasAdminCredentials) {
        const userDoc = await adminFirestore.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          if (data?.role === 'admin' || email === 'admin@example.com') {
            role = 'KVIC_ADMIN';
          } else {
            role = 'BEEKEEPER';
            beekeeperId = data?.beekeeperId;
          }
          name = data?.name || name;
        } else if (email === 'admin@example.com') {
          role = 'KVIC_ADMIN';
        }
      } else {
        if (email === 'admin@example.com') {
          role = 'KVIC_ADMIN';
        } else {
          role = 'BEEKEEPER';
        }
      }
    } catch {
      if (email === 'admin@example.com') {
        role = 'KVIC_ADMIN';
      }
    }

    req.user = {
      uid,
      email,
      role,
      beekeeperId,
      name,
    };
  } catch {
    // Silently continue without user
  }

  next();
}
