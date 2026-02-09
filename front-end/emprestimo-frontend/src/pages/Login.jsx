// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("pedro@teste.com");
  const [senha, setSenha] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { ok, data } = await login(email, senha);

      if (!ok) {
        setError(data?.message || "Credenciais inválidas.");
        setLoading(false);
        return;
      }

      const token = data?.token ?? data?.data?.token ?? null;
      if (!token) {
        setError(data?.message || "Resposta inesperada do servidor.");
        setLoading(false);
        return;
      }

      // Armazena token e dados do usuário
      window.localStorage.setItem("tokenWrapper", JSON.stringify({ 
        token,
        id: data.id,
        nome: data.nome,
        email: data.email,
        admin: data.admin
      }));
      navigate("/home", { replace: true });
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
      <div className="card p-4" style={{ width: 360 }}>
        <h4 className="card-title mb-3">Entrar</h4>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-3 d-flex justify-content-between align-items-center">
          <small>
            <Link to="/recover-password">Esqueci minha senha</Link>
          </small>
        </div>
      </div>
    </div>
  );
}
