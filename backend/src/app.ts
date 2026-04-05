import 'dotenv/config';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import router from './routes';

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || 500;
    const isDev = process.env.NODE_ENV === 'development';
    ctx.body = {
      code: ctx.status,
      message: isDev ? err.message : 'Internal server error',
    };
  }
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`API Base URL: http://172.17.104.76:${PORT}/api`);
});

export default app;
