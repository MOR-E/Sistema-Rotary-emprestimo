// src/pages/LendingCreate.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import PersonSelect from "../components/PersonSelect";
import ItemSelect from "../components/ItemSelect";
import { protectedFetch } from "../services/api";
import "./LendingCreate.css";

export default function LendingCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    dataEmprestimo: new Date().toISOString().split("T")[0],
    motivoEmprestimo: "",
    pessoa: null,
    itens: [],
  });

  function handleDateChange(e) {
    setFormData(prev => ({ ...prev, dataEmprestimo: e.target.value }));
  }

  function handleMotivoChange(e) {
    setFormData(prev => ({ ...prev, motivoEmprestimo: e.target.value }));
  }

  function handlePersonSelect(person) {
    setFormData(prev => ({ ...prev, pessoa: person }));
  }

  function handleItemsChange(itens) {
    setFormData(prev => ({ ...prev, itens }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validações
    if (!formData.pessoa) {
      setError("Selecione uma pessoa para o empréstimo.");
      return;
    }
    if (formData.itens.length === 0) {
      setError("Selecione pelo menos um item.");
      return;
    }

    setLoading(true);

    try {
      // Cria datetime com horário atual local (navegador já está no fuso de Brasília)
      const now = new Date();
      const today = now.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
      
      let dataComHorario;
      if (formData.dataEmprestimo === today) {
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
        dataComHorario = formData.dataEmprestimo + " 00:00:00";
      }
      
      const payload = {
        dataEmprestimo: dataComHorario,
        motivoEmprestimo: formData.motivoEmprestimo,
        pessoaId: formData.pessoa.id,
        itens: formData.itens.map(item => ({
          id_item_patrimonio: item.id_item_patrimonio
        }))
      };

      const { ok, data } = await protectedFetch("/lending", "POST", payload);

      if (ok && data.status) {
        navigate("/emprestimos");
      } else {
        setError(data?.err || "Erro ao criar empréstimo.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="lending-create-page">
        <header className="page-header">
          <button 
            type="button" 
            className="btn-back"
            onClick={() => navigate("/emprestimos")}
          >
            ← Voltar
          </button>
          <div className="header-content">
            <h1 className="page-title">Novo Empréstimo</h1>
            <p className="page-subtitle">Registre um novo empréstimo de itens</p>
          </div>
        </header>

        <form className="create-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-card">
            <h2 className="card-title">Informações do Empréstimo</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Data do Empréstimo</label>
                <input
                  type="date"
                  value={formData.dataEmprestimo}
                  onChange={handleDateChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Motivo do Empréstimo</label>
                <input
                  type="text"
                  placeholder="Ex: Evento, Curso, etc."
                  value={formData.motivoEmprestimo}
                  onChange={handleMotivoChange}
                />
              </div>
            </div>

            <div className="form-section">
              <PersonSelect
                selectedPerson={formData.pessoa}
                onSelect={handlePersonSelect}
              />
            </div>
          </div>

          <div className="form-card">
            <h2 className="card-title">Itens para Empréstimo</h2>
            <ItemSelect
              selectedItems={formData.itens}
              onItemsChange={handleItemsChange}
            />
          </div>

          {/* Resumo */}
          <div className="summary-card">
            <h2 className="card-title">Resumo</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Data</span>
                <span className="summary-value">
                  {new Date(formData.dataEmprestimo).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Motivo</span>
                <span className="summary-value">
                  {formData.motivoEmprestimo || "Não informado"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pessoa</span>
                <span className="summary-value">
                  {formData.pessoa?.nome || "Não selecionada"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Itens</span>
                <span className="summary-value">
                  {formData.itens.length} item(s) selecionado(s)
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/emprestimos")}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Empréstimo"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
