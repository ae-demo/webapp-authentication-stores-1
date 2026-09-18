// The app chrome — every gated screen renders inside it
// (oxygen-ui-design-system: the sample's AppLayout, adjusted to this
// platform). wireframes.dsl draws only `navbar "Todo App"` with no sidebar
// items on either screen, so the rail carries the one navigable destination
// — "My Todos" — gated exactly like every other nav item: <Can op="…">
// wraps it, which is what makes the rail reproduce the wireframe's picture
// and still cover a caller who unlocks nothing (NoAccess, rendered instead
// of this shell entirely — see src/App.tsx).

import type { JSX } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  AppShell as OxygenAppShell,
  Footer,
  Header,
  Sidebar,
  UserMenu,
} from "@wso2/oxygen-ui";
import { ListTodo, LogOut } from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { Can, useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const active = pathname.startsWith("/todos/new") ? "addtodo" : "todolist";

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header name={username || "Signed in"} email="" />
              <UserMenu.Logout icon={<LogOut size={16} />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              <Can op="GET /me/todo-items">
                <Sidebar.Item id="todolist" link={<Link to="/todos" />}>
                  <Sidebar.ItemIcon>
                    <ListTodo size={18} />
                  </Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>My Todos</Sidebar.ItemLabel>
                </Sidebar.Item>
              </Can>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
