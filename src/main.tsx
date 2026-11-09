import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Шрифты бренда раздаются с нашего сервера (latin, latin-ext, cyrillic — по unicode-range)
import "@fontsource-variable/onest";
import "@fontsource-variable/nunito";
import "./index.css";
import App from "./App.tsx";
import { setupServiceWorker } from "./utils/registerServiceWorker";
import { APP_TITLE } from "./utils/pageMeta";

setupServiceWorker();
// Длинный заголовок index.html — для поиска и превью ссылок; во вкладке приложения — «Kolo»
document.title = APP_TITLE;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
