# Task Management

A single-page task management app: create, update, and delete tasks, view them as a list or on a calendar, and hold threaded comment discussions on each task.

## Setup Instructions

**Prerequisites:** Node.js and npm (this project was built with `npm@11.19.0`, matching the `packageManager` field in `package.json`).

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:4200/)
npm start

# Run unit tests (Vitest)
npm test

# Production build (outputs to dist/)
npm run build
```

## Angular Version

Angular **21.2** (`@angular/core ^21.2.0`, Angular CLI `^21.2.23`), running **zoneless** — change detection is driven by `provideZonelessChangeDetection()` in [src/app/app.config.ts](src/app/app.config.ts) rather than `zone.js`. State updates flow through signals and `rxResource`, not ambient dirty-checking.

## Packages Used

**Runtime**
- `@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/platform-browser`, `@angular/forms`, `@angular/router` — core framework, reactive forms, and the router
- `@fullcalendar/angular`, `@fullcalendar/core`, `@fullcalendar/daygrid` — the calendar view of the task list
- `ngx-quill`, `quill` — rich text editing for task descriptions and comments
- `rxjs` — Observable streams from services, consumed via `rxResource`

**Development / tooling**
- `@angular/cli`, `@angular/build`, `@angular/compiler-cli` — build tooling
- `tailwindcss`, `@tailwindcss/postcss`, `postcss` — styling
- `vitest`, `jsdom` — unit test runner and DOM environment
- `prettier` — code formatting
- `typescript` — language/tooling

## Assumptions Made

- **No real backend.** `TaskRepo` ([src/app/services/task-repo.ts](src/app/services/task-repo.ts)) reads static JSON files (`assets/tasks.json`, `assets/comments.json`) over HTTP as a stand-in for a REST API, including mapping their snake_case wire format to camelCase domain models.
- **No persistence across sessions.** `TaskStore` ([src/app/services/task-store.ts](src/app/services/task-store.ts)) seeds from that JSON once, then keeps all creates/updates/deletes in in-memory signals for the lifetime of the session. Reloading the page resets all data back to the seed files.
- **Client-generated IDs.** New tasks and comments get `crypto.randomUUID()` ids client-side, since there's no server to assign them.
- **Comments are a single flat collection.** A reply is just a comment whose `parentCommentId` points at another comment, which lets threads nest without a separate reply endpoint or data structure.
- **Single-user, no auth.** There's no login, user model, or permission concept — anyone using the app can see and edit everything.

## Architecture

- **Routing.** [src/app/app.routes.ts](src/app/app.routes.ts) lazy-loads every feature route (`loadComponent`) with route preloading enabled. `/tasks` hosts list and calendar as child routes/tabs; `/tasks/create`, `/tasks/update/:id`, and `/tasks/:id` are separate standalone routes for the form and detail views.
- **Data flow.** A strict two-layer service split:
  - `TaskRepo` is the data-access layer — it only fetches and maps wire-format rows to domain models.
  - `TaskStore` is the session state layer — it caches what `TaskRepo` returns in signals and exposes everything back out as Observables, so components can drive `rxResource` without services holding component-facing signal state themselves.
  - Components consume those Observables through `rxResource`, exposing `.value()`, `.isLoading()`, and `.error()` as signals that templates read directly — no manual `.subscribe()`, no `async` pipe.
- **Folder structure** under `src/app/`:
  - `pages/` — route-level containers (task list, calendar, task form, task details)
  - `components/` — reusable presentational pieces (buttons, inputs, selects, status badges, calendar, rich text editor/content, comment thread/form)
  - `shared/` — cross-cutting form validation utilities and directives
  - `services/` — `TaskRepo`, `TaskStore`, and their colocated types
  - `utils/` — small standalone helpers (e.g. date formatting)
- **Types** are colocated per feature (e.g. `task.types.ts`, `common-status.types.ts`) rather than centralized in one project-wide file, keeping each type file scoped to a single concern.
- **Styling** uses Tailwind CSS v4 via `@tailwindcss/postcss`.
- **Testing** uses Vitest with jsdom; `.spec.ts` files sit next to the code they test.
