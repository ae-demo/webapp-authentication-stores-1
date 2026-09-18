# Sign In and Manage Todos

A user signs in through Thunder, then views and updates their private todo list via the API.

```mermaid
sequenceDiagram
    actor User
    participant todowebapp as todo-webapp
    participant userauth as user-auth
    participant todoapi as todo-api

    User->>todowebapp: open app
    todowebapp->>userauth: redirect to sign in
    userauth-->>todowebapp: signed in (token)
    todowebapp->>todoapi: get my todos
    todoapi-->>todowebapp: todo list
    User->>todowebapp: add todo item
    todowebapp->>todoapi: create todo
    todoapi-->>todowebapp: created
    User->>todowebapp: mark item done
    todowebapp->>todoapi: update todo
    todoapi-->>todowebapp: updated
```

