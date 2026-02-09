// src/pages/LendingList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { protectedFetch } from "../services/api";
import "./LendingList.css";

export default function LendingList() {
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    pessoa: "",
    patrimonio: "",
  });

  useEffect(() => {
    fetchLendings();
  }, []);

  async function fetchLendings() {
    setLoading(true);
    let queryParams = [];
    if (filters.pessoa) queryParams.push(`pessoa=${filters.pessoa}`);
    if (filters.patrimonio) queryParams.push(`patrimonio=${encodeURIComponent(filters.patrimonio)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    const { ok, data } = await protectedFetch(`/lending${queryString}`);
    
    if (ok && Array.isArray(data)) {
      setLendings(data);
    } else {
      setLendings([]);
    }
    setLoading(false);
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchLendings();
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  }

  function getStatusBadge(status) {
    const statusMap = {
      pendente: { label: "Pendente", className: "status-pending" },
      devolvido: { label: "Devolvido", className: "status-returned" },
    };
    const info = statusMap[status] || { label: status, className: "status-default" };
    return <span className={`status-badge ${info.className}`}>{info.label}</span>;
  }

  return (
    <Layout>
      <div className="lending-list-page">
        <header className="page-header">
          <div className="header-content">
            <h1 className="page-title">Empréstimos</h1>
            <p className="page-subtitle">Gerencie todos os empréstimos de itens</p>
          </div>
          <Link to="/emprestimos/novo" className="btn-primary">
            + Novo Empréstimo
          </Link>
        </header>

        {/* Filters */}
        <form className="filters-card" onSubmit={handleSearch}>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Patrimônio</label>
              <input
                type="text"
                name="patrimonio"
                value={filters.patrimonio}
                onChange={handleFilterChange}
                placeholder="Buscar por patrimônio..."
              />
            </div>
          </div>
          <button type="submit" className="btn-filter">
            🔍 Buscar
          </button>
        </form>

        {/* Table */}
        <div className="table-card">
          {loading ? (
            <div className="table-loading">Carregando empréstimos...</div>
          ) : lendings.length === 0 ? (
            <div className="table-empty">
              <span className="empty-icon">📋</span>
              <p>Nenhum empréstimo encontrado</p>
              <Link to="/emprestimos/novo" className="btn-secondary">
                Criar primeiro empréstimo
              </Link>
            </div>
          ) : (
            <table className="lending-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data Empréstimo</th>
                  <th>Data Devolução</th>
                  <th>Status</th>
                  <th>Pessoa ID</th>
                  <th>Itens</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lendings.map(lending => (
                  <tr key={lending.id}>
                    <td className="td-id">#{lending.id}</td>
                    <td>{formatDate(lending.dataEmprestimo)}</td>
                    <td>{formatDate(lending.dataDevolucao)}</td>
                    <td>{getStatusBadge(lending.status)}</td>
                    <td>{lending.pessoaId}</td>
                    <td>
                      <span className="items-count">
                        {lending.itens?.length || 0} item(s)
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={`/emprestimos/${lending.id}`} 
                        className="btn-details"
                      >
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
