import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { LoaderProvider } from "./contexts/loaderContext";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <LoaderProvider>
      <App />
    </LoaderProvider>
  </React.StrictMode>
);

reportWebVitals();
