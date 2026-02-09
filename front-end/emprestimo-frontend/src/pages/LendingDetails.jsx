// src/pages/LendingDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { protectedFetch } from "../services/api";
import "./LendingDetails.css";

export default function LendingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [lending, setLending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [returning, setReturning] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);

  // Dados do usuário logado
  const tokenWrapper = window.localStorage.getItem("tokenWrapper");
  let currentUserId = null;
  let isAdmin = false;
  
  if (tokenWrapper) {
    try {
      const parsed = JSON.parse(tokenWrapper);
      currentUserId = parsed.id;
      isAdmin = parsed.admin === 1 || parsed.admin === true;
    } catch (e) {
      console.error("Erro ao parsear token:", e);
    }
  }

  useEffect(() => {
    fetchLending();
  }, [id]);

  async function fetchLending() {
    setLoading(true);
    const { ok, data } = await protectedFetch(`/lending?patrimonio=`);
    
    if (ok && Array.isArray(data)) {
      const found = data.find(l => l.id === parseInt(id));
      if (found) {
        setLending(found);
      } else {
        setError("Empréstimo não encontrado.");
      }
    } else {
      setError("Erro ao carregar empréstimo.");
    }
    setLoading(false);
  }

  // Verifica se o usuário pode fazer devolução
  const canReturn = isAdmin || (lending && lending.requisitanteId === currentUserId);

  function handleToggleItem(itemId) {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(i => i !== itemId);
      }
      return [...prev, itemId];
    });
  }

  function handleSelectAllPending() {
    if (!lending?.itens) return;
    const pendingIds = lending.itens
      .filter(i => i.status === "pendente")
      .map(i => i.id_item_patrimonio);
    setSelectedItems(pendingIds);
  }

  async function handleReturn() {
    if (selectedItems.length === 0) {
      setError("Selecione pelo menos um item para devolver.");
      return;
    }

    setReturning(true);
    setError("");

    try {
      // Cria datetime com horário atual local (navegador já está no fuso de Brasília)
      const now = new Date();
      const today = now.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
      
      let dataComHorario;
      if (returnDate === today) {
        // Usa horário local do navegador
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        dataComHorario = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } else {
        // Data diferente de hoje - mantém 00:00:00
        dataComHorario = returnDate + " 00:00:00";
      }

      const payload = {
        dataDevolucao: dataComHorario,
        itens: selectedItems.map(id => ({ id_item_patrimonio: id }))
      };

      const { ok, data } = await protectedFetch(`/return?id=${id}`, "POST", payload);

      if (ok && data.status) {
        // Recarrega os dados
        await fetchLending();
        setSelectedItems([]);
      } else {
        setError(data?.err || "Erro ao registrar devolução.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setReturning(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  }

  function getStatusBadge(status) {
    const statusMap = {
      pendente: { label: "Pendente", className: "status-pending" },
      devolvido: { label: "Devolvido", className: "status-returned" },
    };
    const info = statusMap[status] || { label: status, className: "status-default" };
    return <span className={`status-badge ${info.className}`}>{info.label}</span>;
  }

  if (loading) {
    return (
      <Layout>
        <div className="lending-details-page">
          <div className="loading-state">Carregando detalhes do empréstimo...</div>
        </div>
      </Layout>
    );
  }

  if (!lending) {
    return (
      <Layout>
        <div className="lending-details-page">
          <div className="error-state">
            <p>{error || "Empréstimo não encontrado."}</p>
            <button onClick={() => navigate("/emprestimos")} className="btn-back">
              Voltar para lista
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const pendingItems = lending.itens?.filter(i => i.status === "pendente") || [];
  const returnedItems = lending.itens?.filter(i => i.status === "devolvido") || [];

  return (
    <Layout>
      <div className="lending-details-page">
        <header className="page-header">
          <button 
            type="button" 
            className="btn-back"
            onClick={() => navigate("/emprestimos")}
          >
            ← Voltar
          </button>
          <div className="header-content">
            <h1 className="page-title">Empréstimo #{lending.id}</h1>
            <div className="header-status">
              {getStatusBadge(lending.status)}
            </div>
          </div>
        </header>

        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Informações Gerais */}
        <div className="info-card">
          <h2 className="card-title">Informações do Empréstimo</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Data do Empréstimo</span>
              <span className="info-value">{formatDate(lending.dataEmprestimo)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Data de Devolução</span>
              <span className="info-value">{formatDate(lending.dataDevolucao)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Pessoa (ID)</span>
              <span className="info-value">{lending.pessoaId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Requisitante (ID)</span>
              <span className="info-value">{lending.requisitanteId}</span>
            </div>
          </div>
        </div>

        {/* Itens Pendentes */}
        {pendingItems.length > 0 && (
          <div className="items-card pending-card">
            <div className="card-header">
              <h2 className="card-title">Itens Pendentes ({pendingItems.length})</h2>
              {canReturn && (
                <button 
                  type="button" 
                  className="btn-select-all"
                  onClick={handleSelectAllPending}
                >
                  Selecionar Todos
                </button>
              )}
            </div>
            
            <div className="items-list">
              {pendingItems.map(item => (
                <div 
                  key={item.id_item_patrimonio} 
                  className={`item-row ${selectedItems.includes(item.id_item_patrimonio) ? "selected" : ""}`}
                >
                  {canReturn && (
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id_item_patrimonio)}
                      onChange={() => handleToggleItem(item.id_item_patrimonio)}
                    />
                  )}
                  <div className="item-info">
                    <span className="item-patrimony">{item.patrimonio}</span>
                    <span className="item-id">ID: {item.id_item_patrimonio}</span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>

            {/* Formulário de Devolução */}
            {canReturn && selectedItems.length > 0 && (
              <div className="return-form">
                <div className="return-form-row">
                  <div className="form-group">
                    <label>Data de Devolução</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-return"
                    onClick={handleReturn}
                    disabled={returning}
                  >
                    {returning ? "Processando..." : `Devolver ${selectedItems.length} item(s)`}
                  </button>
                </div>
              </div>
            )}

            {!canReturn && (
              <div className="permission-notice">
                ⚠️ Você não tem permissão para registrar devolução neste empréstimo.
              </div>
            )}
          </div>
        )}

        {/* Itens Devolvidos */}
        {returnedItems.length > 0 && (
          <div className="items-card returned-card">
            <h2 className="card-title">Itens Devolvidos ({returnedItems.length})</h2>
            <div className="items-list">
              {returnedItems.map(item => (
                <div key={item.id_item_patrimonio} className="item-row returned">
                  <div className="item-info">
                    <span className="item-patrimony">{item.patrimonio}</span>
                    <span className="item-id">ID: {item.id_item_patrimonio}</span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
