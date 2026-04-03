import Router from 'koa-router';
import { authMiddleware } from '../middleware/auth';
import { contentController } from '../controllers/contentController';

const router = new Router({ prefix: '/api/content' });

router.use(authMiddleware);

router.post('/generate', async (ctx) => contentController.generate(ctx));
router.get('/history', async (ctx) => contentController.getHistory(ctx));

export default router;
