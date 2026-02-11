import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./src/App.jsx";
import SignIn from "@/pages/SignIn.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import dexcomAuthorize from "./dexcom/authorize.js";
import dexcomCallback from "./dexcom/callback.js";
import dexcomSync from "./dexcom/sync.js";


export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/sign-in", element: <SignIn /> },
  { path: "/log-migraine", element: <LogMigraine /> },
  { path: "/log-sleep", element: <LogSleep /> },
  { path: "/log-glucose", element: <LogGlucose /> },

  // Dexcom callback/sync should be handled by your backend routes, not React Router.
  // If you need a frontend callback page, add it here as a normal route element.
]);