import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./pages/App.jsx";
import { AuthProvider } from "@/components/AuthContext.jsx";
import { DimModeProvider } from '@/components/DimModeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DimModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </DimModeProvider>
  </StrictMode>
);