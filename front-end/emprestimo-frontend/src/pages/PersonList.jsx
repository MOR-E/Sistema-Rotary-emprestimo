// src/pages/PersonList.jsx
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { protectedFetch } from "../services/api";
import "./PersonList.css";

export default function PersonList() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    telefone1: "",
    telefone2: "",
    cpf: "",
    rg: "",
    cep: "",
    rua: "",
    bairro: "",
    complemento: "",
    numero: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPersons();
  }, []);

  async function fetchPersons() {
    setLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const { ok, data } = await protectedFetch(`/person${query}`);
    if (ok && Array.isArray(data)) {
      setPersons(data);
    }
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchPersons();
  }

  function openCreateModal() {
    setEditingPerson(null);
    setFormData({
      nome: "",
      telefone1: "",
      telefone2: "",
      cpf: "",
      rg: "",
      cep: "",
      rua: "",
      bairro: "",
      complemento: "",
      numero: "",
    });
    setError("");
    setShowModal(true);
  }

  function openEditModal(person) {
    setEditingPerson(person);
    setFormData({
      nome: person.nome || "",
      telefone1: person.telefone1 || "",
      telefone2: person.telefone2 || "",
      cpf: person.cpf || "",
      rg: person.rg || "",
      cep: person.cep || "",
      rua: person.rua || "",
      bairro: person.bairro || "",
      complemento: person.complemento || "",
      numero: person.numero || "",
      situacao: person.situacao,
    });
    setError("");
    setShowModal(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      let result;
      if (editingPerson) {
        result = await protectedFetch(`/person?id=${editingPerson.id}`, "PUT", formData);
      } else {
        result = await protectedFetch("/person", "POST", formData);
      }

      if (result.ok && result.data?.status) {
        setShowModal(false);
        if (result.data.pessoas) {
          setPersons(result.data.pessoas);
        } else {
          fetchPersons();
        }
      } else {
        setError(result.data?.err || result.data?.error || "Erro ao salvar pessoa.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="person-list-page">
        <header className="page-header">
          <div className="header-content">
            <h1 className="page-title">Pessoas</h1>
            <p className="page-subtitle">Gerencie o cadastro de pessoas</p>
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            + Nova Pessoa
          </button>
        </header>

        {/* Search */}
        <form className="search-card" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-search">🔍 Buscar</button>
        </form>

        {/* Table */}
        <div className="table-card">
          {loading ? (
            <div className="table-loading">Carregando pessoas...</div>
          ) : persons.length === 0 ? (
            <div className="table-empty">
              <span className="empty-icon">👥</span>
              <p>Nenhuma pessoa encontrada</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {persons.map(person => (
                  <tr key={person.id}>
                    <td className="td-id">#{person.id}</td>
                    <td className="td-name">{person.nome}</td>
                    <td>{person.cpf || "-"}</td>
                    <td>{person.telefone1 || "-"}</td>
                    <td>
                      <span className={`status-badge ${person.situacao === 1 || person.situacao === true ? "active" : "inactive"}`}>
                        {person.situacao === 1 || person.situacao === true ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-edit"
                        onClick={() => openEditModal(person)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>{editingPerson ? "Editar Pessoa" : "Nova Pessoa"}</h2>
              
              {error && <div className="modal-error">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group full">
                    <label>Nome *</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>CPF *</label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>RG</label>
                    <input
                      type="text"
                      name="rg"
                      value={formData.rg}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Telefone 1</label>
                    <input
                      type="text"
                      name="telefone1"
                      value={formData.telefone1}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefone 2</label>
                    <input
                      type="text"
                      name="telefone2"
                      value={formData.telefone2}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>CEP</label>
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rua</label>
                    <input
                      type="text"
                      name="rua"
                      value={formData.rua}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Bairro</label>
                    <input
                      type="text"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Número</label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Complemento</label>
                    <input
                      type="text"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {editingPerson && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="situacao"
                          checked={formData.situacao === 1 || formData.situacao === true}
                          onChange={handleChange}
                        />
                        Pessoa Ativa
                      </label>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
