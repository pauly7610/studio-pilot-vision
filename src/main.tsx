import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { ColorBlindFilters } from "@/components/ColorBlindFilters";

createRoot(document.getElementById("root")!).render(
  <AccessibilityProvider>
    <ColorBlindFilters />
    <App />
  </AccessibilityProvider>
);
