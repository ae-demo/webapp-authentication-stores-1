// Implements specs/design/components/todo-api/openapi.yaml exactly: same
// paths, schemas and status codes. The gateway has already enforced the
// operation's scope (todo-items:read / todo-items:manage) before a request
// reaches here — this service holds no operation -> scope table. What it
// still owns is WHICH rows: every operation is scoped to the caller's own
// userId, resolved from the verified gateway assertion and nothing the
// client sends.

import ballerina/http;
import ballerina/sql;

listener http:Listener ep0 = new (9090);

service http:InterceptableService / on ep0 {

    public function createInterceptors() returns AssertionInterceptor => new;

    # The caller's todo items
    #
    # + return - a page of the caller's todo items, or 401 when not signed in
    resource function get me/todo\-items(http:RequestContext ctx, boolean? done, int 'limit = 20, int offset = 0)
            returns TodoItemPage|ErrorUnauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return unauthorized();
        }

        int pageLimit = boundLimit('limit);
        int pageOffset = offset < 0 ? 0 : offset;

        int total = check countTodoItems(caller.userId, done);
        TodoItemRow[] rows = check listTodoItems(caller.userId, done, pageLimit, pageOffset);
        TodoItem[] items = from TodoItemRow row in rows
            select toTodoItem(row);

        string? next = (pageOffset + pageLimit) < total
            ? pageUri(pageLimit, pageOffset + pageLimit, done)
            : ();
        int previousOffset = pageOffset - pageLimit;
        string? previous = pageOffset > 0
            ? pageUri(pageLimit, previousOffset < 0 ? 0 : previousOffset, done)
            : ();

        TodoItemPage result = {count: total, next, previous, data: items};
        return result;
    }

    # Create a todo item for the caller
    #
    # + return - the created todo item, 400 for a blank title, or 401 when not signed in
    resource function post me/todo\-items(http:RequestContext ctx, @http:Payload NewTodoItem payload)
            returns TodoItem|ErrorBadRequest|ErrorUnauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return unauthorized();
        }

        string title = payload.title;
        if title.trim() == "" {
            return badRequest("title must not be blank");
        }

        TodoItemRow row = check insertTodoItem(caller.userId, title);
        return toTodoItem(row);
    }

    # Update the caller's todo item (title or done state)
    #
    # + return - the updated todo item, 400 for a blank title, 401 when not
    #            signed in, or 404 when the item does not exist or is not the caller's
    resource function patch me/todo\-items/[string todoItemId](http:RequestContext ctx, @http:Payload TodoItemUpdate payload)
            returns TodoItem|ErrorBadRequest|ErrorUnauthorized|ErrorNotFound|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return unauthorized();
        }

        string? newTitle = payload?.title;
        if newTitle is string && newTitle.trim() == "" {
            return badRequest("title must not be blank");
        }
        boolean? newDone = payload?.done;

        TodoItemRow|error updated = updateTodoItem(todoItemId, caller.userId, newTitle, newDone);
        if updated is sql:NoRowsError {
            return notFound();
        }
        if updated is error {
            return updated;
        }
        return toTodoItem(updated);
    }

    # Delete the caller's todo item
    #
    # + return - 204 on success, 401 when not signed in, or 404 when the item
    #            does not exist or is not the caller's
    resource function delete me/todo\-items/[string todoItemId](http:RequestContext ctx)
            returns http:NoContent|ErrorUnauthorized|ErrorNotFound|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return unauthorized();
        }

        string|error deleted = deleteTodoItem(todoItemId, caller.userId);
        if deleted is sql:NoRowsError {
            return notFound();
        }
        if deleted is error {
            return deleted;
        }
        return http:NO_CONTENT;
    }
}

isolated function boundLimit(int requested) returns int {
    if requested > 100 {
        return 100;
    }
    if requested < 1 {
        return 1;
    }
    return requested;
}

isolated function pageUri(int pageLimit, int pageOffset, boolean? done) returns string {
    string uri = string `/me/todo-items?limit=${pageLimit}&offset=${pageOffset}`;
    if done is boolean {
        uri = uri + "&done=" + done.toString();
    }
    return uri;
}

isolated function unauthorized() returns ErrorUnauthorized =>
    {body: {code: 401, message: "Not signed in"}};

isolated function badRequest(string message) returns ErrorBadRequest =>
    {body: {code: 400, message}};

isolated function notFound() returns ErrorNotFound =>
    {body: {code: 404, message: "no such todo item for the caller"}};
