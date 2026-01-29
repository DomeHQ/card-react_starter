# React Starter Card

The React Starter Card is a boilerplate project for building Dome cards using React.

A "card" in Dome enables you to extend the functionality of Dome. Each "card" is like a mini website (webapp) that you can build as per your needs. Each dome is made up of cards. By adding your custom card to your dome, you can extend it's functionality.

---

## Prerequisites

Before getting started, ensure the following tools and access are available on your system:

- Node.js (v21 or later recommended)

- npm (or any other package manager)

- A Dome account

## Getting Started

### 1. Create Your Card in Dome

1. Go to [https://dome.so/developer](https://dome.so/developer) and join the **Dome Developer** Dome.
2. Open **My Cards** and click **Add Card**.
3. After creating your card you should see it listed with the following details:

   * Card name
   * Card ID (IUID)
   * Available card versions

---

### 2. Set Up the Card Project

1. Clone the `card-react_starter` project.
2. Open `manifest-card.json` in the project root.
3. Update the following fields:

   * `name`: Your card name
   * `iuid`: Paste the Card ID from **My Cards**
> Note: The `iuid` is essential for building, identifying, and deploying your card within Dome.

---

### 3. Initialize the Card SDK

The Card SDK is the runtime bridge between your card and Dome.
It handles initialization, authentication, permissions, events, and communication with the host Dome environment.

The starter project already includes SDK initialization logic. You only need to provide the decryption key.

1. In **My Cards**, open your card and click **Show Decryption Key**.
2. Copy the decryption blob (JSON).
3. Paste the blob into the reactStarterDecBlob constant in the starter code.

Once this is complete, the SDK is fully initialized and ready for use.

You can learn more about the Card SDK here:
👉 [https://github.com/InTouchSO/dome-sdk](https://github.com/InTouchSO/dome-sdk)

---

### 4. Add Your Card to a Dome

1. Open or create a Dome where you want to use the card.
2. Open the **three-dot menu** in the Dome tabs area and select **Add new tab**.
3. Under the **Own** section, find your card (marked with the **Internal** tag).
4. Add the card to the Dome.

---

## Deploying Your Card

### Deployment Requirements

Before deploying, ensure the following:

1. Your repository uses the **reusable GitHub Actions release workflow** (included in the starter).
2. A deployment token is configured as a GitHub repository secret.
3. ensure that the card project builds correctly.
4. Production build output is generated in either `dist/` or `build/` directory (pre-configured in the starter).
5. The build pipeline completes successfully.

---

### Add the Deployment Token

1. In **My Cards**, open your card and click **Get Deployment Token**.
2. Copy the generated token.
3. In your GitHub repository:

   * Go to **Settings** → **Secrets and variables** → **Actions**
   * Add a new **Repository Secret**

     * **Key**: `WEBAPP_DEPLOY_TOKEN`
     * **Value**: Your deployment token

---

### Deploy

1. By default, deployments trigger on pushes to the `release` branch.

   * You can change this in `.github/workflows/release-build.yml`.
2. Push your changes to the `release` branch.
3. Once the workflow completes successfully, your card will be live in Dome.

---

## Development

### Testing and Running locally

You can test your card locally inside Dome without redeploying it after every change.

1. Start your card locally (e.g. `npm run dev`).
2. Add the card to a Dome (it will initially appear blank).
3. Click the **info (i)** icon next to the card name.
4. Open **Settings** → **Developer** section.
5. Set:

   * **Environment**: `Local`
   * **Local URL**: The localhost URL (including port) where your card is running
6. Click **Apply**.

Your locally running card should now render inside the Dome.
Use the **reload button** above the feed list to refresh after making changes.

---

## Using the Card SDK

After initialization, the SDK allows your card to communicate with Dome.

### Event Handling

* The `CardEventHandler` passed into `CardSdk.init` is required.
* Key callbacks:

  * `onInit`: Fired when initialization completes successfully.
    Provides:

    * User details
    * Card metadata
    * Dome context
    * Host information
    * User permissions
    * UI preferences
  * `onInitError`: Fired if SDK initialization fails
  * `onError`: General error reporting

Use `onInit` as the main entry point for your card logic.

---

### SDK Instance Access

* `CardSdk.init` returns a promise that resolves to the SDK instance.
* Store this instance to access SDK methods throughout your card.

---

### Permissions

You can control behavior based on user permissions:

* `sdk.canRead()` / `sdk.canWrite()` — simple permission checks
* `sdk.hasPerms(CardPermission.X)` — fine-grained permission checks using enums

---

### File System Access

The SDK provides a built-in file system API via `CardFS`, allowing you to:

* Read files
* Create files
* Delete files
* List files

This storage is scoped to your card and managed by Dome.

---

## Next Steps

* Explore advanced SDK APIs
* Add permission-aware UI
* Implement persistent storage with `CardFS`
* Prepare your card for public release

---

## Additional Notes

### Rendering Model

Dome cards are client-side rendered only.

* Server-side rendering (SSR) is not supported
* Cards must run entirely in the browser
* Framework features that rely on SSR (e.g. server data loaders, server components, edge rendering) should not be used

Ensure your card is built and deployed as a purely client-rendered web application.

### Reusable Workflow

Your card’s workflow file should reference the reusable workflow:

```bash
InTouchSO/cards-ci/.github/workflows/card-release.yml
```

The workflow must be referenced using a **tag**, allowing your card to:

* Pin to a **known-good version**, or
* Track the **latest stable release**

#### Example

```yaml
uses: InTouchSO/cards-ci/.github/workflows/card-release.yml@stable
```

---
