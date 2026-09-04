
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

This project targets **Angular v21** and is **zoneless** (no `zone.js`). Do not assume change detection runs automatically after async work, timers, or DOM events — it only runs when a signal read in a template changes, `ChangeDetectorRef.markForCheck()` is called, or another zoneless-aware trigger fires (e.g. `resource`/`rxResource`, `AsyncPipe`, signal updates). Never rely on `setTimeout`/`Promise` callbacks or third-party event handlers to update the view unless the state they touch is a signal.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Use descriptive, unabbreviated names for types, variables, functions, and files (e.g. `taskStatus` not `st`, `TaskService` not `Svc`) — optimize for readability over brevity
- Do not use string literals or plain string comparisons to represent a closed set of states (e.g. task status, roles, request state). Model them as a `enum` (or string union backed by an enum) and compare against the enum member, never against a raw string (`task.status === TaskStatus.Done`, not `task.status === 'done'`)

## Types & File Organization

- Do not declare `interface`/`type` definitions inline inside component, service, or pipe files. Move them into a dedicated types file colocated with the feature (e.g. `task.types.ts` next to `task-service.ts`, or `tasks.types.ts` next to `tasks.ts`) and import from there
- One concern per types file: request/response shapes, domain models, and enums for a feature live together, but avoid a single project-wide `types.ts` dumping ground
- Enums used across a feature (e.g. `TaskStatus`) belong in the types file, not redefined per-component

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
- Use `rxResource` (from `@angular/core/rxjs-interop`) — or `resource` for non-Observable async sources — for any data fetched from a service. Do not manually `.subscribe()` in a component to populate component state; `rxResource` gives you `.value()`, `.status()`, `.error()`, and `.isLoading()` as signals, which is what zoneless change detection needs to pick up the update
- Every `rxResource`/`resource` consumed in a template MUST handle all three states explicitly: loading, error, and success. Never render only the happy path — show a loading indicator while `isLoading()` is true and an error state when `error()` is set, with an accessible way to retry (e.g. calling `.reload()`) where relevant

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Use Reactive Forms (`ReactiveFormsModule`, `FormGroup`/`FormControl`/`FormBuilder`) for all forms. Do NOT use Template-driven forms, and do NOT use the experimental Angular Signal Forms API — this project standardizes on Reactive Forms only
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Templates must only read signals (component state, `computed()`, or a `resource`'s `.value()`/`.isLoading()`/`.error()`), never raw Observables. Do NOT use the `async` pipe — convert any Observable to a signal first via `rxResource` or `toSignal()` in the component class, then bind the signal in the template. This keeps change detection predictable under zoneless
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
- Services expose Observables (e.g. `getTasks(): Observable<Task[]>`) for `rxResource` to consume; do not have services manage component-facing signal state themselves
