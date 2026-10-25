import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const bodyLimit = 16 * 1024;
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message);
};
function fields(body, allowed, required = []) {
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    fail(400, 'Unknown field');
  for (const key of required)
    if (!(key in body)) fail(400, `${key} is required`);
  for (const key of ['name', 'title', 'text']) {
    if (key in body && (typeof body[key] !== 'string' || !body[key].trim())) {
      fail(400, `${key} must be a nonempty string`);
    }
  }
  if ('completed' in body && typeof body.completed !== 'boolean')
    fail(400, 'completed must be a boolean');
  if (!Object.keys(body).length && !required.length)
    fail(400, 'At least one field is required');
}
async function readJson(request) {
  if (
    !/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] ?? '')
  ) {
    fail(415, 'Content-Type must be application/json');
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > bodyLimit) fail(413, 'Request body exceeds 16 KiB');
    chunks.push(chunk);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    fail(400, 'Invalid JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    fail(400, 'JSON body must be an object');
  return body;
}
function send(response, status, body) {
  response.statusCode = status;
  if (status === 204) {
    response.end();
    return;
  }
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

/** Each server owns fresh in-memory state. Nothing is persisted or sent externally. */
export function createExampleServer() {
  const users = new Map([['1', { id: '1', name: 'Ada' }]]);
  const organizations = new Map([
    [
      '1',
      {
        id: '1',
        projects: new Map([
          [
            '1',
            {
              id: '1',
              name: 'SpecKub demo',
              tasks: new Map([
                [
                  '1',
                  {
                    id: '1',
                    title: 'Write API specifications',
                    completed: false,
                    comments: new Map([
                      ['1', { id: '1', text: 'Include a sequence diagram.' }],
                    ]),
                  },
                ],
              ]),
            },
          ],
        ]),
      },
    ],
  ]);
  let nextUser = 2,
    nextTask = 2,
    nextComment = 2;
  const routes = [];
  function route(method, path, handler, json = false) {
    const names = [...path.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
    const pattern = new RegExp(`^${path.replace(/\{\w+\}/g, '([^/]+)')}$`);
    routes.push({ method, pattern, names, handler, json });
  }
  function user(params) {
    return users.get(params.id) ?? fail(404, 'User not found');
  }
  function project(params) {
    const org =
      organizations.get(params.organizationId) ??
      fail(404, 'Organization not found');
    return org.projects.get(params.projectId) ?? fail(404, 'Project not found');
  }
  function task(params) {
    return (
      project(params).tasks.get(params.taskId) ?? fail(404, 'Task not found')
    );
  }
  const taskData = ({ id, title, completed }) => ({ id, title, completed });
  const projectData = ({ id, name }) => ({ id, name });
  const nested = '/api/organizations/{organizationId}/projects';
  const tasks = `${nested}/{projectId}/tasks`;
  const comments = `${tasks}/{taskId}/comments`;

  route('GET', '/health', () => [200, { status: 'ok' }]);
  route('GET', '/api/users', () => [200, { items: [...users.values()] }]);
  route(
    'POST',
    '/api/users',
    ({ body }) => {
      fields(body, ['name'], ['name']);
      const entry = { id: String(nextUser++), name: body.name.trim() };
      users.set(entry.id, entry);
      return [201, entry];
    },
    true,
  );
  route('GET', '/api/users/{id}', ({ params }) => [200, user(params)]);
  route(
    'PUT',
    '/api/users/{id}',
    ({ params, body }) => {
      const entry = user(params);
      fields(body, ['name'], ['name']);
      entry.name = body.name.trim();
      return [200, entry];
    },
    true,
  );
  route(
    'PATCH',
    '/api/users/{id}',
    ({ params, body }) => {
      const entry = user(params);
      fields(body, ['name']);
      entry.name = body.name.trim();
      return [200, entry];
    },
    true,
  );
  route('DELETE', '/api/users/{id}', ({ params }) => {
    user(params);
    users.delete(params.id);
    return [204];
  });

  route('GET', nested, ({ params }) => {
    const org =
      organizations.get(params.organizationId) ??
      fail(404, 'Organization not found');
    return [200, { items: [...org.projects.values()].map(projectData) }];
  });
  route('GET', `${nested}/{projectId}`, ({ params }) => [
    200,
    projectData(project(params)),
  ]);
  route('GET', tasks, ({ params }) => [
    200,
    { items: [...project(params).tasks.values()].map(taskData) },
  ]);
  route(
    'POST',
    tasks,
    ({ params, body }) => {
      const parent = project(params);
      fields(body, ['title', 'completed'], ['title']);
      const entry = {
        id: String(nextTask++),
        title: body.title.trim(),
        completed: body.completed ?? false,
        comments: new Map(),
      };
      parent.tasks.set(entry.id, entry);
      return [201, taskData(entry)];
    },
    true,
  );
  route('GET', `${tasks}/{taskId}`, ({ params }) => [
    200,
    taskData(task(params)),
  ]);
  route(
    'PATCH',
    `${tasks}/{taskId}`,
    ({ params, body }) => {
      const entry = task(params);
      fields(body, ['title', 'completed']);
      if ('title' in body) entry.title = body.title.trim();
      if ('completed' in body) entry.completed = body.completed;
      return [200, taskData(entry)];
    },
    true,
  );
  route('DELETE', `${tasks}/{taskId}`, ({ params }) => {
    task(params);
    project(params).tasks.delete(params.taskId);
    return [204];
  });
  route('GET', comments, ({ params }) => [
    200,
    { items: [...task(params).comments.values()] },
  ]);
  route(
    'POST',
    comments,
    ({ params, body }) => {
      const parent = task(params);
      fields(body, ['text'], ['text']);
      const entry = { id: String(nextComment++), text: body.text.trim() };
      parent.comments.set(entry.id, entry);
      return [201, entry];
    },
    true,
  );
  route('GET', `${comments}/{commentId}`, ({ params }) => {
    const entry =
      task(params).comments.get(params.commentId) ??
      fail(404, 'Comment not found');
    return [200, entry];
  });

  return createServer(async (request, response) => {
    try {
      const { pathname } = new URL(request.url, 'http://localhost');
      for (const definition of routes) {
        const match = definition.pattern.exec(pathname);
        if (request.method !== definition.method || !match) continue;
        const params = Object.fromEntries(
          definition.names.map((name, index) => [name, match[index + 1]]),
        );
        const body = definition.json ? await readJson(request) : undefined;
        const [status, value] = definition.handler({ params, body });
        send(response, status, value);
        return;
      }
      send(response, 404, { error: 'Not found' });
    } catch (error) {
      send(response, error instanceof HttpError ? error.status : 500, {
        error:
          error instanceof HttpError ? error.message : 'Internal server error',
      });
    }
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = createExampleServer();
  server.listen(Number(process.env.PORT ?? 3100), '127.0.0.1', () => {
    console.log(`Example API: http://127.0.0.1:${server.address().port}`);
  });
}
