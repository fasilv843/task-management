export interface TabOption {
  label: string;
  /** Router commands for this tab, passed straight to `routerLink`. */
  route: string | readonly unknown[];
}
