// Wire-facing records mirror openapi.yaml exactly (paths, schemas, status
// codes are the contract). TodoItemRow is the internal shape a database row
// is read into; it is never returned to a caller as-is — userId never leaves
// this service, since a request is always scoped to its own caller already.

import ballerina/http;
import ballerina/time;

public type TodoItem record {|
    string id;
    string title;
    boolean done;
    string createdAt;
|};

# An inbound create payload — open, so an extra field a client sends is
# tolerated rather than rejected.
#
# + title - the new item's title; rejected with 400 when blank
public type NewTodoItem record {
    string title;
};

# An inbound update payload — open, same reasoning as `NewTodoItem`.
#
# + title - the new title, when the caller is changing it; rejected with 400 when blank
# + done - the new completion state, when the caller is changing it
public type TodoItemUpdate record {
    string title?;
    boolean done?;
};

# A page of the caller's todo items — the `GET /me/todo-items` 200 envelope.
#
# + count - total matching items
# + next - relative URI of the next page, or `()` when this is the last page
# + previous - relative URI of the previous page, or `()` when this is the first page
# + data - the items on this page
public type TodoItemPage record {|
    int count;
    string? next;
    string? previous;
    TodoItem[] data;
|};

# + code - HTTP or application error code
# + message - short human-readable label
# + description - detailed explanation
# + moreInfo - URI to documentation
public type ApiError record {|
    int code;
    string message;
    string description?;
    string moreInfo?;
|};

public type ErrorBadRequest record {|
    *http:BadRequest;
    ApiError body;
|};

public type ErrorUnauthorized record {|
    *http:Unauthorized;
    ApiError body;
|};

public type ErrorNotFound record {|
    *http:NotFound;
    ApiError body;
|};

# One row of the `todo_items` table, scoped to a single caller by query.
#
# + id - the row's primary key
# + title - the item's title
# + done - the item's completion state
# + createdAt - when the row was inserted
type TodoItemRow record {|
    string id;
    string title;
    boolean done;
    time:Utc createdAt;
|};
