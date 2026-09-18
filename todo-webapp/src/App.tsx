// Adapted from thunder-authentication's assets/App.example.tsx PATTERN — the
// ROUTING STRUCTURE below is prescribed:
//
//   NoAccess sits ABOVE the shell route and REPLACES it — a caller who
//   unlocks nothing gets no navbar and no empty sidebar.
//
//   Forbidden sits INSIDE the shell — the caller holds other scopes and has
//   somewhere to go, so the rail stays. Routed at /forbidden.
//
//   /forbidden is wired into src/authz/client.ts once, from this router root
//   (ForbiddenWiring below).
//
//   Every gated route is wrapped in <RequireOperation>, with the operation
//   taken from SCREEN_ROUTES — never a handle or an operation typed here.
//
//   /callback is routed OUTSIDE the provider: there is no session to read
//   until the redirect has been processed.
//
// todo-webapp has no public screen — the whole app sits behind the Thunder
// SSO gate (design.json / the issue's Scope), so there is no PUBLIC_SCREENS
// branch here.

import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router";
import {
  AuthzProvider,
  Forbidden,
  NoAccess,
  RequireOperation,
  useAuthz,
  useScopes,
} from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { APP_NAME } from "./appName";
import { AppShell } from "./shell/AppShell";
import { CallbackPage } from "./pages/Callback";
import { TodoListPage } from "./pages/TodoList";
import { AddTodoPage } from "./pages/AddTodo";
import { Splash } from "./pages/Splash";

/** YOUR pages, keyed by the screen keys src/authz/screens.ts declares. */
const PAGE_BY_KEY: Record<string, ReactElement> = {
  todolist: <TodoListPage />,
  addtodo: <AddTodoPage />,
};

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Hands src/authz/client.ts the route a refusal goes to. ONCE, from inside
 * the router and above every route, so it is wired before the first request
 * can be answered.
 */
function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // The load-time guard. Only a MISSING session starts a sign-in: currentUser()
  // has already tried a silent renew, and signing in on a merely expired token
  // re-logs the user in on every visit.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  // NoAccess REPLACES the shell. Returned here, above the <Routes> that carry
  // AppShell, so there is no rail to wrap it.
  if (reachable.length === 0) return <NoAccess appName={APP_NAME} />;

  const landing = reachable[0].path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = PAGE_BY_KEY[screen.key];
          // No load call: anyone with a session is in.
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          // The requirement comes from the contract, through the generated
          // table — never from this file.
          return (
            <Route
              key={screen.key}
              element={<RequireOperation op={screen.loads} screen={screen.label} />}
            >
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        {/* Forbidden is INSIDE the shell: the rail the caller can use stays. */}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
