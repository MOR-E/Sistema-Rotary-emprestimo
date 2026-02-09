// src/components/Layout.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Layout.css";

export default function Layout({ children }) {
  const navigate = useNavigate();

  // Obtém dados do usuário do localStorage
  const tokenWrapper = window.localStorage.getItem("tokenWrapper");
  let userEmail = "";
  let userName = "";
  let isAdmin = false;
  
  if (tokenWrapper) {
    try {
      const parsed = JSON.parse(tokenWrapper);
      userEmail = parsed.email || "";
      userName = parsed.nome || userEmail.split("@")[0];
      isAdmin = parsed.admin === 1 || parsed.admin === true;
    } catch (e) {
      console.error("Erro ao parsear token:", e);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("tokenWrapper");
    navigate("/login");
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">Rotary</h2>
          <span className="sidebar-subtitle">Sistema de Empréstimos</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Início</span>
          </NavLink>

          <NavLink
            to="/emprestimos"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Empréstimos</span>
          </NavLink>

          <NavLink
            to="/pessoas"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Pessoas</span>
          </NavLink>

          <NavLink
            to="/itens"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Itens</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">Usuários</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{userName}</span>
              <span className="user-email">{userEmail}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sair">
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
