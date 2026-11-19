import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'

const origin = process.env.WHITEBOARD_TEST_ORIGIN ?? 'http://127.0.0.1:4173'
const anonymous = { cookie: '' }

async function request(user, path, method = 'GET', body, expected = 200) {
  const response = await fetch(origin + '/api' + path, {
    method,
    headers: {
      Origin: origin,
      ...(user.cookie && { Cookie: user.cookie }),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const raw = await response.text()
  assert.equal(response.status, expected, `${method} ${path}: ${raw}`)
  return { response, data: raw ? JSON.parse(raw) : undefined }
}

async function account(name) {
  const username = `qa_${randomUUID().slice(0, 8)}`
  const password = randomUUID()
  await request(anonymous, '/auth/sign-up/email', 'POST', {
    username, name, email: `${username}@example.test`, password,
  })
  const { response, data } = await request(anonymous, '/auth/sign-in/username', 'POST', { username, password })
  const cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
  assert.ok(cookie)
  return { cookie, id: data.user.id }
}

function openRoom(user, board) {
  const socketUrl = new URL(`/api/boards/${board}/socket`, origin)
  socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  const socket = new WebSocket(socketUrl, { headers: { Cookie: user.cookie, Origin: origin } })
  const messages = []
  socket.addEventListener('message', event => messages.push(JSON.parse(event.data)))
  let closed
  socket.addEventListener('close', event => { closed = event.code })
  async function until(read, description) {
    const deadline = Date.now() + 5000
    while (Date.now() < deadline) {
      const result = read()
      if (result !== undefined) return result
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`Timed out waiting for ${description}; close: ${closed}; messages: ${JSON.stringify(messages)}`)
  }
  return {
    send: value => socket.send(JSON.stringify(value)),
    close: () => socket.close(),
    closed: () => until(() => closed, 'socket close'),
    message: (type, predicate = () => true) => until(
      () => messages.find(message => message.type === type && predicate(message)),
      type,
    ),
  }
}

function rectangle(label) {
  return { id: randomUUID(), type: 'rectangle', x: 40, y: 60, width: 160, height: 74, label, color: 'default' }
}

function commit(room, after, before = null, id = randomUUID()) {
  room.send({ type: 'commit', id, changes: [{ id: after.id, before, after }] })
  return id
}

test('private sharing, role enforcement, live edits, persistence and revocation', { timeout: 30_000 }, async t => {
  const [owner, editor, viewer] = await Promise.all([
    account('QA Owner'), account('QA Editor'), account('QA Viewer'),
  ])
  const { data: { board } } = await request(owner, '/boards', 'POST', {}, 201)
  const boardPath = `/boards/${board.id}`
  t.after(() => request(owner, boardPath, 'DELETE', undefined, 204))
  assert.equal(board.role, 'owner')
  assert.match(board.id, /^[A-Za-z0-9_-]{21}$/)
  const { data: renamed } = await request(owner, boardPath, 'PATCH', { title: 'QA Checkout' })
  assert.equal(renamed.board.title, 'QA Checkout')
  await request(anonymous, boardPath, 'GET', undefined, 401)
  await request(editor, boardPath, 'GET', undefined, 404)
  await request(viewer, boardPath, 'GET', undefined, 404)

  const invites = {}
  for (const [role, user] of Object.entries({ editor, viewer })) {
    const { data } = await request(owner, boardPath + '/invites', 'POST', { role }, 201)
    const token = new URL(data.url, origin).pathname.split('/').pop()
    const path = `/invites/${token}`
    invites[role] = { path, id: data.invite.id }
    await request(anonymous, path, 'POST', {}, 401)
    const { data: redemption } = await request(user, path, 'POST', {})
    assert.equal(redemption.board.role, role)
    const { data: catalog } = await request(user, '/boards')
    assert.ok(catalog.boards.some(item => item.id === board.id && item.role === role))
  }
  await request(editor, boardPath + '/invites', 'POST', { role: 'viewer' }, 403)
  await request(viewer, boardPath, 'PATCH', { title: 'Unauthorized' }, 403)

  const ownerRoom = openRoom(owner, board.id)
  const editorRoom = openRoom(editor, board.id)
  const viewerRoom = openRoom(viewer, board.id)
  t.after(() => { ownerRoom.close(); editorRoom.close(); viewerRoom.close() })
  const [snapshot] = await Promise.all([ownerRoom, editorRoom, viewerRoom].map(room => room.message('snapshot')))
  assert.deepEqual(snapshot.elements, [])
  const presence = (await ownerRoom.message('presence', message => message.presence.length === 3)).presence
  assert.deepEqual(presence.map(peer => peer.cursorSlot).sort(), [1, 2, 3])
  assert.ok(presence.every(peer => !Object.hasOwn(peer, 'color')))
  const editorSlot = presence.find(peer => peer.userId === editor.id).cursorSlot

  editorRoom.send({ type: 'cursor', point: { x: 100, y: 80 } })
  await ownerRoom.message('presence', message => message.presence.some(peer => peer.userId === editor.id && peer.point?.x === 100))

  const ownerShape = rectangle('Owner shape')
  const editorShape = rectangle('Editor shape')
  const blocked = commit(viewerRoom, rectangle('Viewer cannot edit'))
  assert.equal((await viewerRoom.message('reject', message => message.id === blocked)).id, blocked)
  const ownerChange = commit(ownerRoom, ownerShape)
  const editorChange = commit(editorRoom, editorShape)
  await viewerRoom.message('commit', message => message.id === ownerChange)
  await viewerRoom.message('commit', message => message.id === editorChange)

  const coloredShape = { ...ownerShape, color: '#1b935e' }
  const connector = {
    id: randomUUID(), type: 'connector', sourceId: ownerShape.id, targetId: editorShape.id,
    label: '', color: '#c04e28', strokeStyle: 'dotted',
  }
  const colorChange = commit(ownerRoom, coloredShape, ownerShape)
  const strokeChange = commit(ownerRoom, connector)
  assert.equal((await viewerRoom.message('commit', message => message.id === colorChange)).changes[0].after.color, '#1b935e')
  assert.deepEqual((await viewerRoom.message('commit', message => message.id === strokeChange)).changes[0].after, connector)

  editorRoom.close()
  await editorRoom.closed()
  const editorReconnected = openRoom(editor, board.id)
  t.after(() => editorReconnected.close())
  const recovered = await editorReconnected.message('snapshot')
  assert.equal(recovered.presence.find(peer => peer.userId === editor.id).cursorSlot, editorSlot)
  assert.equal(new Set(recovered.presence.map(peer => peer.cursorSlot)).size, 3)

  assert.deepEqual(new Set(recovered.elements.map(shape => shape.id)), new Set([ownerShape.id, editorShape.id, connector.id]))
  assert.equal(recovered.elements.find(element => element.id === ownerShape.id).color, '#1b935e')
  assert.deepEqual(recovered.elements.find(element => element.id === connector.id), connector)
  commit(editorReconnected, editorShape, null, editorChange)
  await editorReconnected.message('ack', message => message.id === editorChange)

  await request(owner, boardPath + '/invites/' + invites.editor.id, 'DELETE', undefined, 204)
  await request(owner, boardPath + '/members/' + editor.id, 'DELETE', undefined, 204)
  assert.equal(await editorReconnected.closed(), 4403)
  await request(editor, invites.editor.path, 'POST', {}, 404)
  await request(editor, boardPath, 'GET', undefined, 404)
  const { data: access } = await request(owner, boardPath + '/access')
  assert.ok(!access.members.some(member => member.id === editor.id))
  assert.ok(access.members.some(member => member.id === owner.id && member.role === 'owner'))

  await request(viewer, '/auth/sign-out', 'POST', {})
  assert.equal(await viewerRoom.closed(), 4403)
  await request(viewer, boardPath, 'GET', undefined, 401)
})

test('protected SSR renders only the current account’s board data', { timeout: 30_000 }, async t => {
  const [owner, viewer] = await Promise.all([account('SSR Owner'), account('SSR Viewer')])
  const title = `SSR Private ${randomUUID()}`
  const { data: { board } } = await request(owner, '/boards', 'POST', { title }, 201)
  const path = `/boards/${board.id}`
  t.after(() => request(owner, path, 'DELETE', undefined, 204))

  async function page(user, pathname) {
    const response = await fetch(origin + pathname, {
      headers: user.cookie ? { Cookie: user.cookie } : undefined,
      redirect: 'manual',
    })
    assert.match(response.headers.get('Cache-Control') ?? '', /no-store/)
    const html = await response.text()
    return { response, html, markup: html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') }
  }

  const [owned, other, signedOut] = await Promise.all([
    page(owner, '/boards'), page(viewer, '/boards'), page(anonymous, '/boards'),
  ])
  assert.equal(owned.response.status, 200)
  assert.ok(owned.markup.includes(title), 'owner sees the title in server-rendered markup')
  assert.equal(other.response.status, 200)
  assert.ok(!other.html.includes(title), 'other account receives neither markup nor dehydrated private data')
  assert.equal(signedOut.response.status, 307)
  assert.equal(new URL(signedOut.response.headers.get('Location'), origin).searchParams.get('returnTo'), '/boards')

  const denied = await page(viewer, path)
  assert.ok(denied.markup.includes('Board unavailable.'))
  assert.ok(!denied.html.includes(title))

  const { data: { url } } = await request(owner, path + '/invites', 'POST', { role: 'viewer' }, 201)
  const invitePath = new URL(url, origin).pathname
  const anonymousInvite = await page(anonymous, invitePath)
  assert.equal(new URL(anonymousInvite.response.headers.get('Location'), origin).searchParams.get('returnTo'), invitePath)
  await request(viewer, invitePath.replace('/invite/', '/invites/'), 'POST', {})
  const shared = await page(viewer, path)
  assert.equal(shared.response.status, 200)
  assert.ok(shared.markup.includes(title))
  assert.ok(shared.markup.includes('Can view'))
  assert.ok(shared.markup.includes('aria-label="Board loading"'))
  assert.ok(shared.markup.includes('data-slot="spinner"'))
  assert.ok(!shared.markup.includes('data-slot="board-canvas"'), 'first paint omits the live canvas until a snapshot arrives')
})
