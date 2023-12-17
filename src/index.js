import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { UserAuthContextProvider } from "./context/UserAuthContext";

// Create a root for rendering the application into the "root" element
const root = ReactDOM.createRoot(document.getElementById('root'));
// Wrap the entire application in BrowserRouter to enable routing
root.render(
  
    <BrowserRouter>
      <UserAuthContextProvider>
        <App />
      </UserAuthContextProvider>
    </BrowserRouter>

);