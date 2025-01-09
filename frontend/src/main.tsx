import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Home from "./pages/Home";
import Profile from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";
import "./index.css";
import { Toaster } from "./components/ui/toaster.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Home />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
