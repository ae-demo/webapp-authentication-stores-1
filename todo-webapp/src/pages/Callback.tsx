// Thunder's OIDC redirect target, `<origin>/callback`. Routed OUTSIDE
// AuthzProvider (src/App.tsx) — there is no session to read until the
// redirect has been processed.
import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router";
import { handleCallback } from "../authz/session";
import { Splash } from "./Splash";

export function CallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    void handleCallback()
      .then(() => {
        if (live) navigate("/", { replace: true });
      })
      .catch((err: unknown) => {
        console.error("callback: sign-in redirect failed", err);
        if (live) navigate("/", { replace: true });
      });
    return () => {
      live = false;
    };
  }, [navigate]);

  return <Splash />;
}
