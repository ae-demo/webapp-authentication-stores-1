// The SERVICE half of mock mode — todo-api's own data, ownership and 404s.
// mock/authz/gateway.ts is the GATEWAY half (the 401s); this file writes no
// scope check of its own. State lives in module scope, reset on any full page
// load (react-webapp: mock-mode.md §3).
//
// Seed rows are wireframes.dsl's own TodoList table
// (wireframes/scripts/seed.mjs), so the mock walk shows exactly what the
// wireframe draws.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/todo-api";

type TodoItem = components["schemas"]["TodoItem"];
type NewTodoItem = components["schemas"]["NewTodoItem"];
type TodoItemUpdate = components["schemas"]["TodoItemUpdate"];

let nextId = 3;
let todos: TodoItem[] = [
  { id: "1", title: "Buy groceries", done: false, createdAt: "2026-09-01T09:00:00Z" },
  { id: "2", title: "Finish report", done: true, createdAt: "2026-09-02T09:00:00Z" },
];

export const handlers = [
  http.get("/api/me/todo-items", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const doneParam = url.searchParams.get("done");
    let filtered = todos;
    if (doneParam !== null) {
      const wantDone = doneParam === "true";
      filtered = filtered.filter((t) => t.done === wantDone);
    }
    const page = filtered.slice(offset, offset + limit);
    return HttpResponse.json({
      count: filtered.length,
      next: offset + limit < filtered.length ? `/me/todo-items?offset=${offset + limit}` : null,
      previous: offset > 0 ? `/me/todo-items?offset=${Math.max(0, offset - limit)}` : null,
      data: page,
    });
  }),

  http.post("/api/me/todo-items", async ({ request }) => {
    const body = (await request.json()) as NewTodoItem;
    if (!body?.title || body.title.trim().length === 0) {
      return HttpResponse.json(
        { code: 400, message: "title is required" },
        { status: 400 },
      );
    }
    const created: TodoItem = {
      id: String(nextId++),
      title: body.title,
      done: false,
      createdAt: new Date().toISOString(),
    };
    todos = [...todos, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch("/api/me/todo-items/:id", async ({ request, params }) => {
    const existing = todos.find((t) => t.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: 404, message: "no such todo item" }, { status: 404 });
    }
    const body = (await request.json()) as TodoItemUpdate;
    const updated: TodoItem = {
      ...existing,
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.done !== undefined ? { done: body.done } : {}),
    };
    todos = todos.map((t) => (t.id === updated.id ? updated : t));
    return HttpResponse.json(updated);
  }),

  http.delete("/api/me/todo-items/:id", ({ params }) => {
    const before = todos.length;
    todos = todos.filter((t) => t.id !== params.id);
    return before === todos.length
      ? HttpResponse.json({ code: 404, message: "no such todo item" }, { status: 404 })
      : new HttpResponse(null, { status: 204 });
  }),
];
