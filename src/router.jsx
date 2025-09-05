import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "@/pages/App.jsx";
import SignIn from "@/pages/SignIn.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/sign-in", element: <SignIn /> },
  { path: "/log-migraine", element: <LogMigraine /> },
  { path: "/log-sleep", element: <LogSleep /> },
  { path: "/log-glucose", element: <LogGlucose /> },
]);