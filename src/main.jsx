import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "@/components/AuthContext"; // if you use "@", keep the Vite alias
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error('Missing <div id="root"> in index.html');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
