import { Context } from 'koa';
import bcrypt from 'bcryptjs';
import { query, queryWithReturning } from '../db';
import { generateToken } from '../middleware/auth';

export class AuthController {
  async register(ctx: Context) {
    const { phone, password, nickname } = ctx.request.body as { phone?: string; password?: string; nickname?: string };

    if (!phone || !password) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '手机号和密码不能为空' };
      return;
    }

    const existing = query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '该手机号已注册' };
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const info = query(
      `INSERT INTO users (phone, password, nickname, points) VALUES (?, ?, ?, 50)`,
      [phone, hashedPassword, nickname || '']
    );

    const lastId = (info[0] as any)?.lastInsertRowid || 1;
    const users = queryWithReturning('SELECT id, phone, nickname, points FROM users WHERE id = ?', [lastId]);
    const user = users[0];

    const token = generateToken({ userId: user.id, phone: user.phone });

    ctx.body = {
      code: 0,
      message: '注册成功',
      data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, points: user.points } },
    };
  }

  async login(ctx: Context) {
    const { phone, password } = ctx.request.body as { phone?: string; password?: string };

    if (!phone || !password) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '手机号和密码不能为空' };
      return;
    }

    const users = query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '手机号或密码错误' };
      return;
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '手机号或密码错误' };
      return;
    }

    const token = generateToken({ userId: user.id, phone: user.phone });

    ctx.body = {
      code: 0,
      message: '登录成功',
      data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, points: user.points } },
    };
  }

  async getProfile(ctx: Context) {
    const userId = ctx.state.user.userId;
    const users = query('SELECT id, phone, nickname, points, created_at FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '用户不存在' };
      return;
    }

    ctx.body = { code: 0, message: 'success', data: users[0] };
  }
}

export const authController = new AuthController();
