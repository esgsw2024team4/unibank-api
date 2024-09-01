import { withTransaction } from '../utils/with-transaction.util';

import { asyncHandler } from '../utils/async-handler.util';

import passport from '../utils/passport';

import { issueToken, deleteUser } from '../services/auth.service';
import User from '../models/user.model';
import { FRONT_WEB_URL } from '../config/env';

export const auth = asyncHandler(async (req, res, next) => {
  // #swagger.ignore = true
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next);
});

export const authCallback = asyncHandler(async (req, res, next) => {
  // #swagger.ignore = true
  if (req.query?.error) {
    throw new Error('Something went wrong...');
  }
  passport.authenticate(
    'google',
    { failWithError: true },
    async (errAuth: any, user: User, info: any) => {
      try {
        if (errAuth) {
          throw errAuth;
        }
        if (!user) {
          return res.status(401).json({ message: info });
        }
        const { id, googleId, email } = user;
        res.redirect(
          `${FRONT_WEB_URL}/auth?token=${issueToken({ id, googleId, email })}`,
        );
      } catch (err) {
        next(err);
      }
    },
  )(req, res, next);
});

export const checkIsAuthenticated = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    throw new Error('Invalid request...');
  }
  const { id, name, email, point } = user.dataValues;
  res.json({ id: id, name: name, email: email, point: point });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    throw new Error('Invalid request...');
  }
  await withTransaction(async (tx) => deleteUser(user.id, tx));
  res.status(204).end();
});
