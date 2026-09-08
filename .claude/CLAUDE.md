
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

This project targets **Angular v21** and is **zoneless** (no `zone.js`). Do not assume change detection runs automatically after async work, timers, or DOM events — it only runs when a signal read in a template changes, `ChangeDetectorRef.markForCheck()` is called, or another zoneless-aware trigger fires. Never rely on `setTimeout`/`Promise` callbacks or third-party event handlers to update the view unless the state they touch is a signal.

Application state is held in **MobX** stores. MobX has its own reactivity system, which Angular knows nothing about, so a MobX change repaints nothing on its own — the `mobxToSignal()` bridge in `src/app/state/mobx-to-signal.ts` is what turns store state into an Angular signal and so into a render. Read store state in a component through that helper and nowhere else.

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
- Use MobX stores for application state and signals for whatever stays inside one component (see State Management below)
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
- Data fetched from a service is loaded and held by a store, never by the component. Do NOT use `rxResource`/`resource` for it, and do NOT manually `.subscribe()` in a component to populate component state. A component asks the store to load (`store.loadTasks()`), reads the result with `mobxToSignal()`, and never reloads after a mutation — the store changed, so the view already re-rendered
- Every store-backed view MUST handle all three states explicitly: loading, error, and success. Never render only the happy path — show a loading indicator while the store's `isLoading` is true and an error state when its `loadError` is set, with an accessible way to retry (the store's `reload…()` action)
- The wording of a load or save failure belongs in the store, not the template. Bind `[message]="loadError"` rather than restating the sentence in each page

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

State lives in MobX stores. A component binds and forwards events; it does not decide, cache, or orchestrate.

- **Root stores** (`providedIn: 'root'`) own domain data shared across pages — `TaskStore`, `CommentStore`. One aggregate each; a store that needs another injects it (as `TaskStore` injects `CommentStore` to cascade a delete)
- **Page stores** (`@Injectable()` with no `providedIn`, listed in the page's `providers`) own one page's state and are destroyed with it — `TaskDetailsStore`, `TaskFormStore`. Because they are component-provided they can inject `ActivatedRoute` and read the route themselves, so the page needs no wiring
- Build every store with `makeAutoObservable(this, { …injectedServices: false }, { autoBind: true })` in the constructor, initialising every field inline. Exclude injected services — they are not state. Name private fields in the second type argument, which TypeScript otherwise omits from the annotation map. Never subclass a store; `makeAutoObservable` does not support inheritance
- Annotate collections with `observableRef` and replace them wholesale (`this.tasks = [...this.tasks, created]`). Plain objects then flow out to templates instead of proxies
- Derived state is a `get` accessor, which `makeAutoObservable` turns into a `computed`. A derivation that needs an argument (`taskById(id)`) is a plain method — a MobX computed cannot take one, and a method reading observables is still tracked
- `enforceActions: 'observed'` is on: state may only change inside an action. In an `async` method only the code before the first `await` is the action, so wrap every later mutation in `runInAction`
- Model load and save progress with the `LoadState` / `SaveState` enums in `src/app/state/load-state.ts`, and expose `isLoading` / `loadError` accessors from it — never the enum itself. Keep a latched `hasLoaded` for views that must survive a reload without collapsing to a skeleton
- Signals remain correct for state that belongs to one component and never leaves it (a `viewChild`, a "have I patched the form yet" flag). Use `computed()` for derived signal state, and `update`/`set` — never `mutate`

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Templates must only read signals — a `mobxToSignal()` reading of store state, local component state, or a `computed()`. Never a raw Observable and never a MobX observable directly: a template that reads `store.tasks` will render once and never update, because Angular is not tracking MobX. Do NOT use the `async` pipe
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
- Keep the data-access layer (`TaskRepo`) Observable-returning and stateless: it fetches and maps the wire format, and does nothing else. Stores consume it with `firstValueFrom`, which is the only place RxJS meets MobX
- A store is a service too, and the same rules apply. What separates the two: a repo talks to the network, a store holds and derives
