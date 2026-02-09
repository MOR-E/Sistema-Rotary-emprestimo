// src/pages/UserList.jsx
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { protectedFetch } from "../services/api";
import "./UserList.css";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    admin: false,
    situacao: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const { ok, data } = await protectedFetch(`/user${query}`);
      console.log("Users response:", { ok, data });
      if (ok) {
        // Backend retorna {status: true, usuarios: [...]}
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.usuarios)) {
          setUsers(data.usuarios);
        } else {
          setUsers([]);
        }
      } else {
        console.error("Failed to fetch users:", data);
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchUsers();
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({
      nome: "",
      telefone: "",
      email: "",
      senha: "",
      admin: false,
      situacao: true,
    });
    setError("");
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setFormData({
      nome: user.nome || "",
      telefone: user.telefone || "",
      email: user.email || "",
      senha: "",
      admin: user.admin === 1 || user.admin === true,
      situacao: user.situacao === 1 || user.situacao === true,
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
      const payload = {
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        admin: formData.admin ? 1 : 0,
        situacao: formData.situacao,
      };

      if (!editingUser) {
        payload.senha = formData.senha;
      }

      if (editingUser) {
        result = await protectedFetch(`/user?id=${editingUser.id}`, "PUT", payload);
      } else {
        result = await protectedFetch("/user", "POST", payload);
      }

      console.log("Save user result:", result);

      if (result.ok && (result.data?.status || result.data?.usuarios)) {
        setShowModal(false);
        if (result.data.usuarios) {
          setUsers(result.data.usuarios);
        } else {
          fetchUsers();
        }
      } else {
        setError(result.data?.err || result.data?.error || "Erro ao salvar usuário.");
      }
    } catch (err) {
      console.error("Error saving user:", err);
      setError("Erro de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="user-list-page">
        <header className="page-header">
          <div className="header-content">
            <h1 className="page-title">Usuários</h1>
            <p className="page-subtitle">Gerencie os usuários do sistema</p>
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            + Novo Usuário
          </button>
        </header>

        <form className="search-card" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-search">🔍 Buscar</button>
        </form>

        <div className="table-card">
          {loading ? (
            <div className="table-loading">Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div className="table-empty">
              <span className="empty-icon">👤</span>
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Tipo</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="td-id">#{user.id}</td>
                    <td className="td-name">{user.nome}</td>
                    <td>{user.email}</td>
                    <td>{user.telefone || "-"}</td>
                    <td>
                      <span className={`type-badge ${user.admin ? "admin" : "user"}`}>
                        {user.admin ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.situacao ? "active" : "inactive"}`}>
                        {user.situacao ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-edit"
                        onClick={() => openEditModal(user)}
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

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>{editingUser ? "Editar Usuário" : "Novo Usuário"}</h2>
              
              {error && <div className="modal-error">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!!editingUser}
                  />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                  />
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label>Senha *</label>
                    <input
                      type="password"
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      required={!editingUser}
                    />
                  </div>
                )}

                <div className="form-row-checkboxes">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="admin"
                        checked={formData.admin}
                        onChange={handleChange}
                      />
                      Administrador
                    </label>
                  </div>

                  {editingUser && (
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="situacao"
                          checked={formData.situacao}
                          onChange={handleChange}
                        />
                        Usuário Ativo
                      </label>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save" disabled={saving}>
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
