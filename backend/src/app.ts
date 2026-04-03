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
    ctx.body = {
      code: ctx.status,
      message: err.message || 'Internal server error',
    };
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
