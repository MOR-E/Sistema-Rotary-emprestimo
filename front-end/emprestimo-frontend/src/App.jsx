// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import RecoverPassword from "./pages/RecoverPassword";
import ResetPassword from "./pages/ResetPassword";
import LendingList from "./pages/LendingList";
import LendingCreate from "./pages/LendingCreate";
import LendingDetails from "./pages/LendingDetails";
import PersonList from "./pages/PersonList";
import ItemList from "./pages/ItemList";
import UserList from "./pages/UserList";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recover-password" element={<RecoverPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      
      {/* Empréstimos */}
      <Route
        path="/emprestimos"
        element={
          <ProtectedRoute>
            <LendingList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emprestimos/novo"
        element={
          <ProtectedRoute>
            <LendingCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emprestimos/:id"
        element={
          <ProtectedRoute>
            <LendingDetails />
          </ProtectedRoute>
        }
      />

      {/* Pessoas */}
      <Route
        path="/pessoas"
        element={
          <ProtectedRoute>
            <PersonList />
          </ProtectedRoute>
        }
      />

      {/* Itens */}
      <Route
        path="/itens"
        element={
          <ProtectedRoute>
            <ItemList />
          </ProtectedRoute>
        }
      />

      {/* Usuários (Admin) */}
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <UserList />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<div className="m-5">Página não encontrada</div>}
      />
    </Routes>
  );
}
