// src/components/PersonSelect.jsx
import React, { useState, useEffect } from "react";
import { protectedFetch } from "../services/api";
import "./PersonSelect.css";

export default function PersonSelect({ selectedPerson, onSelect }) {
  const [persons, setPersons] = useState([]);
  const [filteredPersons, setFilteredPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllPersons();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredPersons(persons);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = persons.filter(p => 
        p.nome.toLowerCase().includes(searchLower) ||
        (p.cpf && p.cpf.includes(search))
      );
      setFilteredPersons(filtered);
    }
  }, [search, persons]);

  async function fetchAllPersons() {
    setLoading(true);
    try {
      const { ok, data } = await protectedFetch("/person");
      console.log("Persons response:", { ok, data });
      if (ok && Array.isArray(data)) {
        // Mostrar todas as pessoas ativas (situacao=1 ou true)
        const activePersons = data.filter(p => p.situacao === 1 || p.situacao === true);
        console.log("Active persons:", activePersons);
        setPersons(activePersons);
        setFilteredPersons(activePersons);
      } else {
        console.error("Failed to fetch persons:", data);
        setPersons([]);
        setFilteredPersons([]);
      }
    } catch (err) {
      console.error("Error fetching persons:", err);
      setPersons([]);
      setFilteredPersons([]);
    }
    setLoading(false);
  }

  function handleSelect(person) {
    onSelect(person);
  }

  function handleClear() {
    onSelect(null);
    setSearch("");
  }

  return (
    <div className="person-select">
      <label className="select-label">Pessoa *</label>
      
      {selectedPerson ? (
        <div className="selected-person">
          <div className="selected-info">
            <span className="selected-name">{selectedPerson.nome}</span>
            <span className="selected-cpf">CPF: {selectedPerson.cpf || "-"}</span>
          </div>
          <button type="button" className="btn-clear" onClick={handleClear}>
            ✕
          </button>
        </div>
      ) : (
        <>
          <div className="search-box">
            <input
              type="text"
              placeholder="Filtrar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="persons-list">
            {loading ? (
              <div className="list-loading">Carregando pessoas...</div>
            ) : filteredPersons.length === 0 ? (
              <div className="list-empty">
                {persons.length === 0 
                  ? "Nenhuma pessoa cadastrada no sistema" 
                  : "Nenhuma pessoa encontrada com esse filtro"}
              </div>
            ) : (
              filteredPersons.map(person => (
                <div 
                  key={person.id} 
                  className="person-item"
                  onClick={() => handleSelect(person)}
                >
                  <div className="person-info">
                    <span className="person-name">{person.nome}</span>
                    <span className="person-cpf">CPF: {person.cpf || "-"}</span>
                  </div>
                  <span className="person-id">#{person.id}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
