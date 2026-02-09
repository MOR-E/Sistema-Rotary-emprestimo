// src/components/ItemSelect.jsx
import React, { useState, useEffect } from "react";
import { protectedFetch } from "../services/api";
import "./ItemSelect.css";

export default function ItemSelect({ selectedItems, onItemsChange }) {
  const [items, setItems] = useState([]);
  const [patrimoniosByItem, setPatrimoniosByItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [loadingPatrimonios, setLoadingPatrimonios] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllItems();
  }, []);

  async function fetchAllItems() {
    setLoading(true);
    try {
      const { ok, data } = await protectedFetch("/item");
      console.log("Items response:", { ok, data });
      if (ok && Array.isArray(data)) {
        // Mostrar todos os itens ativos (situacao=1 ou true)
        const activeItems = data.filter(item => item.situacao === 1 || item.situacao === true);
        console.log("Active items:", activeItems);
        setItems(activeItems);
      } else {
        console.error("Failed to fetch items:", data);
        setItems([]);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      setItems([]);
    }
    setLoading(false);
  }

  async function fetchPatrimonios(itemId) {
    if (patrimoniosByItem[itemId]) return;
    
    setLoadingPatrimonios(prev => ({ ...prev, [itemId]: true }));
    try {
      const { ok, data } = await protectedFetch(`/itemPatrimony?id=${itemId}`);
      console.log(`Patrimony for item ${itemId}:`, { ok, data });
      if (ok && Array.isArray(data)) {
        // Mostrar patrimônios ativos (situacao=1 ou true) e não emprestados
        const available = data.filter(p => {
          const isActive = p.situacao === 1 || p.situacao === true;
          const isNotLoaned = !p.emprestado && p.emprestado !== 1;
          console.log(`Patrimony ${p.id}: situacao=${p.situacao}, emprestado=${p.emprestado}, isActive=${isActive}, isNotLoaned=${isNotLoaned}`);
          return isActive && isNotLoaned;
        });
        console.log(`Available patrimony for item ${itemId}:`, available);
        setPatrimoniosByItem(prev => ({ ...prev, [itemId]: available }));
      } else {
        setPatrimoniosByItem(prev => ({ ...prev, [itemId]: [] }));
      }
    } catch (err) {
      console.error("Error fetching patrimony:", err);
      setPatrimoniosByItem(prev => ({ ...prev, [itemId]: [] }));
    }
    setLoadingPatrimonios(prev => ({ ...prev, [itemId]: false }));
  }


  function toggleExpand(itemId) {
    const isExpanding = !expandedItems[itemId];
    setExpandedItems(prev => ({ ...prev, [itemId]: isExpanding }));
    if (isExpanding) {
      fetchPatrimonios(itemId);
    }
  }

  function isSelected(patrimonioId) {
    return selectedItems.some(item => item.id_item_patrimonio === patrimonioId);
  }

  function togglePatrimonio(patrimonio, item) {
    const patrimonioId = patrimonio.id;
    if (isSelected(patrimonioId)) {
      onItemsChange(selectedItems.filter(i => i.id_item_patrimonio !== patrimonioId));
    } else {
      onItemsChange([
        ...selectedItems,
        {
          id_item_patrimonio: patrimonioId,
          patrimonio: patrimonio.patrimonio,
          itemNome: item.nome,
          id_item: item.id,
        }
      ]);
    }
  }

  function removeItem(patrimonioId) {
    onItemsChange(selectedItems.filter(i => i.id_item_patrimonio !== patrimonioId));
  }

  const filteredItems = search.trim() === ""
    ? items
    : items.filter(item => 
        item.nome.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="item-select">
      <label className="select-label">Itens para Empréstimo *</label>
      
      {selectedItems.length > 0 && (
        <div className="selected-items">
          <div className="selected-header">
            <span className="selected-count">{selectedItems.length} item(s) selecionado(s)</span>
          </div>
          <div className="selected-chips">
            {selectedItems.map(item => (
              <div key={item.id_item_patrimonio} className="selected-chip">
                <span className="chip-text">
                  {item.itemNome} - {item.patrimonio}
                </span>
                <button 
                  type="button" 
                  className="chip-remove"
                  onClick={() => removeItem(item.id_item_patrimonio)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-box">
        <input
          type="text"
          placeholder="Filtrar por nome do item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="items-accordion">
        {loading ? (
          <div className="loading-state">Carregando itens...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            {items.length === 0 
              ? "Nenhum item cadastrado no sistema" 
              : "Nenhum item encontrado com esse filtro"}
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="accordion-item">
              <div 
                className={`accordion-header ${expandedItems[item.id] ? "expanded" : ""}`}
                onClick={() => toggleExpand(item.id)}
              >
                <span className="accordion-icon">
                  {expandedItems[item.id] ? "▼" : "▶"}
                </span>
                <div className="accordion-info">
                  <span className="accordion-name">{item.nome}</span>
                  <span className="accordion-count">
                    {item.total || 0} total | {item.disponiveis || 0} disponível(is)
                  </span>
                </div>
              </div>

              {expandedItems[item.id] && (
                <div className="accordion-content">
                  {loadingPatrimonios[item.id] ? (
                    <div className="patrimonios-loading">Carregando patrimônios...</div>
                  ) : !patrimoniosByItem[item.id]?.length ? (
                    <div className="patrimonios-empty">Nenhum patrimônio disponível para empréstimo</div>
                  ) : (
                    <div className="patrimonios-grid">
                      {patrimoniosByItem[item.id].map(pat => (
                        <label 
                          key={pat.id} 
                          className={`patrimonio-option ${isSelected(pat.id) ? "selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected(pat.id)}
                            onChange={() => togglePatrimonio(pat, item)}
                          />
                          <span className="patrimonio-code">{pat.patrimonio}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
