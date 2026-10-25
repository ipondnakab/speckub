import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createExampleServer } from './server.mjs';

let server, base;
beforeEach(async () => {
  server = createExampleServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});
async function call(method, path, body) {
  const response = await fetch(base + path, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
  return {
    status: response.status,
    body:
      response.status === 204 ? await response.text() : await response.json(),
  };
}

test('user CRUD supports list, create, get, replace, update and delete', async () => {
  assert.deepEqual(await call('GET', '/health'), {
    status: 200,
    body: { status: 'ok' },
  });
  assert.equal((await call('GET', '/api/users')).body.items.length, 1);
  const created = await call('POST', '/api/users', { name: ' Grace ' });
  assert.deepEqual(created, { status: 201, body: { id: '2', name: 'Grace' } });
  assert.deepEqual((await call('GET', '/api/users/2')).body, created.body);
  assert.equal(
    (await call('PUT', '/api/users/2', { name: 'Grace Hopper' })).body.name,
    'Grace Hopper',
  );
  assert.equal(
    (await call('PATCH', '/api/users/2', { name: 'Rear Admiral Hopper' })).body
      .name,
    'Rear Admiral Hopper',
  );
  assert.deepEqual(await call('DELETE', '/api/users/2'), {
    status: 204,
    body: '',
  });
  assert.deepEqual(await call('GET', '/api/users/2'), {
    status: 404,
    body: { error: 'User not found' },
  });
});

test('deep routes scope task CRUD and comments to their parents', async () => {
  const project = '/api/organizations/1/projects/1';
  assert.equal(
    (await call('GET', '/api/organizations/1/projects')).body.items[0].name,
    'SpecKub demo',
  );
  assert.deepEqual((await call('GET', project)).body, {
    id: '1',
    name: 'SpecKub demo',
  });
  const tasks = project + '/tasks';
  assert.equal((await call('GET', tasks)).body.items.length, 1);
  const created = await call('POST', tasks, { title: '  Test nested route  ' });
  assert.deepEqual(created, {
    status: 201,
    body: { id: '2', title: 'Test nested route', completed: false },
  });
  assert.deepEqual((await call('GET', tasks + '/2')).body, created.body);
  assert.equal(
    (await call('PATCH', tasks + '/2', { completed: true })).body.completed,
    true,
  );
  const comments = tasks + '/2/comments';
  assert.deepEqual((await call('GET', comments)).body, { items: [] });
  const comment = await call('POST', comments, { text: ' Looks good ' });
  assert.deepEqual(comment, {
    status: 201,
    body: { id: '2', text: 'Looks good' },
  });
  assert.deepEqual((await call('GET', comments + '/2')).body, comment.body);
  assert.equal((await call('GET', tasks + '/1/comments/2')).status, 404);
  assert.deepEqual(await call('DELETE', tasks + '/2'), {
    status: 204,
    body: '',
  });
  assert.equal((await call('GET', comments)).status, 404);
});

test('missing parents and records produce distinct 404s', async () => {
  for (const [path, error] of [
    ['/api/organizations/missing/projects', 'Organization not found'],
    ['/api/organizations/1/projects/missing/tasks', 'Project not found'],
    [
      '/api/organizations/1/projects/1/tasks/missing/comments',
      'Task not found',
    ],
    [
      '/api/organizations/1/projects/1/tasks/1/comments/missing',
      'Comment not found',
    ],
  ])
    assert.deepEqual(await call('GET', path), { status: 404, body: { error } });
  assert.equal((await call('GET', '/api/users/1/')).status, 404);
  assert.equal((await call('POST', '/health')).status, 404);
});

test('JSON write contracts reject invalid fields without mutating state', async () => {
  for (const body of [
    {},
    { name: null },
    { name: '' },
    { name: 'Ada', admin: true },
    [],
  ]) {
    assert.equal((await call('POST', '/api/users', body)).status, 400);
  }
  assert.equal((await call('PATCH', '/api/users/1', {})).status, 400);
  assert.equal((await call('PUT', '/api/users/1', {})).status, 400);
  assert.equal(
    (
      await call('POST', '/api/organizations/1/projects/1/tasks', {
        title: 'Test',
        completed: 'false',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call('POST', '/api/organizations/1/projects/1/tasks/1/comments', {
        text: null,
      })
    ).status,
    400,
  );
  assert.deepEqual((await call('GET', '/api/users')).body.items, [
    { id: '1', name: 'Ada' },
  ]);
});

test('malformed JSON, unsupported media type and oversized bodies have explicit errors', async () => {
  const malformed = await fetch(base + '/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'Invalid JSON' });
  const wrongType = await fetch(base + '/api/users', {
    method: 'POST',
    body: 'name=Ada',
  });
  assert.equal(wrongType.status, 415);
  await wrongType.text();
  const large = await call('POST', '/api/users', {
    name: 'x'.repeat(17 * 1024),
  });
  assert.deepEqual(large, {
    status: 413,
    body: { error: 'Request body exceeds 16 KiB' },
  });
  assert.equal(
    (await call('POST', '/api/users', { name: 'After errors' })).body.id,
    '2',
  );
});
