import Router from 'koa-router';
import { authMiddleware } from '../middleware/auth';
import { orderController } from '../controllers/orderController';

const router = new Router({ prefix: '/api/order' });

router.use(authMiddleware);

router.get('/packages', async (ctx) => orderController.getPackages(ctx));
router.post('/recharge', async (ctx) => orderController.recharge(ctx));
router.get('/transactions', async (ctx) => orderController.getTransactions(ctx));

export default router;
