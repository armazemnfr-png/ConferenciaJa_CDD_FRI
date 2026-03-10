import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Isso registra o service worker automaticamente
registerSW({ immediate: true });
createRoot(document.getElementById("root")!).render(<App />);
