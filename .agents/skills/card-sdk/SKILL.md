---
name: card-sdk
description: Use when working on Dome card projects that initialize and use dome-embedded-app-sdk, especially for SDK init, context handling, permissions, and CardFS file operations.
---

# Card SDK Skills Guide
Use this skill to help implement features with the Dome Card SDK in card projects. It summarizes the SDK’s core capabilities, common initialization patterns, and recommended usage. In this document we use "user" to refer to the user who is logged into Dome app and viewiing the dome.

## What is a dome
A dome is a mini-app that runs inside the Dome app. Each dome is a container that can have one or more cards.

## What is a card
Each card is a section within a dome that provides a single visual functionality to the user - similar to a single page webapp. A card can be added to more than one dome. Each instance of the card has it's own life (_think of each implemention of a card as the Class and each instance added to a dome as its Object_). A card cannot be used on it's own. It has to be added to a dome. Think of a card as a widget or a ViewController (in iOS) or a Fragment (on Android).

## What the Card SDK Provides
The Card SDK enables a developer to build their own card using modern web technologies. This can be used to build any functionality. Once the card is added to a dome, the dome gets the functionality automatically. 

- **Initialization**: Connects a card to the Dome host environment.
- **Context**: Provides viewing user's identity, their role, permissions, and UI preferences.
- **Events**: Subscribe to host updates (e.g., init payload, errors).
- **Deep links**: Trigger `dome://` deep links to open functionality of the container dome or the Dome app.
- **Host info**: `sdk.getHost()` returns `{ type, os, os_ver, app_type, app_ver, capabilities }` when available.

## The Logged in "user"
The logged in user is automatically provided to the card. Because of this, a card never needs to ask for login. The user object is passed in onInit to the card.

## Common Initialization Pattern
Typical card initialization follows this flow:

- Build a `CardEventHandler` with `onInit`, `onInitError`, and `onError`.
- Treat `onInit` as the required starting point; it delivers the runtime context needed to use the SDK.
- Call `CardSdk.init(getKeyFromBlob(blob), handler)`.
- Persist `sdk`, `user`, and `ui` in a way that fits your app (state, service, or dependency injection).
- On `ui.theme`, forward the theme to your UI system (for example, update a data attribute, theme provider, or CSS variables).

Keep this flow so the SDK is initialized only once and context stays in app state.

## What is CardFS
CardFS is a cloud filesystem made available to each card. The filesystem is per card per dome. If the same card is added to two distinct domes, they will each have their own filesystem. Use CardFS to read and write files. The filesystem is visible and accessible to all members of the dome. Write permission depends on the admin (if members are allowed to write in the card or not). File can be accessed simply by their name just like in a unix environment: e.g. `test/first.json`. The path cannot start with a `/`.

CardFS also allows private per-user filesystem area. This is only accessible to the logged in user. One user cannot see the files stored by another user (unless they are admins or owners). To create a file in user's private area, use the `~` prefix. For example: `~/my_settings.json` will be different for each logged in user.

- **Caching**: The files are automatically cached and made available offline whenever possible. 
- **CardFS API**: The SDK provides API under `cardFs` for reading, writing, deleting, and listing files. Each method either returns a promise or uses handlers for streaming updates.
- You can use cardFS API after `onInit` to read existing data or write new data.


## Key SDK APIs

- **Permissions**: To get the permissions se `sdk.hasPerm(...)`, `sdk.canRead()`, and `sdk.canWrite()` with `CardPermission` to gate UI.
- **CardFS**: Use `sdk.cardFS.read`, `write`, `delete`, and `list`.
- **Deep links**: Call `sdk.openDeepLink("dome://...")` when you need to open Dome routes.

## User information in IContact 

`onInit` user information is an `IContact` object with this shape:

```json
{
  "name": {
    "family": "string",
    "given": "string"
  },
  "avatar": {
    "photo": {
      "url": "string"
    },
  },
  "organization": {
    "company": "string",
    "department": "string",
    "position": "string"
  },
  "about_me": "string | null",
  "cover": {
    "photo": {
      "url": "string"
    },
    "color": "string"
  },
  "iid": "string",
  "user_iuid": "string",
  "type": "person | string",
}
```

This is a structural reference, not a fixed payload. Treat fields as optional in UI rendering and fall back gracefully when a field is missing.

- **User helpers**: `user.getFullName()` returns the user’s full name string when available.

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

### `cardFS.read` object metadata shape

`readHandler.next` includes `object` metadata for the file/document. The payload commonly follows this shape:

```json
{
  "iuid": "string",
  "type": "document | string",
  "name": "string",
  "version": "number",
  "attached_to": "string",
  "parent": "string",
  "time_create": "number",
  "time_content_mod": "number",
  "time_last_mod": "number",
  "summary_text": "string",
  "mimetype": "string",
  "is_live": "boolean",
  "size": "number",
  "data_hash": "string",
  "perms_v2": {
    "u": "string",
    "a": "string",
    "m": "string",
    "p": "string"
  },
  "share_url": "string",
  "owner": "object | null",
  "orig": {
    "url": "string",
    "size": "number"
  },
  "hd": {
    "url": "string",
    "size": "number"
  },
  "th": {
    "url": "string",
    "size": "number"
  },
}
```

Treat `orig`, `hd`, `th`, `owner`, and permission-related fields as optional; check presence before use.

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
- `cardFS.delete` return promises; use for removal flows and refresh lists afterward.
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
