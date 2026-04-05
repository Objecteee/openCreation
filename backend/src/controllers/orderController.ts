import { Context } from 'koa';
import { query } from '../db';

export class OrderController {
  async getPackages(ctx: Context) {
    const packages = [
      { id: 'package_60', points: 60, price: 6, label: '60积分' },
      { id: 'package_300', points: 300, price: 28, label: '300积分（享92折）' },
      { id: 'package_600', points: 600, price: 50, label: '600积分（享83折）' },
      { id: 'package_1200', points: 1200, price: 90, label: '1200积分（享75折）' },
    ];

    ctx.body = { code: 0, message: 'success', data: packages };
  }

  async recharge(ctx: Context) {
    const userId = ctx.state.user.userId;
    const { packageId } = ctx.request.body as { packageId?: string };

    const packages: Record<string, { points: number; price: number }> = {
      package_60: { points: 60, price: 6 },
      package_300: { points: 300, price: 28 },
      package_600: { points: 600, price: 50 },
      package_1200: { points: 1200, price: 90 },
    };

    const pkg = packages[packageId || ''];
    if (!pkg) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '无效的套餐' };
      return;
    }

    query(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [pkg.points, userId]
    );

    query(
      `INSERT INTO point_transactions (user_id, amount, type, description)
       VALUES (?, ?, 'recharge', ?)`,
      [userId, pkg.points, `充值${pkg.points}积分`]
    );

    const users = query('SELECT points FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '用户不存在' };
      return;
    }

    ctx.body = {
      code: 0,
      message: '充值成功',
      data: { points: users[0].points },
    };
  }

  async getTransactions(ctx: Context) {
    const userId = ctx.state.user.userId;
    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    const records = query(
      `SELECT id, amount, type, description, created_at
       FROM point_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    ctx.body = { code: 0, message: 'success', data: records };
  }
}

export const orderController = new OrderController();
