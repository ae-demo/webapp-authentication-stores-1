// wireframes.dsl `screen AddTodo` — a form to capture a title and save a new
// todo item, or cancel back to TodoList. Empty title must not submit. A
// signed-in screen with no load call (`loads: null` in src/authz/screens.ts);
// the Save button's call is gated with <Can op="POST /me/todo-items">.
import { useState, type JSX } from "react";
import { useNavigate } from "react-router";
import { Alert, Button, Form, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { todoApi } from "../api";
import { Can } from "../authz/gates";

export function AddTodoPage(): JSX.Element {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && !saving;

  async function save(): Promise<void> {
    if (!canSubmit) return; // empty title must not submit
    setSaving(true);
    setError(null);
    const { error: err } = await todoApi.POST("/me/todo-items", {
      body: { title: trimmedTitle },
    });
    setSaving(false);
    if (err) {
      setError("Could not save that todo. Please try again.");
      return;
    }
    navigate("/todos");
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Add Todo</PageTitle.Header>
      </PageTitle>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Form.Section>
        <Form.Stack spacing={3}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            fullWidth
          />
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined" onClick={() => navigate("/todos")}>
              Cancel
            </Button>
            <Can op="POST /me/todo-items">
              <Button variant="contained" disabled={!canSubmit} onClick={() => void save()}>
                Save
              </Button>
            </Can>
          </Stack>
        </Form.Stack>
      </Form.Section>
    </PageContent>
  );
}
