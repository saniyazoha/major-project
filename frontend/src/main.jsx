import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";

const THEME_STORAGE_KEY = "lectai-theme";

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

const initialTheme =
  savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";

document.documentElement.setAttribute("data-theme", initialTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
