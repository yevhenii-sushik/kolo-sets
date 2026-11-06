import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Шрифты бренда раздаются с нашего сервера (latin, latin-ext, cyrillic — по unicode-range)
import "@fontsource-variable/onest";
import "@fontsource-variable/unbounded";
import "./index.css";
import App from "./App.tsx";
import { setupServiceWorker } from "./utils/registerServiceWorker";

setupServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
