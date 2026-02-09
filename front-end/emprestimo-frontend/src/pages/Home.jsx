// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import "./Home.css";

export default function Home() {
  // Dados do usuário logado
  const tokenWrapper = window.localStorage.getItem("tokenWrapper");
  let userName = "Usuário";
  
  if (tokenWrapper) {
    try {
      const parsed = JSON.parse(tokenWrapper);
      userName = parsed.nome || parsed.email?.split("@")[0] || "Usuário";
    } catch (e) {
      console.error("Erro ao parsear token:", e);
    }
  }

  return (
    <Layout>
      <div className="home-page">
        <div className="welcome-card">
          <h1 className="welcome-title">Bem-vindo(a), {userName}!</h1>
          <p className="welcome-subtitle">
            Sistema de Gerenciamento de Empréstimos - Rotary Club
          </p>
        </div>

        <div className="quick-actions">
          <h2 className="section-title">Acesso Rápido</h2>
          <div className="actions-grid">
            <Link to="/emprestimos" className="action-card">
              <span className="action-icon">📋</span>
              <span className="action-title">Ver Empréstimos</span>
              <span className="action-description">Visualize todos os empréstimos</span>
            </Link>

            <Link to="/emprestimos/novo" className="action-card highlight">
              <span className="action-icon">➕</span>
              <span className="action-title">Novo Empréstimo</span>
              <span className="action-description">Registrar um novo empréstimo</span>
            </Link>

            <Link to="/pessoas" className="action-card">
              <span className="action-icon">👥</span>
              <span className="action-title">Pessoas</span>
              <span className="action-description">Gerenciar cadastro de pessoas</span>
            </Link>

            <Link to="/itens" className="action-card">
              <span className="action-icon">📦</span>
              <span className="action-title">Itens</span>
              <span className="action-description">Gerenciar itens e patrimônios</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
