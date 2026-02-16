# React Starter Card

The React Starter Card is a boilerplate project for building Dome cards using React.

## The Basics

### What is a dome?
A dome is a _mini-app_ that runs inside the Dome app. Each dome is a container that can have one or more cards.

### What is a card?
Each card is a section within a dome that provides a single visual functionality to the user - similar to a single page webapp. For example: a "group chat".

A card can be added to more than one dome. Each such instance of the card has it's own life (_to make it easy to understand, think of each implemention of a card as the Class and each instance added to a dome as its Object_). A card cannot be used on its own. It has to be added to a dome.


### Why build a card?
- **Extend functionality**: By building a custom card, you can implement any functionality you want. You can then add it to a dome and start using the functionality instantly. For example, let's say you have this great idea about an AI chat bot. Just build a card and then add it to any dome mini-app to make the functionality available to members of that dome. 
- **Run across Android, iPhone and Web**: Once implemented and added to a dome, your card runs on Android, iPhone or PC / Mac! No need for multiple implementations. Wherever your users are, they can use your card immediately.
- **Pre authentication**: There is no need for your card to do authentication as it is already taken care of. The user who is logged into the Dome app is directly available in the card.

---

## Prerequisites

Before getting started, ensure the following tools and access are available on your system:

- Node.js (v21 or later recommended)

- npm (or any other package manager)

- A Dome account

## Getting Started

