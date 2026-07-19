import { normalizeTipo, pegarUsuarioLogado, salvarUsuario } from "./auth.js";

const API_LOGIN_URL = "https://apiadministrativa.onrender.com/api/login";

function mostrarAlerta(alerta) {
  const alertsContainer = document.querySelector(".alerts");
  const elementos = document.querySelectorAll(".alert-erro, .alert-true, .alert-servidor");

  elementos.forEach((elemento) => {
    elemento.style.display = "none";
  });

  if (alertsContainer) {
    alertsContainer.style.display = "flex";
  }

  if (alerta) {
    alerta.style.display = "block";
  }
}

function ocultarAlertas() {
  const alertsContainer = document.querySelector(".alerts");
  if (alertsContainer) {
    alertsContainer.style.display = "none";
  }

  document.querySelectorAll(".alert-erro, .alert-true, .alert-servidor").forEach((elemento) => {
    elemento.style.display = "none";
  });
}

function redirecionarAposLogin(usuario) {
  const tipo = normalizeTipo(usuario?.tipo);
  if (tipo === "ADMIN") {
    window.location.assign("./admin.html");
  } else {
    window.location.assign("./index.html");
  }
}

function parseResponseBody(response) {
  return response.text().then((text) => {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      return text;
    }
  });
}

async function performLogin(cpf, senha) {
  const response = await fetch(API_LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ cpf, senha })
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(typeof data === "object" && data?.message ? data.message : "Login inválido");
  }

  const usuario = {
    ...(typeof data === "object" ? data : {}),
    tipo: normalizeTipo(data?.tipo)
  };

  salvarUsuario(usuario, usuario.token || null);
  return usuario;
}

export function inicializarLogin() {
  const usuarioAtual = pegarUsuarioLogado();
  if (usuarioAtual?.tipo) {
    redirecionarAposLogin(usuarioAtual);
    return;
  }

  const form = document.getElementById("loginForm");
  const cpfInput = document.getElementById("cpf");
  const senhaInput = document.getElementById("password");
  const botao = document.getElementById("btnEnter");
  const alertaErro = document.getElementById("errologin");
  const alertaServidor = document.getElementById("erroservidor");
  const alertaSucesso = document.getElementById("corretologin");

  if (!form || !cpfInput || !senhaInput || !botao) {
    return;
  }

  cpfInput.addEventListener("input", (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
    event.target.value = digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    ocultarAlertas();

    const cpf = cpfInput.value.replace(/\D/g, "").trim();
    const senha = senhaInput.value.trim();

    if (cpf.length !== 11 || senha.length < 4) {
      mostrarAlerta(alertaErro);
      return;
    }

    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {
      const usuario = await performLogin(cpf, senha);
      mostrarAlerta(alertaSucesso);
      setTimeout(() => redirecionarAposLogin(usuario), 350);
    } catch (error) {
      console.error("Erro no login", error);
      mostrarAlerta(alertaServidor);
    } finally {
      botao.disabled = false;
      botao.textContent = "Entrar";
    }
  });
}

document.addEventListener("DOMContentLoaded", inicializarLogin);
