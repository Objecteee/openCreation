import Router from 'koa-router';
import { authController } from '../controllers/authController';

const router = new Router({ prefix: '/api/auth' });

router.post('/register', async (ctx) => authController.register(ctx));
router.post('/login', async (ctx) => authController.login(ctx));
router.get('/profile', async (ctx) => authController.getProfile(ctx));

export default router;
