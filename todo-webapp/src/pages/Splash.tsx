// Rendered while the session resolves — before AuthzProvider has an answer,
// and while a signed-out visitor's redirect to Thunder SSO is under way. No
// todo content is ever reachable from here (the acceptance criterion: an
// unauthenticated visitor cannot see the todo list until signed in).
import type { JSX } from "react";
import { Box, CircularProgress, Stack, Typography } from "@wso2/oxygen-ui";
import { APP_NAME } from "../appName";

export function Splash(): JSX.Element {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography variant="h6">{APP_NAME}</Typography>
        <Typography variant="body2" color="text.secondary">
          Checking your session…
        </Typography>
      </Stack>
    </Box>
  );
}
