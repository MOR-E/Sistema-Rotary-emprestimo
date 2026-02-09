// src/pages/ItemList.jsx
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { protectedFetch } from "../services/api";
import "./ItemList.css";

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("item"); // "item", "patrimonio", "editPatrimonio"
  const [editingItem, setEditingItem] = useState(null);
  const [editingPatrimonio, setEditingPatrimonio] = useState(null);
  const [selectedItemForPatrimonio, setSelectedItemForPatrimonio] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [patrimonios, setPatrimonios] = useState([]);
  const [loadingPatrimonios, setLoadingPatrimonios] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    situacao: true,
  });
  const [patrimonioForm, setPatrimonioForm] = useState({
    patrimonio: "",
    situacao: true,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const { ok, data } = await protectedFetch(`/item${query}`);
    if (ok && Array.isArray(data)) {
      setItems(data);
    }
    setLoading(false);
  }

  async function fetchPatrimonios(itemId) {
    setLoadingPatrimonios(true);
    const { ok, data } = await protectedFetch(`/itemPatrimony?id=${itemId}`);
    if (ok && Array.isArray(data)) {
      setPatrimonios(data);
    } else {
      setPatrimonios([]);
    }
    setLoadingPatrimonios(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchItems();
  }

  function toggleExpand(itemId) {
    if (expandedItem === itemId) {
      setExpandedItem(null);
      setPatrimonios([]);
    } else {
      setExpandedItem(itemId);
      fetchPatrimonios(itemId);
    }
  }

  function openCreateItemModal() {
    setEditingItem(null);
    setModalType("item");
    setFormData({ nome: "", descricao: "", situacao: true });
    setError("");
    setShowModal(true);
  }

  function openEditItemModal(item) {
    setEditingItem(item);
    setModalType("item");
    setFormData({
      nome: item.nome || "",
      descricao: item.descricao || "",
      situacao: item.situacao === 1 || item.situacao === true,
    });
    setError("");
    setShowModal(true);
  }

  function openAddPatrimonioModal(item) {
    setSelectedItemForPatrimonio(item);
    setEditingPatrimonio(null);
    setModalType("patrimonio");
    setPatrimonioForm({ patrimonio: "", situacao: true });
    setError("");
    setShowModal(true);
  }

  function openEditPatrimonioModal(patrimonio) {
    setEditingPatrimonio(patrimonio);
    setModalType("editPatrimonio");
    setPatrimonioForm({
      patrimonio: patrimonio.patrimonio || "",
      situacao: patrimonio.situacao === 1 || patrimonio.situacao === true,
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

  function handlePatrimonioChange(e) {
    const { name, value, type, checked } = e.target;
    setPatrimonioForm(prev => ({
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
      if (editingItem) {
        result = await protectedFetch(`/item?id=${editingItem.id}`, "PUT", formData);
      } else {
        result = await protectedFetch("/item", "POST", formData);
      }

      if (result.ok && result.data?.status) {
        setShowModal(false);
        if (result.data.itens) {
          setItems(result.data.itens);
        } else {
          fetchItems();
        }
      } else {
        setError(result.data?.err || result.data?.error || "Erro ao salvar item.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePatrimonioSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const result = await protectedFetch(
        `/itemPatrimony?id_item=${selectedItemForPatrimonio.id}`,
        "POST",
        { patrimonio: patrimonioForm.patrimonio }
      );

      if (result.ok && result.data?.status) {
        setShowModal(false);
        if (expandedItem === selectedItemForPatrimonio.id) {
          fetchPatrimonios(selectedItemForPatrimonio.id);
        }
        fetchItems();
      } else {
        setError(result.data?.err || result.data?.error || "Erro ao adicionar patrimônio.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditPatrimonioSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const result = await protectedFetch(
        `/itemPatrimony?id=${editingPatrimonio.id}`,
        "PUT",
        {
          patrimonio: patrimonioForm.patrimonio,
          situacao: patrimonioForm.situacao,
        }
      );

      if (result.ok) {
        setShowModal(false);
        if (expandedItem) {
          fetchPatrimonios(expandedItem);
        }
        fetchItems();
      } else {
        setError(result.data?.err || result.data?.error || "Erro ao atualizar patrimônio.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="item-list-page">
        <header className="page-header">
          <div className="header-content">
            <h1 className="page-title">Itens</h1>
            <p className="page-subtitle">Gerencie o cadastro de itens e patrimônios</p>
          </div>
          <button className="btn-primary" onClick={openCreateItemModal}>
            + Novo Item
          </button>
        </header>

        {/* Search */}
        <form className="search-card" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-search">🔍 Buscar</button>
        </form>

        {/* Items List */}
        <div className="items-container">
          {loading ? (
            <div className="loading-state">Carregando itens...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>Nenhum item encontrado</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-header" onClick={() => toggleExpand(item.id)}>
                  <div className="item-info">
                    <span className="item-expand">
                      {expandedItem === item.id ? "▼" : "▶"}
                    </span>
                    <div className="item-details">
                      <h3 className="item-name">{item.nome}</h3>
                      <p className="item-desc">{item.descricao || "Sem descrição"}</p>
                    </div>
                  </div>
                  <div className="item-meta">
                    <span className="item-count">
                      {item.total || 0} unid. | {item.disponiveis || 0} disp.
                    </span>
                    <span className={`status-badge ${item.situacao === 1 || item.situacao === true ? "active" : "inactive"}`}>
                      {item.situacao === 1 || item.situacao === true ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="item-actions" onClick={e => e.stopPropagation()}>
                    <button 
                      className="btn-small btn-add"
                      onClick={() => openAddPatrimonioModal(item)}
                    >
                      + Patrimônio
                    </button>
                    <button 
                      className="btn-small btn-edit"
                      onClick={() => openEditItemModal(item)}
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {/* Patrimônios expandidos */}
                {expandedItem === item.id && (
                  <div className="patrimonios-section">
                    {loadingPatrimonios ? (
                      <div className="patrimonios-loading">Carregando patrimônios...</div>
                    ) : patrimonios.length === 0 ? (
                      <div className="patrimonios-empty">Nenhum patrimônio cadastrado</div>
                    ) : (
                      <table className="patrimonios-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Patrimônio</th>
                            <th>Situação</th>
                            <th>Status</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patrimonios.map(p => (
                            <tr key={p.id}>
                              <td>#{p.id}</td>
                              <td>{p.patrimonio}</td>
                              <td>
                                <span className={`status-badge ${p.situacao === 1 || p.situacao === true ? "active" : "inactive"}`}>
                                  {p.situacao === 1 || p.situacao === true ? "Ativo" : "Inativo"}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge ${p.emprestado === 1 || p.emprestado === true ? "loaned" : "available"}`}>
                                  {p.emprestado === 1 || p.emprestado === true ? "Emprestado" : "Disponível"}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className="btn-small btn-edit"
                                  onClick={() => openEditPatrimonioModal(p)}
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
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>
                {modalType === "item" 
                  ? (editingItem ? "Editar Item" : "Novo Item")
                  : modalType === "editPatrimonio"
                    ? "Editar Patrimônio"
                    : `Adicionar Patrimônio - ${selectedItemForPatrimonio?.nome}`
                }
              </h2>
              
              {error && <div className="modal-error">{error}</div>}
              
              {modalType === "item" ? (
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
                    <label>Descrição</label>
                    <textarea
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  {editingItem && (
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="situacao"
                          checked={formData.situacao}
                          onChange={handleChange}
                        />
                        Item Ativo
                      </label>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              ) : modalType === "editPatrimonio" ? (
                <form onSubmit={handleEditPatrimonioSubmit}>
                  <div className="form-group">
                    <label>Código do Patrimônio *</label>
                    <input
                      type="text"
                      name="patrimonio"
                      value={patrimonioForm.patrimonio}
                      onChange={handlePatrimonioChange}
                      placeholder="Ex: PAT-001, 12345..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="situacao"
                        checked={patrimonioForm.situacao}
                        onChange={handlePatrimonioChange}
                      />
                      Patrimônio Ativo
                    </label>
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
              ) : (
                <form onSubmit={handlePatrimonioSubmit}>
                  <div className="form-group">
                    <label>Código do Patrimônio *</label>
                    <input
                      type="text"
                      name="patrimonio"
                      value={patrimonioForm.patrimonio}
                      onChange={handlePatrimonioChange}
                      placeholder="Ex: PAT-001, 12345..."
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? "Adicionando..." : "Adicionar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
