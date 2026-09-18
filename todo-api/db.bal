// Persistence for the one entity this service owns: TodoItem, always scoped
// to its caller's userId. Every query below filters on user_id as well as
// its own primary key, so a row that exists but is not the caller's is
// exactly the same as a row that does not exist — sql:NoRowsError, which a
// resource maps to 404, never 403.

import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

isolated function createDbClient() returns postgresql:Client|error {
    int todoDbPortNumber = check int:fromString(todoDbPort);
    return new (
        host = todoDbHost,
        username = todoDbUser,
        password = todoDbPassword,
        database = todoDbName,
        port = todoDbPortNumber
    );
}

final postgresql:Client dbClient = check createDbClient();

function initTodoItemsTable() returns error? {
    sql:ExecutionResult _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS todo_items (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            done BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL
        )
    `);
}

final () dbReady = check initTodoItemsTable();

# The caller's own row, matched on id AND userId — never id alone.
#
# + id - the todo item id from the path
# + userId - the caller's own id, from the verified gateway assertion
# + return - the row, or `sql:NoRowsError` when it does not exist or is not the caller's
isolated function getOwnedTodoItem(string id, string userId) returns TodoItemRow|error {
    sql:ParameterizedQuery query = `
        SELECT id, title, done, created_at AS "createdAt"
        FROM todo_items
        WHERE id = ${id} AND user_id = ${userId}
    `;
    TodoItemRow row = check dbClient->queryRow(query);
    return row;
}

isolated function countTodoItems(string userId, boolean? done) returns int|error {
    sql:ParameterizedQuery query = `SELECT COUNT(*) FROM todo_items WHERE user_id = ${userId}`;
    if done is boolean {
        query = sql:queryConcat(query, ` AND done = ${done}`);
    }
    int count = check dbClient->queryRow(query);
    return count;
}

isolated function listTodoItems(string userId, boolean? done, int pageLimit, int pageOffset) returns TodoItemRow[]|error {
    sql:ParameterizedQuery query = `
        SELECT id, title, done, created_at AS "createdAt"
        FROM todo_items
        WHERE user_id = ${userId}
    `;
    if done is boolean {
        query = sql:queryConcat(query, ` AND done = ${done}`);
    }
    query = sql:queryConcat(query, ` ORDER BY created_at ASC, id ASC LIMIT ${pageLimit} OFFSET ${pageOffset}`);
    stream<TodoItemRow, sql:Error?> resultStream = dbClient->query(query);
    TodoItemRow[] rows = check from TodoItemRow row in resultStream
        select row;
    check resultStream.close();
    return rows;
}

isolated function insertTodoItem(string userId, string title) returns TodoItemRow|error {
    string id = uuid:createRandomUuid();
    time:Utc createdAt = time:utcNow();
    sql:ExecutionResult _ = check dbClient->execute(`
        INSERT INTO todo_items (id, user_id, title, done, created_at)
        VALUES (${id}, ${userId}, ${title}, false, ${createdAt})
    `);
    TodoItemRow row = {id, title, done: false, createdAt};
    return row;
}

# Updates only the fields the caller supplied, keeping the rest as they were.
# Ownership is settled by `getOwnedTodoItem` first, so a row that is not the
# caller's never reaches the UPDATE statement.
#
# + id - the todo item id from the path
# + userId - the caller's own id
# + title - the new title, or `()` to keep the current one
# + done - the new done state, or `()` to keep the current one
# + return - the row as it stands after the update, or `sql:NoRowsError`
isolated function updateTodoItem(string id, string userId, string? title, boolean? done) returns TodoItemRow|error {
    TodoItemRow existing = check getOwnedTodoItem(id, userId);
    string newTitle = title is string ? title : existing.title;
    boolean newDone = done is boolean ? done : existing.done;
    sql:ExecutionResult _ = check dbClient->execute(`
        UPDATE todo_items SET title = ${newTitle}, done = ${newDone}
        WHERE id = ${id} AND user_id = ${userId}
    `);
    TodoItemRow updated = {id, title: newTitle, done: newDone, createdAt: existing.createdAt};
    return updated;
}

# + id - the todo item id from the path
# + userId - the caller's own id, from the verified gateway assertion
# + return - the deleted row's id, or `sql:NoRowsError` when it did not exist
#            or was not the caller's — nothing was deleted either way
isolated function deleteTodoItem(string id, string userId) returns string|error {
    sql:ParameterizedQuery query = `
        DELETE FROM todo_items WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
    `;
    string deletedId = check dbClient->queryRow(query);
    return deletedId;
}

isolated function toTodoItem(TodoItemRow row) returns TodoItem => {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: time:utcToString(row.createdAt)
};
