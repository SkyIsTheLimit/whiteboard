# Whiteboard

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/SkyIsTheLimit/whiteboard)

A private, collaborative canvas for flowcharts and lightweight diagrams. Create a blank board, draw shapes and text, connect them, and invite signed-in teammates as viewers or editors.

Whiteboard uses TanStack Start, React, TypeScript, Tailwind, and shadcn-style Radix components. A Cloudflare Worker serves the app and authorizes requests. D1 stores Better Auth users, sessions, and board access. A SQLite Durable Object for each board persists the drawing and coordinates cursors and changes over hibernating WebSockets.

## Screenshots

![Whiteboard Boards screen showing owned and shared boards](docs/screenshots/boards.webp)

![Checkout flow board with Sam and Riley’s live collaborator cursors](docs/screenshots/collaborating.webp)

## Run locally

Use Node.js 22.13+ on the 22.x line, or Node.js 24 or newer, with npm. Local development uses Wrangler's emulated D1 and Durable Objects.

```sh
npm ci
cp .dev.vars.example .dev.vars
```

Replace the example `BETTER_AUTH_SECRET` in `.dev.vars` with the output of `openssl rand -hex 32`. Then run:

```sh
npm run db:migrate
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Open http://127.0.0.1:4173 and create an account. Use separate browser profiles to try collaboration with two accounts. Local data lives in `.wrangler/state`. Keep that directory to retain local boards between runs.

## Board controls

- Use **Select** to move and resize elements, Shift-click to add to a selection, or drag from empty space to select several elements.
- Use **Shape**, **Text**, and **Connector** to add elements. Connectors remain anchored as their endpoint shapes move. Double-click an element to edit its label.
- Use **Hand** to pan, or the bottom-right controls to zoom and fit the whole drawing. Use the toolbar or keyboard to duplicate, delete, undo, and redo.
- Open **Share** as the owner to create a role-specific invite. The ordinary board URL requires membership. Revoking an invite stops new redemptions, and removing a member ends their existing access.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

With the local preview running, `npm run test:worker` exercises username authentication, private access, two-way edits, viewer enforcement, reconnect, and revocation against the local Worker. It creates synthetic accounts and removes its board at the end. Set `WHITEBOARD_TEST_ORIGIN` if the preview uses a different origin.

## Local performance

Measured in Chrome 157 at 1474 × 1160 CSS pixels and device pixel ratio 2. The browser harness used the production-bundled canvas and collaboration client. One signed-in editor generated one input per animation frame while a second editor submitted a durable move every 150 ms. Each action contributed 43 animation-frame intervals. The idle median was 14.3 ms. The 60 Hz frame budget is about 16.7 ms.

| Board size | Pan p95 | Zoom p95 | Select p95 | Drag p95 | Zoom-to-fit p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1,000 shapes + 1,000 connectors | 14.8 ms | 14.4 ms | 14.9 ms | 14.4 ms | 14.4 ms |
| 10,000 shapes + 10,000 connectors (exploratory) | 14.9 ms | 15.3 ms | 15.3 ms | 15.1 ms | 42.9 ms |

The fit phase repeatedly redrew the fitted board. It exceeded 20 ms on all 43 intervals in the exploratory run. The other phases benefited from drawing only geometry intersecting the viewport.

In a separate loopback Worker test, two authenticated sockets submitted concurrent edits. Time from send to receipt on the other socket across 60 updates was 1.5 ms median and 2.3 ms p95 for the 1,000-plus-1,000 board. The exploratory board measured 1.4 ms median and 4.8 ms p95. These transport measurements include local Worker processing and exclude browser rendering and internet transit.

## Deploy to your own Cloudflare account

Create a D1 database with `npx wrangler d1 create whiteboard`. In `wrangler.jsonc`, set the database ID on the existing `DB` binding. Keep the `BOARD_ROOMS` binding and the SQLite class migration. Apply the D1 migrations, build, and deploy:

```sh
npx wrangler d1 migrations apply DB --remote
npm run deploy
```

Set `BETTER_AUTH_SECRET` to a fresh random secret and `BETTER_AUTH_URL` to the public HTTPS origin using Worker secrets or the Cloudflare dashboard. Keep the origin consistent with the site visitors will use. For optional Google sign-in, set both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and register `<your origin>/api/auth/callback/google` as the redirect URI with Google.

The badge opens Cloudflare's setup for the public repository. Check the provisioned bindings, configure the auth secrets, and apply the D1 migrations before using the app. See the [Deploy to Cloudflare setup guide](https://developers.cloudflare.com/workers/platform/deploy-buttons/).

See the [TanStack Start Cloudflare setup](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) and the [Cloudflare hibernating WebSocket guide](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) for runtime details.
