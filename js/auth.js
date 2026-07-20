const STORAGE_USER = "usuario";
const STORAGE_TOKEN = "authToken";
const LOGIN_PAGE = "./index.html";
const INDEX_PAGE = "./paginainicial.html";
const ADMIN_PAGE = "./admin.html";

function normalizeTipo(tipo) {
  if (!tipo) return "";
  return String(tipo).trim().toUpperCase();
}

function parseStoredUser(rawUser) {
  if (!rawUser) return null;

  const parsed = typeof rawUser === "string" ? JSON.parse(rawUser) : rawUser;
  if (!parsed || typeof parsed !== "object") return null;

  return {
    ...parsed,
    tipo: normalizeTipo(parsed.tipo)
  };
}

function salvarUsuario(usuario, token = null) {
  const dados = parseStoredUser(usuario) || {};

  if (token) {
    dados.token = token;
    localStorage.setItem(STORAGE_TOKEN, token);
  } else if (dados.token) {
    localStorage.setItem(STORAGE_TOKEN, dados.token);
  } else {
    localStorage.removeItem(STORAGE_TOKEN);
  }

  localStorage.setItem(STORAGE_USER, JSON.stringify(dados));
  return dados;
}

function limparSessao() {
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem(STORAGE_TOKEN);
}

function pegarUsuarioLogado() {
  try {
    return parseStoredUser(localStorage.getItem(STORAGE_USER));
  } catch (error) {
    limparSessao();
    return null;
  }
}

function pegarToken() {
  const usuario = pegarUsuarioLogado();
  const tokenStorage = localStorage.getItem(STORAGE_TOKEN);
  return tokenStorage || usuario?.token || null;
}

function redirecionarPara(destino) {
  const atual = window.location.pathname.split("/").pop();

  if (atual === destino.replace("./", "")) {
    return;
  }

  window.location.assign(destino);
}

function verificarLogin(redirect = true) {
  const usuario = pegarUsuarioLogado();
  const token = pegarToken();

  if (!usuario || !token || !usuario.tipo) {
    limparSessao();
    if (redirect) redirecionarPara(LOGIN_PAGE);
    return false;
  }

  return true;
}

function verificarAdmin(redirect = true) {
  if (!verificarLogin(false)) {
    if (redirect) redirecionarPara(LOGIN_PAGE);
    return false;
  }

  const usuario = pegarUsuarioLogado();
  if (normalizeTipo(usuario?.tipo) !== "ADMIN") {
    limparSessao();
    if (redirect) redirecionarPara(INDEX_PAGE);
    return false;
  }

  return true;
}

function logout() {
  limparSessao();
  redirecionarPara(LOGIN_PAGE);
}

export {
  STORAGE_USER,
  STORAGE_TOKEN,
  LOGIN_PAGE,
  INDEX_PAGE,
  ADMIN_PAGE,
  normalizeTipo,
  salvarUsuario,
  limparSessao,
  pegarUsuarioLogado,
  pegarToken,
  verificarLogin,
  verificarAdmin,
  logout,
  redirecionarPara
};