### 1. Register Your New Card
The first step is to register your new card.
1. Go to the **Dome Developer** dome (mini-app) in the Dome app or visit: [https://dome.so/developer](https://dome.so/developer). Join the dome if you are nota member yet.
2. Open the **Cards** tab and click **Add Card** and follow the prompts. Choose the "react" framework since we will be builind a react card here. We also support Angular.

After creating your card you should see it listed with the following details:
   - Card name
   - Card ID (IUID)
   - Available card versions

---

### 2. Set Up the Card Project

1. Clone the `card-react_starter` project.
2. Open `manifest-card.json` in the project root.
3. Update the following fields:

   - `name`: Your card name
   - `iuid`: Paste the Card ID from **Cards** tab

> Note: The `iuid` is essential for building, identifying, and deploying your card within Dome.

---

### 3. Initialize the Card SDK

The Card SDK is the runtime bridge between your card and Dome.
It handles initialization, authentication, permissions, events, and communication with the host Dome environment.

The starter project already includes SDK initialization logic. You only need to provide the decryption key. Just follow these steps:

1. In **Cards** tab, open your card and click **Show Decryption Key**.
2. Copy the decryption blob (JSON).
3. Paste the blob into the reactStarterDecBlob constant in the starter code.

Once this is complete, the SDK is fully initialized and ready for use.

You can learn more about the Card SDK here:
👉 [https://github.com/InTouchSO/dome-sdk](https://github.com/InTouchSO/dome-sdk)

---

### 4. Deploy the First Version

To deploy the first version, you need to setup the deployment token:

1. In **Cards** tab, open your card and click **Get Deployment Token**.
2. Copy the generated token.
3. In your GitHub repository:

   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Add a new **Repository Secret**

     - **Key**: `WEBAPP_DEPLOY_TOKEN`
     - **Value**: Your deployment token

4. Push your code to the `release` branch.
5. Wait for the workflow to complete successfully.

Now your card is ready to be used in any dome (_mini-app_)!

---

### 5. Add Your Card to a Dome Mini-app
To start using your card, simply add it to a mini-app.

1. Open an existing or create a new dome where you want to use the card.
2. Open the menu and choose **Add new tab**.
3. Go to the **Own** section and you should see your card. Click on the **+** to add.

You should now see "Hello <Your name>". If you see that, congratulations! You just built your first card! Now modify the card to your heart's content and build whatever functionality you wish.

---

## Deploying Your Card - The Details

### Deployment Requirements

Before deploying, ensure the following:

1. Your repository uses the **reusable GitHub Actions release workflow** (included in the starter).
2. A deployment token is configured as a GitHub repository secret.
3. ensure that the card project builds correctly.
4. Production build output is generated in either `dist/` or `build/` directory (pre-configured in the starter).
5. The build pipeline completes successfully.

---

### Deploy

1. By default, deployments trigger on pushes to the `release` branch.
   - You can change this in `.github/workflows/release-build.yml`.
2. Push your changes to the `release` branch.
3. Once the workflow completes successfully, your card will be live in Dome.

---

## Development
Building a card is same as building a webapp. It's an iterative process. Follow this guide to simply and speed up your development.

### Testing and Running locally

You can test your card locally inside Dome without redeploying it after every change.

1. Start your card locally (e.g. `npm run dev`).
2. Add the card to a dome (it will initially appear blank).
3. Click the **info (i)** icon next to the card name.
4. Open **Settings** → **Developer** section.
5. Set:
   - **Environment**: `Local`
   - **Local URL**: The localhost URL (including port) where your card is running
6. Click **Apply**.

Your locally running card should now render inside the Dome.
Use the **reload button** above the feed list to refresh after making changes.

---

## Using the Card SDK

After initialization, the SDK allows your card to know the logged in user, get the permissons, role, as well as use an advanced cloud filesystem.

### Event Handling

- The `CardEventHandler` passed into `CardSdk.init` is required.
- Key callbacks:

  - `onInit`: Fired when initialization completes successfully.
    Provides:

    - User details
    - Card metadata
    - Dome context
    - Host information
    - User permissions
    - UI preferences
  - `onInitError`: Fired if SDK initialization fails
  - `onError`: General error reporting

Use `onInit` as the main entry point for your card logic.

---

### SDK Instance Access

- `CardSdk.init` returns a promise that resolves to the SDK instance.
- Store this instance to access SDK methods throughout your card.

---

### Permissions

Cards have built in permission model controlled by the admins of the dome the card belongs to. This permission model is accessible within the SDK to make it easy to customize behavior based on user permissions. For example, showing the **edit** button if a user has write permission.

- `sdk.canRead()` / `sdk.canWrite()` — simple permission checks
- `sdk.hasPerms(CardPermission.X)` — fine-grained permission checks using enums

---

### CardFS: The Cloud Filesystem

**CardFS** is a cloud filesystem made available to each card. The filesystem is per card per dome. If the same card is added to two distinct domes, they will each have their own filesystem. Use CardFS to read and write files. The filesystem is visible and accessible to all members of the dome. Write permission depends on the admin (if members are allowed to write in the card or not). File can be accessed simply by their name just like in a unix environment: e.g. `test/first.json`. The path cannot start with a `/`.

CardFS also allows private per-user filesystem area. This is only accessible to the logged in user. One user cannot see the files stored by another user (unless they are admins or owners). To create a file in user's private area, use the `~` prefix. For example: `~/my_settings.json` will be different for each logged in user.

**Caching**: The files are automatically cached and made available offline whenever possible. 

The SDK provides APIs allowing you to:

- Read files
- Create files
- Delete files
- List files

---

## Next Steps

- Explore advanced SDK APIs
- Add permission-aware UI
- Implement persistent storage with `CardFS`
- Prepare your card for public release

---

## Additional Notes

### Rendering Model

Dome cards are client-side rendered only.

- Server-side rendering (SSR) is not supported
- Cards must run entirely in the browser
- Framework features that rely on SSR (e.g. server data loaders, server components, edge rendering) should not be used

Ensure your card is built and deployed as a purely client-rendered web application.

### Reusable Workflow

Your card’s workflow file should reference the reusable workflow:

```bash
DomeHQ/cards-ci/.github/workflows/card-release.yml
```

The workflow must be referenced using a **tag**, allowing your card to:

- Pin to a **known-good version**, or
- Track the **latest stable release**

#### Example

```yaml
uses: DomeHQ/cards-ci/.github/workflows/card-release.yml@stable
```

---
