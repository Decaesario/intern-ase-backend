import { verifyToken, authorize } from './authMiddleware.js';

// Boleh diakses oleh scheduler (header "Authorization: Bearer <CRON_SECRET>", mis. Vercel Cron)
// atau oleh Admin yang sedang login.
export const adminOrCron = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.authorization || '';

  if (secret && header === `Bearer ${secret}`) {
    return next();
  }

  return verifyToken(req, res, (err) => {
    if (err) return next(err);
    return authorize('ADMIN')(req, res, next);
  });
};
