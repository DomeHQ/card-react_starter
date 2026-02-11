---
name: card-sdk
description: Use when working on Dome card projects that initialize and use dome-embedded-app-sdk, especially for SDK init, context handling, permissions, and CardFS file operations.
---

# Card SDK Skills Guide

Use this skill to help implement features with the Dome Card SDK in card projects. It summarizes the SDK’s core capabilities, common initialization patterns, and recommended usage.

## What the Card SDK Provides

- **Initialization**: Connects a card to the Dome host environment.
- **Context**: Provides viewer identity, roles, permissions, and UI preferences.
- **User helpers**: `user.getFullName()` returns the user’s full name string when available.
- **CardFS API**: Create, read, update, delete, and list files that belong to the card.
- **Events**: Subscribe to host updates (e.g., init payload, errors).
- **Deep links**: Trigger `dome://` or `intouchapp://` deep links.
- **Host info**: `sdk.getHost()` returns `{ type, os, os_ver, app_type, app_ver, capabilities }` when available.

## Common Initialization Pattern

Typical card initialization follows this flow:

- Build a `CardEventHandler` with `onInit`, `onInitError`, and `onError`.
- Treat `onInit` as the required starting point; it delivers the runtime context needed to use the SDK.
- Call `CardSdk.init(getKeyFromBlob(blob), handler)`.
- After `onInit`, use `sdk.cardFS` to read existing data or write new data.
- Persist `sdk`, `user`, and `ui` in a way that fits your app (state, service, or dependency injection).
- On `ui.theme`, forward the theme to your UI system (for example, update a data attribute, theme provider, or CSS variables).

Keep this flow so the SDK is initialized only once and context stays in app state.

## Key SDK APIs

- **Permissions**: Use `sdk.hasPerm(...)`, `sdk.canRead()`, and `sdk.canWrite()` with `CardPermission` to gate UI.
- **CardFS**: Use `sdk.cardFS.read`, `readById`, `write`, `writeById`, `delete`, `deleteById`, and `list`.
- **Deep links**: Call `sdk.openDeepLink("dome://...")` when you need to open Dome routes.

## Example Snippets

### Initialize the SDK

```ts
import type { CardEventHandler, CardInitData, CardInitErrorPayload } from 'dome-embedded-app-sdk';
import { CardSdk, getKeyFromBlob } from 'dome-embedded-app-sdk';

const cardDecryptionBlob = { v: 0, seed: 0, obf: [] };

const handler: CardEventHandler = {
  onInit: ({ user, ui }: CardInitData) => {
    if (ui?.theme) {
      document.documentElement.setAttribute('data-theme', ui.theme);
    }
    console.log('User', user);
  },
  onInitError: (err: CardInitErrorPayload) => console.error(`Initialization error: ${err.message} (${err.error_code})`),
  onError: (err) => console.error(`Some error occured: ${err.message} (${err.error_code})`),
};

CardSdk.init(getKeyFromBlob(cardDecryptionBlob), handler)
  .then((sdk) => console.log('SDK ready', sdk))
  .catch((err) => console.error('Init failed', err));
```

### Read and write CardFS data

```ts
import type { CardFsReadHandler, CardFsErrorPayload } from 'dome-embedded-app-sdk';
import { CardFsFileType } from 'dome-embedded-app-sdk';

const readHandler: CardFsReadHandler = {
  next: ({ data }) => console.log('Settings', data),
  error: (err: CardFsErrorPayload) => console.error('Read error', err),
};

sdk.cardFS.read('settings.json', readHandler);

await sdk.cardFS.write('settings.json', { theme: 'dark' }, CardFsFileType.JSON);
```

### Delete a file

```ts
const result = await sdk.cardFS.delete('settings.json');
console.log('Deleted?', result.deleted);
```

### Write with `onUpdate`

```ts
await sdk.cardFS.write(
  'settings.json',
  { theme: 'dark' },
  CardFsFileType.JSON,
  (update) => {
    // Optional progress/ack payloads while write is in flight.
    console.log('Write update', update);
  },
);
```

### Read handler lifecycle example

