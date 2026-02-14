/**
 * Hands over control to the `App` react
 * component by attaching it to the 'root'
 * DOM component then rendering it.
 */

import { createRoot } from "react-dom/client";
import { App } from "./components/App";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root mount element.");
}

createRoot(root).render(<App />);
