// wireframes.dsl `screen TodoList` — "the user's private list of todo items".
// Loads GET /me/todo-items; mark done/not-done is PATCH, delete is DELETE,
// both gated with todo-items:manage (the User role holds both handles).
import { useCallback, useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  PageContent,
  PageTitle,
  ListingTable,
  Stack,
} from "@wso2/oxygen-ui";
import { Plus, Trash2 } from "@wso2/oxygen-ui-icons-react";
import { todoApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/todo-api";

type TodoItem = components["schemas"]["TodoItem"];

export function TodoListPage(): JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<TodoItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    void todoApi.GET("/me/todo-items", { params: { query: { limit: 100 } } }).then(
      ({ data, error: err }) => {
        if (err) {
          setError("Could not load your todos. Please try again.");
          return;
        }
        setItems(data?.data ?? []);
      },
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleDone(item: TodoItem): Promise<void> {
    setPendingId(item.id);
    const { data, error: err } = await todoApi.PATCH("/me/todo-items/{todoItemId}", {
      params: { path: { todoItemId: item.id } },
      body: { done: !item.done },
    });
    setPendingId(null);
    if (err) {
      setError("Could not update that todo. Please try again.");
      return;
    }
    if (data) setItems((prev) => (prev ?? []).map((t) => (t.id === data.id ? data : t)));
  }

  async function remove(item: TodoItem): Promise<void> {
    setPendingId(item.id);
    const { error: err } = await todoApi.DELETE("/me/todo-items/{todoItemId}", {
      params: { path: { todoItemId: item.id } },
    });
    setPendingId(null);
    if (err) {
      setError("Could not delete that todo. Please try again.");
      return;
    }
    setItems((prev) => (prev ?? []).filter((t) => t.id !== item.id));
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>My Todos</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /me/todo-items">
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => navigate("/todos/new")}
            >
              Add Todo
            </Button>
          </Can>
        </PageTitle.Actions>
      </PageTitle>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {items === null ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Title</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell align="right">Actions</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {items.map((item) => (
                <ListingTable.Row key={item.id}>
                  <ListingTable.Cell>{item.title}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip
                      label={item.done ? "Done" : "Open"}
                      color={item.done ? "success" : "default"}
                      size="small"
                    />
                  </ListingTable.Cell>
                  <ListingTable.Cell align="right">
                    <ListingTable.RowActions>
                      <Can op="PATCH /me/todo-items/{todoItemId}">
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={pendingId === item.id}
                          onClick={() => void toggleDone(item)}
                        >
                          {item.done ? "Mark not done" : "Mark done"}
                        </Button>
                      </Can>
                      <Can op="DELETE /me/todo-items/{todoItemId}">
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Trash2 size={16} />}
                          disabled={pendingId === item.id}
                          onClick={() => void remove(item)}
                        >
                          Delete
                        </Button>
                      </Can>
                    </ListingTable.RowActions>
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {items.length === 0 ? (
            <ListingTable.EmptyState
              title="Nothing here yet"
              description="Nothing here yet? Add your first todo above."
            />
          ) : null}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}
