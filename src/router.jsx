// src/router.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./layout/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LogMigraine from "./pages/LogMigraine.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import ProtectedRoute from "./providers/ProtectedRoute.jsx"; // or wherever you put it

function RootError() {
  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-gray-600 mt-2">
        If you typed a URL, check the path. Otherwise go back to{" "}
        <a href="/" className="text-blue-600 underline">Dashboard</a>.
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">404 — Not Found</h1>
      <p className="text-gray-600 mt-2">
        The page you’re looking for doesn’t exist.{" "}
        <a href="/" className="text-blue-600 underline">Go home</a>.
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <RootError />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "log-migraine", element: <LogMigraine /> },
    ],
  },
  { path: "/signin", element: <SignIn /> },
  { path: "/signup", element: <SignUp /> },
  { path: "*", element: <NotFound /> },
]);
