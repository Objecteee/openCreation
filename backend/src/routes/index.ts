import Router from 'koa-router';
import authRouter from './auth';
import contentRouter from './content';

const router = new Router();

router.use(authRouter.routes());
router.use(contentRouter.routes());

export default router;
