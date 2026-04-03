import Router from 'koa-router';
import authRouter from './auth';
import contentRouter from './content';
import orderRouter from './order';

const router = new Router();

router.use(authRouter.routes());
router.use(contentRouter.routes());
router.use(orderRouter.routes());

export default router;
