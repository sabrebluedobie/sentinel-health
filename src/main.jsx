import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

import RoutesView from "./routes.jsx"; // your <Routes> tree (or inline it here)
import ErrorBoundary from "./components/debug/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <RoutesView />
    </BrowserRouter>
  </ErrorBoundary>
);
