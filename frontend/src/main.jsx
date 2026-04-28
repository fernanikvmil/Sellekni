import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

// Redirect all /api/ calls to the backend in production
const _originalFetch = window.fetch.bind(window);
window.fetch = (url, options) => {
  if (typeof url === "string" && url.startsWith("/api/")) {
    url = `${import.meta.env.VITE_BACKEND_URL || ""}${url}`;
  }
  return _originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);