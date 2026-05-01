const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');

async function bootstrap() {
  await connectDB();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on :${config.port} (${config.env})`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[fatal]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[unhandledRejection]', reason);
});
