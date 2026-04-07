import express from 'express';
import { createServer } from 'http';
import next from 'next';
import { parse } from 'url';
import { initializeWebSocketServer } from './server/socket/socket.server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  
  // Initialize the new WebSocket Server
  initializeWebSocketServer(httpServer);

  // Next.js handler
  server.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
