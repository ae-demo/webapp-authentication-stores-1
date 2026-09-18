// mockEnv carries the keys the platform actually emits for todo-webapp's
// `user-auth` dependency, and only those (react-webapp: mock-mode.md §4).
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  // No USER_AUTH_JWKS_URL: the browser never validates a token, so src/env.ts
  // does not declare it and mock mode does not carry it.
  USER_AUTH_SCOPES: "openid profile email group ou todo-items:read todo-items:manage",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/webapp-authentication-stores-1",
};
