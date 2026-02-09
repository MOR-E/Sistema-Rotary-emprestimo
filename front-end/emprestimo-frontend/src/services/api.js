// src/services/api.js
const BASE_URL = "http://localhost:8686";

export async function login(email, senha) {
  const url = `${BASE_URL}/login`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const json = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data: json };
}

export async function recoverPassword(email) {
  const url = `${BASE_URL}/recoverpassword`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data: json };
}

export async function changePassword(token, senha) {
  const url = `${BASE_URL}/changepassword`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, senha }),
  });
  const json = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data: json };
}

/**
 * Faz requisições autenticadas com o token JWT
 */
export async function protectedFetch(path, method = "GET", body = null) {
  const tokenWrapper = window.localStorage.getItem("tokenWrapper");
  let token = null;
  let storedData = {};
  
  if (tokenWrapper) {
    try {
      storedData = JSON.parse(tokenWrapper);
      token = storedData.token;
    } catch (err) {
      token = null;
    }
  }

  // Log para debug
  console.log("protectedFetch:", { path, method, hasToken: !!token });

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${BASE_URL}${path}`;
  const opts = { method, headers };
  
  // Só adiciona body para métodos que suportam (POST, PUT, PATCH, DELETE)
  if (body !== null && method !== "GET" && method !== "HEAD") {
    opts.body = JSON.stringify(body);
  }

  const resp = await fetch(url, opts);
  
  // Captura o novo token do header de resposta (se houver)
  const newToken = resp.headers.get("authorization");
  if (newToken) {
    const tokenOnly = newToken.replace("Bearer ", "");
    // Atualiza o token no localStorage mantendo os outros dados
    const updatedData = { ...storedData, token: tokenOnly };
    window.localStorage.setItem("tokenWrapper", JSON.stringify(updatedData));
  }
  
  const json = await resp.json().catch(() => null);
  
  // Se 401 ou 403, redireciona para login
  if (resp.status === 401 || resp.status === 403) {
    console.error("Auth error:", json);
    // window.localStorage.removeItem("tokenWrapper");
    // window.location.href = "/login";
  }
  
  return { ok: resp.ok, status: resp.status, data: json };
}

// ============ PESSOAS ============

export async function getPersons(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return protectedFetch(`/person${query}`);
}

export async function createPerson(person) {
  return protectedFetch("/person", "POST", person);
}

export async function updatePerson(id, person) {
  return protectedFetch(`/person?id=${id}`, "PUT", person);
}

// ============ ITENS ============

export async function getItems(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return protectedFetch(`/item${query}`);
}

export async function getItemPatrimony(itemId) {
  return protectedFetch(`/itemPatrimony?id=${itemId}`);
}

export async function createItem(item) {
  return protectedFetch("/item", "POST", item);
}

export async function createItemPatrimony(itemId, patrimonio) {
  return protectedFetch(`/itemPatrimony?id_item=${itemId}`, "POST", { patrimonio });
}

// ============ EMPRÉSTIMOS ============

export async function getLendings(filters = {}) {
  const params = [];
  if (filters.pessoa) params.push(`pessoa=${filters.pessoa}`);
  if (filters.usuario) params.push(`usuario=${filters.usuario}`);
  if (filters.patrimonio) params.push(`patrimonio=${encodeURIComponent(filters.patrimonio)}`);
  
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return protectedFetch(`/lending${query}`);
}

export async function getLendingById(id) {
  return protectedFetch(`/lending?id=${id}`);
}

export async function createLending(data) {
  return protectedFetch("/lending", "POST", data);
}

export async function createReturn(emprestimoId, dataDevolucao, itens) {
  return protectedFetch(`/return?id=${emprestimoId}`, "POST", {
    dataDevolucao,
    itens,
  });
}

export async function updateLending(id, patrimonyIds, data) {
  const patrimoniosParam = patrimonyIds.join(",");
  return protectedFetch(`/lending?id=${id}&patrimonios=${patrimoniosParam}`, "PUT", data);
}

export async function addItemToLending(emprestimoId, itens) {
  return protectedFetch(`/addItem?id=${emprestimoId}`, "POST", { itens });
}
