import Router from 'koa-router';
import authRouter from './auth';

const router = new Router();

router.use(authRouter.routes());

export default router;
