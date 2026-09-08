/**
 * Where an async read has got to.
 *
 * One enum shared by every store so "loading" means the same thing everywhere,
 * and so no template ever compares against a bare string. Stores expose
 * `isLoading` / `loadError` computeds derived from this rather than exposing
 * the enum itself — the view should never have to know the state machine.
 */
export enum LoadState {
  /** Nothing has been asked for yet. */
  IDLE,
  /** A request is in flight. */
  LOADING,
  /** Data has arrived and is in the store. */
  LOADED,
  /** The request failed; `loadError` explains it. */
  FAILED,
}

/** Where a write has got to. Same idea, for creates, updates and deletes. */
export enum SaveState {
  IDLE,
  SAVING,
  SAVED,
  FAILED,
}
