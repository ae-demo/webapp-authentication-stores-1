# webapp-authentication-stores-1 — PRD

## Problem Statement

People juggle daily tasks across sticky notes, chat threads and other apps not built for the job, and lose track of what still needs doing. They need one simple, personal place to keep a list of tasks that is theirs alone and is there whenever they sign back in.

## Solution

A single-page web application where anyone can sign in, keep a private list of todo items, and mark them done or remove them as they go. Every todo is stored durably and is visible only to the user who created it.

## Actors

- **User** — any signed-in individual who creates, views, completes and deletes the todo items in their own private list. There is no separate admin or moderator role.

## User Stories

1. As a user, I want to sign in securely, so that my todo list is mine alone and is there when I come back.
2. As a user, I want to add a todo item with a title, so that I can capture something I need to do.
3. As a user, I want to view my list of todo items, so that I can see everything I still need to do.
4. As a user, I want to mark a todo item as done or not-done, so that I can track what I've completed.
5. As a user, I want to delete a todo item, so that I can remove tasks I no longer need.

## Product Decisions

- Sign-in is via Thunder, the platform's single sign-on identity provider — every web app in this organization signs users in this way.
- Each user's todo list is strictly private: a user only ever sees and manages their own todo items, never another user's.
- A todo item is intentionally basic: a title, a done/not-done state, and the ability to delete it. No description, due date, priority or other fields.
- There is a single actor type (User); no admin or oversight role is part of this product.

## Out of Scope

- Sharing, collaborating on, or otherwise exposing a todo item or list to another user.
- Rich todo fields: descriptions, due dates, priorities, tags or categories.
- An admin or support role that can view or manage other users' data.
- Notifications or reminders of any kind.
- A native mobile app (this is a web application only).

## Open Questions

None at this time — all decisions needed to build the initial product are settled above.