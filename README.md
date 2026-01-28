# Cards

A "card" in Dome enables you to extend the functionality of Dome. Each "card" is like a mini website (webapp) that you can build as per your needs. Each dome is made up of cards. By adding your custom card to your dome, you can extend it's functionality.

## Card Directory Naming Convention

Card directories must follow this naming pattern:

```bash
card-{card_name}
```

- The name must start with the word card
- Followed by a dash -
- Followed by your card’s name using snake_case

Example:

```bash
card-hello_world_ng
```

## Branching

card specific branches:

`develop` for development
`release` for card releases

pushing to release branch will create releases for that specific card

## Manifest

Each card must include a `manifest-card.json` file in the card root directory.

### Required fields

| Key    | Description                                              |
| ------ | -------------------------------------------------------- |
| `name` | The display name of the card                             |
| `iuid` | The card’s unique ID, generated when the card is created |

The `iuid` is essential for building, identifying, and deploying your card within Dome.

## Build

Before releasing a card, ensure that it builds correctly.

### Build Requirements

- Production build output must be generated in one of the following directories:

  - `dist/`
  - `build/`
- Your build pipeline must complete successfully

### Build Pipeline Behavior

When the build pipeline runs, it will:

1. Move compiled files to:

   ```bash
   3rdparty/cards/{IUID}/
   ```

2. Generate a build descriptor file:

   ```bash
   build_output.{IUID}.{BUILD_TIMESTAMP}.{CARD_NAME}.txt
   ```

This descriptor can be used to verify or deploy that specific version.

---

## Release

Each card repository is required to use a **reusable GitHub Actions workflow** for releases.

### Reusable Workflow

Your card’s workflow file should reference the reusable workflow:

```bash
InTouchSO/cards-ci/.github/workflows/card-release.yml
```

The workflow must be referenced using a **tag**, allowing your card to:

- Pin to a **known-good version**, or
- Track the **latest stable release**

### Example

```yaml
uses: InTouchSO/cards-ci/.github/workflows/card-release.yml@stable
```

You may replace `stable` with any version tag you want to lock to.

### Release Behavior

When you push to the `release` branch:

- The reusable workflow builds the card
- A new release is created for that card
- Build artifacts are packaged according to the card pipeline rules

---
