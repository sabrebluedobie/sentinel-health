import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./pages/App.jsx";

const el = document.getElementById("root");
createRoot(el).render(<App />);