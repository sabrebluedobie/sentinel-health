import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./layout/Layout.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LogMigraine from "./pages/LogMigraine.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import NotFound from "./pages/NotFound.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "log-migraine",
        element: (
          <RequireAuth>
            <LogMigraine />
          </RequireAuth>
        ),
      },
      { path: "sign-in", element: <SignIn /> },
      { path: "sign-up", element: <SignUp /> },
      { path: "*", element: <NotFound /> }, // catch-all
    ],
  },
]);
