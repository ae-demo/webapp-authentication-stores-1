// Every platform-injected value this service reads, in one place. The names
// are the wiring's envBindings for the todo-db platform-resource dependency
// (see workload.yaml) — never a name this service would otherwise reach for.

import ballerina/os;

configurable string todoDbHost = os:getEnv("TODO_DB_HOST");
configurable string todoDbPort = os:getEnv("TODO_DB_PORT");
configurable string todoDbName = os:getEnv("TODO_DB_DBNAME");
configurable string todoDbUser = os:getEnv("TODO_DB_USER");
configurable string todoDbPassword = os:getEnv("TODO_DB_PASSWORD");
