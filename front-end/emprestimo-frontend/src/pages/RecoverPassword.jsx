// src/pages/RecoverPassword.jsx
import React, { useState } from "react";
import { recoverPassword } from "../services/api";
import { Link } from "react-router-dom";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResponseMessage(null);
    setLoading(true);

    try {
      const { ok, data } = await recoverPassword(email);

      // Backend retorna:
      // { "message": "Caso o seu usuário exista, um link ..." }
      if (data?.message) setResponseMessage(data.message);
      else if (!ok) setError(data?.message || "Erro ao processar requisição.");
      else setResponseMessage("Se o email existir, você receberá instruções.");
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="card p-4" style={{ width: 420 }}>
        <h5 className="mb-3">Recuperar senha</h5>

        {responseMessage && (
          <div className="alert alert-success">{responseMessage}</div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Informe seu email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
          </button>
          <Link to="/login" className="btn btn-link ms-2">
            Voltar ao login
          </Link>
        </form>
      </div>
    </div>
  );
}