```ts
const readHandler: CardFsReadHandler = {
  next: ({ data, object, is_stale, is_complete, is_dirty }) => {
    if (is_complete) {
      if (is_stale) {
        // Offline or server unreachable.
        // UI: show cached data with a warning.
      } else {
        // Final data from server.
        // UI: render as source of truth.
        if (is_dirty) {
          // Data differs from cache.
        } else {
          // Data unchanged.
        }
      }
    } else {
      // Awaiting update from server.
      // UI: show cached data with a subtle spinner.
    }
  },
  error: (err: CardFsErrorPayload) => {
    console.error('Read error', err);
  },
};
```

### List handler lifecycle example

```ts
import type { CardFsListHandler } from 'dome-embedded-app-sdk';

const listHandler: CardFsListHandler = {
  next: ({ documents, is_stale, is_complete, is_dirty }) => {
    if (is_complete) {
      if (is_stale) {
        // Offline or server unreachable.
        // UI: show cached list with a warning.
      } else {
        // Final list from server.
        if (is_dirty) {
          // Listing changed from cache.
        }
      }
    } else {
      // Awaiting update from server.
      // UI: show cached list with a subtle spinner.
    }
  },
  error: (err: CardFsErrorPayload) => {
    console.error('List error', err);
  },
};

sdk.cardFS.list('/', listHandler);
```

## CardFS Usage Notes

- `cardFS.read` and `cardFS.list` require handlers with a `next()` callback (and optional `error()`).
- `cardFS.read` may call `next()` multiple times: cached results first, then fresh results.
- `cardFS.read` payload includes `object` metadata and may include `data`.
- `cardFS.read` payload flags: `is_stale` (from cache), `is_dirty` (data changed), `is_complete` (final result).
- When a cached payload and fresh payload are identical, the fresh payload can omit `data` and only include `object`; treat cached `data` as the final data in this case.
- If `data` is omitted because it was never cached (over 5MB) or because the fresh payload is `is_dirty` and omits `data`, fetch from `object.orig.url` to load the content yourself.
- Use `allowStale` (default `true`) to permit cached results; set `false` to wait for fresh data only.
- `cardFS.list` returns folder listings and includes the same `is_stale`, `is_dirty`, `is_complete` flags.
- `cardFS.list` payload includes `documents`, `folder_name`, optional `folder_iuid`, and pagination (`last_index`, `last_page`).
- `cardFS.write` accepts an optional `onUpdate` callback to receive progress/ack payloads while the write is in flight.
- `cardFS.write` resolves with the updated `object` metadata (and `data` in some contexts).
- `cardFS.write` update payloads may include `status`, `progress`, and `uploaded_bytes`.
- `CardFsFileType` supports `TEXT`, `JSON`, and `BINARY`.
- `cardFS.delete`/`deleteById` return promises; use for removal flows and refresh lists afterward.
- `cardFS.delete` resolves with `{ name, iuid, deleted }` when possible.
- `CardFsErrorPayload` includes a `message` and optional `code` (`NO_INTERNET`, `NO_PERMISSION`, `NOT_FOUND`, `SERVER_ERROR`, `TIMEOUT`, `INVALID_REQUEST`, `UNKNOWN`).
- Prefer wrapping CardFS calls in a small hook or service for reuse.

## Example Agent Tasks

- Read current user context and show a “viewer” badge.
- Check permissions and conditionally enable editing.
- Save form data to a file in the card’s storage.
- Load a file on startup and hydrate UI state.
- Listen for context changes and re-render.

## Guidance for AI Agents

When implementing features with the Card SDK:

1. **Locate SDK usage** (search for `dome-embedded-app-sdk`).
2. **Follow existing patterns** in the project for initialization and context; if starting fresh, use the initialization flow described above.
3. **Use async/await** and handle failures explicitly.
4. **Avoid global mutations**; keep state in your framework’s preferred store or component state.
5. **Keep UI resilient** when context or files are unavailable.

## Notes

- This skill is language/framework-agnostic and applies to any Dome card.
- Prefer hooks and small utilities over large abstractions.
