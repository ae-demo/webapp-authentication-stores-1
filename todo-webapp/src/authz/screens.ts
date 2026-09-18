// Adapted from thunder-authentication's assets/screens.example.ts pattern for
// todo-webapp's own screens. THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS,
// and all it says about each one is which API operation it LOADS. Nothing
// here names a scope, a role or a handle — security.json carries no screen
// table at all.
//
// RAIL ORDER, matching wireframes.dsl's declaration order: TodoList first
// (the flow's entry screen and this app's landing screen), then AddTodo.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  /** A stable id the App maps to a page component. */
  readonly key: string;
  /** The wireframe's screen name, for the rail and the Forbidden copy. */
  readonly label: string;
  readonly path: string;
  /**
   * The operation whose answer this screen renders on load; null = a signed-in
   * screen with no load call (a form that only posts).
   */
  readonly loads: OperationKey | null;
  /**
   * In a flow with no `role` line: reachable before sign-in, routed ABOVE the
   * sign-in guard. Neither of todo-webapp's screens is public — the whole app
   * sits behind the Thunder SSO gate.
   */
  readonly public?: boolean;
}

/**
 * todo-webapp's screens, in RAIL ORDER — one row per wireframes.dsl screen.
 *
 * TodoList loads the caller's own todo items (`GET /me/todo-items`) — the
 * screen's reach matches its wireframe: "the user's private list". AddTodo is
 * a form with no load call, reachable by any signed-in caller; its Save
 * button posts `POST /me/todo-items`, gated with <Can op="POST /me/todo-items">
 * rather than a route guard.
 */
export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "todolist", label: "My Todos", path: "/todos", loads: "GET /me/todo-items" },
  { key: "addtodo", label: "Add Todo", path: "/todos/new", loads: null },
];

// FAIL LOUDLY, at module load — the first render, every time, in dev, in the
// mock walk and in the deployed pod. `loads` is typed as an OperationKey, so a
// name the contract does not declare is already a type error; this catches
// the case tsc cannot, a COMMITTED operations.gen.ts that went stale against a
// contract nobody regenerated from.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

/**
 * The screens a caller can actually open, in rail order. The first one is the
 * landing screen; an EMPTY list is the NoAccess case.
 */
export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}
