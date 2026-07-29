/**
 * Módulo Principal do Painel Administrativo
 * Arquivo: admin.js
 *
 * Estrutura do arquivo:
 *  1. Autenticação / guarda de rota
 *  2. Configuração da API
 *  3. Referências ao DOM
 *  4. Estado da aplicação
 *  5. Utilitários (formatação, escape, debounce)
 *  6. Sidebar mobile
 *  7. Dashboard / resumo
 *  8. Renderização da tabela de clientes
 *  9. Modal de detalhes do usuário
 * 10. Integração com módulo de Guias (ModalGuiasAdmin.js)
 * 11. Integração com módulo de WhatsApp (enviarMensagemCliente.js)
 * 12. Busca, filtro e ordenação
 * 13. Comunicação com a API (listar / remover clientes)
 * 14. Eventos e inicialização
 */

import { abrirModalMensagemCliente } from "./enviarMensagemCliente.js";
import { ModalGuiasAdmin } from "./ModalGuiasAdmin.js";

// ===========================================================
// 1. AUTENTICAÇÃO E GUARDA DE ROTA
// ===========================================================
function obterUsuarioSessao() {
  try {
    return JSON.parse(localStorage.getItem("usuario"));
  } catch {
    return null;
  }
}

function verificarAutenticacao() {
  const usuarioSessao = obterUsuarioSessao();
  if (!usuarioSessao || !usuarioSessao.token) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

if (!verificarAutenticacao()) {
  throw new Error("Acesso negado. Redirecionando para login...");
}

// ===========================================================
// 2. CONFIGURAÇÃO DA API
// ===========================================================
const API_BASE_URL = "https://apiadministrativa.onrender.com";
const API_CLIENTES = `${API_BASE_URL}/api/clientes`;
const API_REMOVE = `${API_BASE_URL}/api/remove`;

// ===========================================================
// 3. REFERÊNCIAS AO DOM
// ===========================================================
const dom = {
  listaClientes: document.getElementById("clientes"),

  modalUsuario: document.getElementById("modalUsuario"),
  fecharUsuario: document.getElementById("fecharUsuario"),
  usuarioNome: document.getElementById("usuarioNome"),
  usuarioEmail: document.getElementById("usuarioEmail"),
  usuarioCpf: document.getElementById("usuarioCpf"),
  usuarioEndereco: document.getElementById("usuarioEndereco"),
  usuarioTipo: document.getElementById("usuarioTipo"),
  usuarioStatus: document.getElementById("usuarioStatus"),
  usuarioUltimoLogin: document.getElementById("usuarioUltimoLogin"),
  btnVerify: document.getElementById("btn_verify"),

  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  mobileToggle: document.getElementById("mobileToggle"),
  refreshButton: document.getElementById("refreshUsers"),
  searchInput: document.getElementById("searchInput"),
  sortAccessBtn: document.getElementById("sortAccessBtn"),
  sortDirectionLabel: document.getElementById("sortDirectionLabel"),

  totalUsers: document.getElementById("totalUsers"),
  activeUsers: document.getElementById("activeUsers"),
  lastLoginUser: document.getElementById("lastLoginUser"),
  lastLoginValue: document.getElementById("lastLoginValue")
};

// ===========================================================
// 4. ESTADO DA APLICAÇÃO
// ===========================================================
const estado = {
  clientes: [],
  sortAscending: false,
  clienteEmDetalhe: null
};

// ===========================================================
// 5. UTILITÁRIOS
// ===========================================================
function debounce(fn, delayMs = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Garante que o valor vindo da API é uma string segura para exibição.
 * (o escape de HTML só é necessário quando usamos innerHTML; aqui
 * normalizamos o valor para uso com textContent).
 */
function textoOuTraco(valor, textoPadrao = "—") {
  if (valor === null || valor === undefined || valor === "") return textoPadrao;
  return String(valor);
}

function formatarStatus(status) {
  const normalizado = String(status || "ACTIVE").toUpperCase();
  const valoresAtivos = new Set(["ACTIVE", "ATIVO", "TRUE", "1"]);
  const isActive = valoresAtivos.has(normalizado);
  return {
    label: isActive ? "Ativo" : "Inativo",
    className: isActive ? "status-pill" : "status-pill inactive"
  };
}

function formatarUltimoLogin(data) {
  if (!data) return "Nunca acessou";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "Nunca acessou";

  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

/**
 * Valida se o objeto retornado pela API tem o formato mínimo esperado
 * de um cliente. Evita quebrar a tela caso a API retorne dados inconsistentes.
 */
function ehClienteValido(cliente) {
  return Boolean(cliente) && typeof cliente === "object";
}

/**
 * Helper para criar elementos DOM com atributos e texto de forma segura,
 * evitando innerHTML para conteúdo vindo da API.
 */
function criarElemento(tag, { className, texto, atributos = {} } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (texto !== undefined) el.textContent = texto;
  Object.entries(atributos).forEach(([chave, valor]) => el.setAttribute(chave, valor));
  return el;
}

// ===========================================================
// 6. SIDEBAR MOBILE
// ===========================================================
function toggleSidebar(force) {
  if (!dom.sidebar) return;
  const shouldOpen = typeof force === "boolean" ? force : !dom.sidebar.classList.contains("open");
  dom.sidebar.classList.toggle("open", shouldOpen);
  dom.sidebarOverlay?.classList.toggle("active", shouldOpen);
  document.body.classList.toggle("modal-open", shouldOpen);
}

function closeSidebar() {
  toggleSidebar(false);
}

// ===========================================================
// 7. DASHBOARD / RESUMO
// ===========================================================
function contarUsuariosAtivos(clientes) {
  return clientes.filter((cliente) => {
    const status = String(cliente.status || cliente.tipo || "ACTIVE").toUpperCase();
    return ["ACTIVE", "ATIVO", "ADMIN", "TRUE", "1"].includes(status);
  }).length;
}

function encontrarUltimoAcesso(clientes) {
  return clientes
    .filter((cliente) => cliente.ultimoAcesso)
    .sort((a, b) => new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso))[0];
}

function atualizarResumo(clientes) {
  if (dom.totalUsers) dom.totalUsers.textContent = clientes.length;

  if (dom.activeUsers) {
    dom.activeUsers.textContent = contarUsuariosAtivos(clientes);
  }

  if (dom.lastLoginUser && dom.lastLoginValue) {
    const maisRecente = encontrarUltimoAcesso(clientes);

    if (maisRecente) {
      dom.lastLoginUser.textContent = maisRecente.nome || "Usuário";

      dom.lastLoginValue.replaceChildren(
        criarElemento("i", { className: "fa-solid fa-clock-rotate-left" }),
        document.createTextNode(` ${formatarUltimoLogin(maisRecente.ultimoAcesso)}`)
      );
    } else {
      dom.lastLoginUser.textContent = "Nenhum acesso";
      dom.lastLoginValue.textContent = "Último login registrado";
    }
  }
}

// ===========================================================
// 8. RENDERIZAÇÃO DA TABELA DE CLIENTES
// ===========================================================
function renderizarLoading() {
  if (!dom.listaClientes) return;
  dom.listaClientes.innerHTML = "";
  const container = criarElemento("div", { className: "empty-state", atributos: { "aria-busy": "true" } });
  container.append(
    criarElemento("i", { className: "fa-solid fa-spinner fa-spin" }),
    criarElemento("p", { texto: "Carregando usuários..." })
  );
  dom.listaClientes.appendChild(container);
}

function renderizarErro(mensagem, onRetry) {
  if (!dom.listaClientes) return;
  dom.listaClientes.innerHTML = "";

  const container = criarElemento("div", { className: "empty-state empty-state-error" });
  const botaoRetry = criarElemento("button", { className: "primary-btn", atributos: { type: "button", id: "retryLoadBtn" } });
  botaoRetry.append(
    criarElemento("i", { className: "fa-solid fa-rotate-right" }),
    document.createTextNode(" Tentar novamente")
  );

  container.append(
    criarElemento("i", { className: "fa-solid fa-triangle-exclamation" }),
    criarElemento("p", { texto: mensagem || "Não foi possível carregar a lista de usuários." }),
    botaoRetry
  );

  dom.listaClientes.appendChild(container);
  botaoRetry.addEventListener("click", onRetry);
}

function renderizarVazio(temFiltro) {
  if (!dom.listaClientes) return;
  dom.listaClientes.innerHTML = "";
  const container = criarElemento("div", { className: "empty-state" });
  container.append(
    criarElemento("i", { className: "fa-solid fa-users-slash" }),
    criarElemento("p", {
      texto: temFiltro ? "Nenhum usuário encontrado para essa busca." : "Nenhum usuário cadastrado ainda."
    })
  );
  dom.listaClientes.appendChild(container);
}

function criarCabecalhoTabela() {
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  ["Usuário", "Email", "CPF", "Tipo", "Último acesso", "Endereço", "Status", "Ações"].forEach((titulo) => {
    tr.appendChild(criarElemento("th", { texto: titulo }));
  });
  thead.appendChild(tr);
  return thead;
}

function criarCelulaUsuario(cliente) {
  const td = criarElemento("td", { atributos: { "data-label": "Usuário" } });
  td.append(
    criarElemento("div", { className: "user-name", texto: textoOuTraco(cliente.nome, "Sem nome") }),
    criarElemento("div", { className: "user-email", texto: textoOuTraco(cliente.email, "Sem email") })
  );
  return td;
}

function criarCelulaUltimoAcesso(cliente) {
  const ultimoAcesso = formatarUltimoLogin(cliente.ultimoAcesso);
  const acessou = Boolean(cliente.ultimoAcesso) && !Number.isNaN(new Date(cliente.ultimoAcesso).getTime());

  const td = criarElemento("td", { atributos: { "data-label": "Último acesso", title: ultimoAcesso } });
  const span = criarElemento("span", { className: `last-login ${acessou ? "" : "never-accessed"}`.trim() });
  span.append(
    criarElemento("i", { className: "fa-solid fa-clock" }),
    document.createTextNode(` ${ultimoAcesso}`)
  );
  td.appendChild(span);
  return td;
}

function criarCelulaAcoes(cliente) {
  const td = criarElemento("td", { atributos: { "data-label": "Ações" } });
  const container = criarElemento("div", { className: "actions" });

  const nomeCliente = textoOuTraco(cliente.nome, "");

  const btnVer = criarElemento("button", {
    className: "icon-btn view-btn",
    atributos: { title: "Visualizar", "aria-label": `Visualizar ${nomeCliente}` }
  });
  btnVer.appendChild(criarElemento("i", { className: "fa-solid fa-eye" }));
  btnVer.addEventListener("click", () => abrirModalUsuario(cliente));

  const btnRemover = criarElemento("button", {
    className: "delete-btn",
    atributos: { title: "Remover", "aria-label": `Remover ${nomeCliente}` }
  });
  btnRemover.appendChild(criarElemento("i", { className: "fa-solid fa-trash" }));
  btnRemover.addEventListener("click", () => removerCliente(cliente));

  const btnWhatsapp = criarElemento("button", {
    className: "send-message-btn",
    atributos: { title: "Enviar mensagem", "aria-label": `Enviar mensagem para ${nomeCliente}` }
  });
  btnWhatsapp.appendChild(criarElemento("i", { className: "fa-brands fa-whatsapp" }));
  // Envia o objeto completo do cliente para o módulo de WhatsApp
  btnWhatsapp.addEventListener("click", () => abrirModalMensagemCliente(cliente));

  container.append(btnVer, btnRemover, btnWhatsapp);
  td.appendChild(container);
  return td;
}

function criarLinhaCliente(cliente) {
  const acessou = Boolean(cliente.ultimoAcesso) && !Number.isNaN(new Date(cliente.ultimoAcesso).getTime());
  const status = formatarStatus(cliente.status || cliente.tipo);

  const tr = document.createElement("tr");
  tr.className = acessou ? "" : "highlight-never-access";

  const tdEmail = criarElemento("td", { texto: textoOuTraco(cliente.email), atributos: { "data-label": "Email" } });
  const tdCpf = criarElemento("td", { texto: textoOuTraco(cliente.cpf), atributos: { "data-label": "CPF" } });
  const tdTipo = criarElemento("td", { texto: textoOuTraco(cliente.tipo, "CLIENTE"), atributos: { "data-label": "Tipo" } });
  const tdEndereco = criarElemento("td", { texto: textoOuTraco(cliente.endereco), atributos: { "data-label": "Endereço" } });

  const tdStatus = criarElemento("td", { atributos: { "data-label": "Status" } });
  tdStatus.appendChild(criarElemento("span", { className: status.className, texto: status.label }));

  tr.append(
    criarCelulaUsuario(cliente),
    tdEmail,
    tdCpf,
    tdTipo,
    criarCelulaUltimoAcesso(cliente),
    tdEndereco,
    tdStatus,
    criarCelulaAcoes(cliente)
  );

  return tr;
}

function renderizarClientes(clientes) {
  if (!dom.listaClientes) return;

  if (!Array.isArray(clientes) || clientes.length === 0) {
    renderizarVazio(Boolean(dom.searchInput?.value.trim()));
    return;
  }

  const wrapper = criarElemento("div", { className: "table-wrapper" });
  const table = criarElemento("table", { className: "users-table" });
  const tbody = document.createElement("tbody");

  table.appendChild(criarCabecalhoTabela());

  const fragment = document.createDocumentFragment();
  clientes.filter(ehClienteValido).forEach((cliente) => {
    fragment.appendChild(criarLinhaCliente(cliente));
  });
  tbody.appendChild(fragment);

  table.appendChild(tbody);
  wrapper.appendChild(table);

  dom.listaClientes.innerHTML = "";
  dom.listaClientes.appendChild(wrapper);
}

// ===========================================================
// 9. MODAL DE DETALHES DO USUÁRIO
// ===========================================================
function abrirModalUsuario(cliente) {
  estado.clienteEmDetalhe = cliente;

  if (dom.usuarioNome) dom.usuarioNome.textContent = textoOuTraco(cliente.nome);
  if (dom.usuarioEmail) dom.usuarioEmail.textContent = textoOuTraco(cliente.email);
  if (dom.usuarioCpf) dom.usuarioCpf.textContent = textoOuTraco(cliente.cpf);
  if (dom.usuarioTipo) dom.usuarioTipo.textContent = textoOuTraco(cliente.tipo, "CLIENTE");
  if (dom.usuarioEndereco) dom.usuarioEndereco.textContent = textoOuTraco(cliente.endereco);

  const status = formatarStatus(cliente.status || cliente.tipo);
  if (dom.usuarioStatus) dom.usuarioStatus.textContent = status.label;
  if (dom.usuarioUltimoLogin) dom.usuarioUltimoLogin.textContent = formatarUltimoLogin(cliente.ultimoAcesso);

  if (dom.modalUsuario) {
    dom.modalUsuario.classList.add("active");
    dom.modalUsuario.setAttribute("aria-hidden", "false");
  }
  document.body.classList.add("modal-open");
}

function fecharModalUsuario() {
  if (dom.modalUsuario) {
    dom.modalUsuario.classList.remove("active");
    dom.modalUsuario.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("modal-open");
  estado.clienteEmDetalhe = null;
}

// ===========================================================
// 10. INTEGRAÇÃO COM MÓDULO DE GUIAS (ModalGuiasAdmin.js)
// ===========================================================
// O módulo cuida da própria renderização/estado do modal de guias;
// aqui apenas disparamos o carregamento passando o cliente selecionado.
const modalGuias = ModalGuiasAdmin();

dom.btnVerify?.addEventListener("click", () => {
  if (!estado.clienteEmDetalhe) return;
  modalGuias.carregarGuias(estado.clienteEmDetalhe);
});

// ===========================================================
// 11. BUSCA, FILTRO E ORDENAÇÃO DE CLIENTES
// ===========================================================
function clienteContemTermo(cliente, termo) {
  const campos = [cliente.nome, cliente.email, cliente.cpf, cliente.tipo];
  return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
}

function aplicarFiltroEOrdenacao(clientes) {
  const termo = dom.searchInput?.value.trim().toLowerCase() || "";

  const filtrados = termo
    ? clientes.filter((cliente) => clienteContemTermo(cliente, termo))
    : clientes;

  return filtrados.slice().sort((a, b) => {
    const dataA = new Date(a.ultimoAcesso).getTime();
    const dataB = new Date(b.ultimoAcesso).getTime();
    const aVal = Number.isNaN(dataA) ? -Infinity : dataA;
    const bVal = Number.isNaN(dataB) ? -Infinity : dataB;
    return estado.sortAscending ? aVal - bVal : bVal - aVal;
  });
}

function renderizarListaAtual() {
  renderizarClientes(aplicarFiltroEOrdenacao(estado.clientes));
}

// ===========================================================
// 12. COMUNICAÇÃO COM A API
// ===========================================================
export async function carregarClientes() {
  renderizarLoading();
  try {
    const resposta = await fetch(API_CLIENTES);
    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status} ao buscar clientes`);
    }

    const dados = await resposta.json();
    if (!Array.isArray(dados)) {
      throw new Error("Resposta inesperada da API de clientes.");
    }

    estado.clientes = dados.filter(ehClienteValido);
    atualizarResumo(estado.clientes);
    renderizarListaAtual();
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    renderizarErro(error.message, carregarClientes);
  }
}

async function removerCliente(cliente) {
  const cpf = cliente?.cpf;
  if (!cpf) {
    console.error("Tentativa de remoção sem CPF válido.");
    return;
  }

  const confirmar = confirm(`Deseja remover ${cliente.nome || "este usuário"}? Essa ação não pode ser desfeita.`);
  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API_REMOVE}/${encodeURIComponent(cpf)}`, { method: "DELETE" });
    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status} ao remover usuário`);
    }

    await carregarClientes();
  } catch (error) {
    console.error("Erro ao remover cliente:", error);
    alert("Não foi possível remover o usuário. Tente novamente.");
  }
}

// ===========================================================
// 13. EVENTOS E INICIALIZAÇÃO
// ===========================================================
function configurarEventosModalUsuario() {
  dom.fecharUsuario?.addEventListener("click", fecharModalUsuario);

  dom.modalUsuario?.addEventListener("click", (event) => {
    if (event.target === dom.modalUsuario) fecharModalUsuario();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dom.modalUsuario?.classList.contains("active")) {
      fecharModalUsuario();
    }
  });
}

function configurarEventosSidebar() {
  dom.mobileToggle?.addEventListener("click", () => toggleSidebar());
  dom.sidebarOverlay?.addEventListener("click", closeSidebar);

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      closeSidebar();
    });
  });
}

function configurarEventosListaClientes() {
  dom.refreshButton?.addEventListener("click", carregarClientes);

  dom.searchInput?.addEventListener("input", debounce(renderizarListaAtual, 200));

  dom.sortAccessBtn?.addEventListener("click", () => {
    estado.sortAscending = !estado.sortAscending;
    if (dom.sortDirectionLabel) {
      dom.sortDirectionLabel.textContent = estado.sortAscending ? "↑" : "↓";
    }
    renderizarListaAtual();
  });
}

function inicializar() {
  configurarEventosModalUsuario();
  configurarEventosSidebar();
  configurarEventosListaClientes();
  carregarClientes();
}

inicializar();