screen TodoList "The user's private list of todo items"
  navbar "Todo App"
  row
    heading "My Todos"
    right
    button "Add Todo" primary -> AddTodo
  table "Title | Status | Actions"
    row "Buy groceries | Open | Mark done · Delete"
    row "Finish report | Done | Mark not done · Delete"
  text "Nothing here yet? Add your first todo above." muted

screen AddTodo "Add a new todo item"
  navbar "Todo App"
  heading "Add Todo"
  input "Title"
  row
    right
    button "Cancel" -> TodoList
    button "Save" primary -> TodoList

flow "Manage my todos"
  role "User"
  description "A signed-in user views, adds, completes and removes their own todo items"
  TodoList
  AddTodo
