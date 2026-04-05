import { Context, Next } from 'koa';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthPayload {
  userId: number;
  phone: string;
}

export async function authMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未授权，请先登录' };
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    ctx.state.user = payload;
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { code: 401, message: 'Token 无效或已过期' };
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
