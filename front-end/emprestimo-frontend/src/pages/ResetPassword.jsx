// src/pages/ResetPassword.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { changePassword } from "../services/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = query.get("token");
    setToken(t);
  }, [query]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (!token) {
      setError("Token inválido ou ausente.");
      return;
    }
    if (!senha || senha.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (senha !== confirmaSenha) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await changePassword(token, senha);

      // Backend pode retornar mensagem de sucesso ou objeto com message
      if (data?.message) {
        setMsg(data.message);
      } else if (ok) {
        setMsg("Senha alterada com sucesso.");
      } else {
        setError(data?.message || "Erro ao alterar a senha.");
      }

      // opcional: redirecionar para login após 3s
      if (ok) {
        setTimeout(() => navigate("/login"), 2500);
      }
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
        <h5 className="mb-3">Redefinir senha</h5>

        {!token && (
          <div className="alert alert-warning">
            Token ausente. Verifique o link recebido no email.{" "}
            <Link to="/recover-password">Solicitar novo link</Link>
          </div>
        )}

        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nova senha</label>
            <input
              type="password"
              className="form-control"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Confirmar nova senha</label>
            <input
              type="password"
              className="form-control"
              value={confirmaSenha}
              onChange={(e) => setConfirmaSenha(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !token}
          >
            {loading ? "Alterando..." : "Alterar senha"}
          </button>

          <Link to="/login" className="btn btn-link ms-2">
            Voltar ao login
          </Link>
        </form>
      </div>
    </div>
  );
}
