import jwt from 'jsonwebtoken';

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
};

export const signToken = (payload: object): string => {
  return jwt.sign(payload, getSecret(), { expiresIn: '1d' });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, getSecret());
};
