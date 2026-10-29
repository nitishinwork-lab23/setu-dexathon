# Contributing to Setu

Thank you for your interest in contributing to the Setu platform! This guide will help you get started.

## Getting Started

1. **Fork** this repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/setu-platform.git
   cd setu-platform
   ```
3. **Run the app** (no dependencies needed):
   ```bash
   node server.js
   ```
4. Open `http://localhost:3000` in your browser

## Development Setup

- **No build step** — plain HTML, CSS, and JavaScript
- **No npm install** — the Node server uses only the standard library
- **No framework** — vanilla JS throughout

### Project Layout

| Path | Purpose |
|---|---|
| `server.js` | Node HTTP server (static files + state API) |
| `index.html` | App shell: auth screen + dashboard skeleton |
| `css/styles.css` | All styling, design tokens, and role themes |
| `js/data.js` | Data layer (`DB.*`), loads/saves via server API |
| `js/app.js` | Auth flow, router, sidebar, toast, helpers |
| `js/i18n.js` | Multilingual support (EN / HI / KH / BN) |
| `js/render-*.js` | Per-role dashboard rendering |

## How to Add a New Feature

Each new feature typically involves three files:

1. **`js/data.js`** — add a new mock data table in the seed data
2. **`js/render-<role>.js`** — add a view function + `data-action` bindings
3. **The nav array** in the relevant render module — add a sidebar entry

## Code Style

- Use **2-space indentation** consistently
- Use **camelCase** for variables and functions
- Use **template literals** for HTML generation
- Keep render functions self-contained per role
- Prefer `const` over `let`; avoid `var`

## Submitting a Pull Request

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test locally with `node server.js`
4. Run the server tests: `node test-server.js`
5. Commit with a clear message: `git commit -m "feat: add notification panel"`
6. Push and open a PR against `main`

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `style:` — formatting, no code change
- `refactor:` — code restructuring
- `test:` — adding or updating tests

## Reporting Issues

- Use the **Issues** tab on GitHub
- Include your browser, OS, and steps to reproduce
- Screenshots or screen recordings are very helpful

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
