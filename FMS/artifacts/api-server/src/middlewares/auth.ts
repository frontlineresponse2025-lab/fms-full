import type { Request, Response, NextFunction } from "express";
import type { FmsRole } from "../lib/discord";

/**
 * Rejects unauthenticated requests with 401.
 * Apply to any route that requires a logged-in user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/**
 * Rejects requests whose session role is not in the allowed list.
 * Always implies requireAuth — no need to stack both.
 */
export function requireRole(...roles: FmsRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.session.user.role as FmsRole)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
