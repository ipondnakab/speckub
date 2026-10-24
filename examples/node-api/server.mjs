import { createServer } from 'node:http';

const users = [{ id: '1', name: 'Ada' }];
const server = createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  response.setHeader('Content-Type', 'application/json');

  if (request.method === 'GET' && pathname === '/health') {
    response.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  const match = /^\/api\/users\/([^/]+)$/.exec(pathname);
  if (request.method === 'GET' && match) {
    const user = users.find((entry) => entry.id === match[1]);
    response.statusCode = user ? 200 : 404;
    response.end(JSON.stringify(user ?? { error: 'User not found' }));
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(Number(process.env.PORT ?? 3100), '127.0.0.1', () => {
  console.log(`Example API: http://127.0.0.1:${server.address().port}`);
});
