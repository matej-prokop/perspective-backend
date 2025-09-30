import { Express } from 'express';
import { createApp, close } from './app';
import { Config, getConfig } from './config';

async function start() {
  const config: Config = getConfig();
  const app: Express = await createApp(config);

  const { port } = config.httpServer;
  const server = app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });

  const shutdown = () => {
    console.log(`[server]: Shutting down the server`);
    server.close(() => {
      // our custom close - closing resources of our app
      close();
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
