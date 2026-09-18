// Typed read of window._env_, the platform's runtime config (mounted as
// /env-config.js). Declares only the keys this app actually has: the four
// `USER_AUTH_*` OIDC keys the `user-auth` platform-resource dependency emits.
// No <DEP>_JWKS_URL — the browser never validates a token, the API gateway
// does — and no sibling API URL: todo-api is reached same-origin at `/api`.
type Env = {
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_SCOPES: string;
  USER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
