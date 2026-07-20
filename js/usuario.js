import { logout, pegarUsuarioLogado, verificarLogin } from "./auth.js";

function formatarData(data) {
  if (!data) return "—";

  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("pt-BR");
}

export function inicializarUsuarioPage() {
  if (!verificarLogin(false)) {
    window.location.assign("./index.html");
    return;
  }

  const usuario = pegarUsuarioLogado();
  if (!usuario?.tipo) {
    window.location.assign("./login.html");
    return;
  }

  const nomeEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  const cpfEl = document.getElementById("userCpf");
  const tipoEl = document.getElementById("userTipo");
  const ultimoAcessoEl = document.getElementById("userLastAccess");
  const adminLink = document.getElementById("adminLink");
  const logoutButton = document.getElementById("logoutButton");

  if (nomeEl) nomeEl.textContent = usuario.nome || "—";
  if (emailEl) emailEl.textContent = usuario.email || "—";
  if (cpfEl) cpfEl.textContent = usuario.cpf || "—";
  if (tipoEl) tipoEl.textContent = usuario.tipo || "CLIENTE";
  if (ultimoAcessoEl) ultimoAcessoEl.textContent = formatarData(usuario.ultimoAcesso);

  if (adminLink) {
    adminLink.style.display = usuario.tipo === "ADMIN" ? "inline-flex" : "none";
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
    });
  }
}

document.addEventListener("DOMContentLoaded", inicializarUsuarioPage);