import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "@/components/AuthContext.jsx";
import { DimModeProvider } from '/components/DimModeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DimModeProvider>  {/* ADD THIS */}
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </DimModeProvider>  {/* AND THIS */}
  </React.StrictMode>
);


