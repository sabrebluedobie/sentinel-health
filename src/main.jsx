// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "@/pages/App.jsx";
import SignIn from "@/pages/SignIn.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import "@/index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/log-migraine" element={<LogMigraine />} />
      <Route path="/log-glucose" element={<LogGlucose />} />
      <Route path="/log-sleep" element={<LogSleep />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);