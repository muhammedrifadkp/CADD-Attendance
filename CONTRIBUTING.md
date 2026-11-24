# Contributing to Lab Attendance

Thanks for helping! Bug reports, ideas from institutes using the app, and pull requests are all welcome.

## Before you start

- For a bug or an idea, open an issue first using one of the templates.
- For a larger change, describe your plan in the issue so we can agree on it before you write the code.
- Never put real student data (names, phone numbers, photos) in issues, screenshots or test fixtures.

## Local setup

Follow **Quick start** in the [README](README.md): `npm run install-all`, copy `backend/.env.example`
to `backend/.env`, `npm run seed:demo`, then `npm run dev`.

## Checks

Run these before opening a pull request. CI runs the same checks on every pull request.

```bash
cd backend && npm test        # API and unit tests, no database needed
cd frontend && npm run build  # the production build must succeed
```

When you add a feature or fix a bug in the backend, add a test in `backend/test/` that would have
caught it. Tests use Node's built-in test runner (`node:test`) and `supertest`.

## Pull requests

- One topic per pull request, with a short description of what changed and why.
- Keep the institute generic: names, logos and departments come from settings
  (`frontend/src/config/branding.js`, env variables), never hard-coded.
- By contributing you agree that your work is released under the [MIT License](LICENSE).
