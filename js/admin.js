/**
 * Módulo Principal do Painel Administrativo - admin.js
 * Sistema SAPI
 */

import { abrirModalMensagemCliente } from "./enviarMensagemCliente.js";
import { ModalGuiasAdmin } from "./ModalGuiasAdmin.js";

// ===========================================================
// 1. CONFIGURAÇÕES E CONSTANTES DA API
// ===========================================================
const API_BASE_URL = "https://apiadministrativa.onrender.com";

const ENDPOINTS = {
  USERS: `${API_BASE_URL}/api/users`,
  CLIENTES: `${API_BASE_URL}/api/users`,
  REMOVE_CLIENTE: (cpf) => `${API_BASE_URL}/api/remove/${encodeURIComponent(cpf)}`,
  PROCESSOS_CLIENTE: (id) => `${API_BASE_URL}/api/cliente/processos/${encodeURIComponent(id)}`,
  CRIAR_PROCESSO: (usuarioId) => `${API_BASE_URL}/api/processos/${encodeURIComponent(usuarioId)}`
};

// ===========================================================
// 2. ESTADO GLOBAL DA APLICAÇÃO
// ===========================================================
const estado = {
  clientes: [],
  sortAscending: false,
  clienteEmDetalhe: null
};

// Instância do módulo externo de guias
let modalGuias = null;

// ===========================================================
// 3. REFERÊNCIAS DO DOM (LAZY GETTERS)
// ===========================================================
const dom = {
  get listaClientes() { return document.getElementById("clientes"); },

  // Modal Usuário
  get modalUsuario() { return document.getElementById("modalUsuario"); },
  get fecharUsuario() { return document.getElementById("fecharUsuario"); },
  get usuarioNome() { return document.getElementById("usuarioNome"); },
  get usuarioEmail() { return document.getElementById("usuarioEmail"); },
  get usuarioCpf() { return document.getElementById("usuarioCpf"); },
  get usuarioEndereco() { return document.getElementById("usuarioEndereco"); },
  get usuarioTipo() { return document.getElementById("usuarioTipo"); },
  get usuarioStatus() { return document.getElementById("usuarioStatus"); },
  get usuarioUltimoLogin() { return document.getElementById("usuarioUltimoLogin"); },
  get btnVerify() { return document.getElementById("btn_verify"); },

  // Processos DOM
  get btnToggleNovoProcesso() { return document.getElementById("btnToggleNovoProcesso"); },
  get formNovoProcesso() { return document.getElementById("formNovoProcesso"); },
  get listaProcessos() { return document.getElementById("listaProcessos"); },

  // Controls & Layout
  get sidebar() { return document.getElementById("sidebar"); },
  get sidebarOverlay() { return document.getElementById("sidebarOverlay"); },
  get mobileToggle() { return document.getElementById("mobileToggle"); },
  get refreshButton() { return document.getElementById("refreshUsers"); },
  get searchInput() { return document.getElementById("searchInput"); },
  get sortAccessBtn() { return document.getElementById("sortAccessBtn"); },
  get sortDirectionLabel() { return document.getElementById("sortDirectionLabel"); },

  // Dashboard KPI
  get totalUsers() { return document.getElementById("totalUsers"); },
  get activeUsers() { return document.getElementById("activeUsers"); },
  get lastLoginUser() { return document.getElementById("lastLoginUser"); },
  get lastLoginValue() { return document.getElementById("lastLoginValue"); }
};

// ===========================================================
// 4. GERENCIAMENTO DE AUTENTICAÇÃO E SESSÃO
// ===========================================================
function obterUsuarioSessao() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Erro ao ler sessão do localStorage:", err);
    return null;
  }
}

function encerrarSessao() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}

function verificarAutenticacao() {
  const usuario = obterUsuarioSessao();
  if (!usuario || !usuario.token) {
    encerrarSessao();
    return false;
  }
  return true;
}

// ===========================================================
// 5. CLIENTE HTTP RESILIENTE
// ===========================================================
async function fazerRequisicaoAPI(url, opcoes = {}, timeoutMs = 15000) {
  if (!verificarAutenticacao()) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const usuario = obterUsuarioSessao();
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${usuario.token}`,
    ...(opcoes.headers || {})
  };

  try {
    const resposta = await fetch(url, {
      ...opcoes,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Trata Token Expirado / Não Autorizado
    if (resposta.status === 401 || resposta.status === 403) {
      alert("Sua sessão expirou. Faça login novamente.");
      encerrarSessao();
      return null;
    }

    if (!resposta.ok) {
      if (resposta.status === 404) {
        throw new Error("Recurso não encontrado no servidor.");
      }
      if (resposta.status >= 500) {
        throw new Error("Erro interno do servidor. Tente novamente mais tarde.");
      }
      throw new Error(`Erro na requisição (${resposta.status})`);
    }

    const contentType = resposta.headers.get("content-type") || "";
    const textData = await resposta.text();

    if (!textData || !textData.trim()) {
      return null;
    }

    if (contentType.includes("text/html") || textData.trim().startsWith("<")) {
      throw new Error("O servidor retornou HTML em vez de JSON.");
    }

    return JSON.parse(textData);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("A requisição excedeu o tempo limite. Verifique sua conexão.");
    }
    throw error;
  }
}

// ===========================================================
// 6. HELPER FUNCTIONS DE FORMATAÇÃO E DOM
// ===========================================================
function debounce(fn, delayMs = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

function textoOuTraco(valor, textoPadrao = "—") {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return textoPadrao;
  }
  return String(valor);
}

function formatarStatus(status) {
  const norm = String(status || "ACTIVE").toUpperCase();
  const ehAtivo = ["ACTIVE", "ATIVO", "TRUE", "1", "ADMIN"].includes(norm);
  return {
    label: ehAtivo ? "Ativo" : "Inativo",
    className: ehAtivo ? "status-pill" : "status-pill inactive"
  };
}

function formatarDataHora(dataIso) {
  if (!dataIso) return "Nunca acessou";
  const date = new Date(dataIso);
  if (Number.isNaN(date.getTime())) return "Nunca acessou";

  return `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

function criarElemento(tag, { className, texto, atributos = {} } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (texto !== undefined) el.textContent = texto;
  Object.entries(atributos).forEach(([chave, valor]) => el.setAttribute(chave, valor));
  return el;
}

// ===========================================================
// 7. DASHBOARD / INDICADORES
// ===========================================================
function atualizarResumo(clientes) {
  if (!Array.isArray(clientes)) return;

  if (dom.totalUsers) {
    dom.totalUsers.textContent = clientes.length;
  }

  if (dom.activeUsers) {
    const ativos = clientes.filter(c => {
      const st = String(c.status || c.tipo || "ACTIVE").toUpperCase();
      return ["ACTIVE", "ATIVO", "TRUE", "1", "ADMIN"].includes(st);
    }).length;
    dom.activeUsers.textContent = ativos;
  }

  if (dom.lastLoginUser && dom.lastLoginValue) {
    const ordenados = clientes
      .filter(c => c.ultimoAcesso)
      .sort((a, b) => new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso));

    const maisRecente = ordenados[0];

    if (maisRecente) {
      dom.lastLoginUser.textContent = maisRecente.nome || "Usuário";
      dom.lastLoginValue.replaceChildren(
        criarElemento("i", { className: "fa-solid fa-clock-rotate-left" }),
        document.createTextNode(` ${formatarDataHora(maisRecente.ultimoAcesso)}`)
      );
    } else {
      dom.lastLoginUser.textContent = "Nenhum acesso";
      dom.lastLoginValue.textContent = "Sem registros";
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
    criarElemento("p", { texto: "Carregando clientes do sistema..." })
  );
  dom.listaClientes.appendChild(container);
}

function renderizarErro(mensagem, onRetry) {
  if (!dom.listaClientes) return;
  dom.listaClientes.innerHTML = "";

  const container = criarElemento("div", { className: "empty-state empty-state-error" });
  const btnRetry = criarElemento("button", { className: "primary-btn", atributos: { type: "button" } });
  btnRetry.append(
    criarElemento("i", { className: "fa-solid fa-rotate-right" }),
    document.createTextNode(" Tentar Novamente")
  );
  btnRetry.addEventListener("click", onRetry);

  container.append(
    criarElemento("i", { className: "fa-solid fa-triangle-exclamation" }),
    criarElemento("p", { texto: mensagem || "Erro ao carregar lista de clientes." }),
    btnRetry
  );

  dom.listaClientes.appendChild(container);
}

function renderizarVazio(temFiltro) {
  if (!dom.listaClientes) return;
  dom.listaClientes.innerHTML = "";

  const container = criarElemento("div", { className: "empty-state" });
  container.append(
    criarElemento("i", { className: "fa-solid fa-users-slash" }),
    criarElemento("p", {
      texto: temFiltro ? "Nenhum cliente encontrado para os termos pesquisados." : "Nenhum cliente cadastrado no momento."
    })
  );
  dom.listaClientes.appendChild(container);
}

function criarCabecalhoTabela() {
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  const colunas = ["Usuário", "Email", "CPF", "Tipo", "Último Acesso", "Endereço", "Status", "Ações"];

  colunas.forEach(titulo => {
    tr.appendChild(criarElemento("th", { texto: titulo }));
  });

  thead.appendChild(tr);
  return thead;
}

function criarLinhaCliente(cliente) {
  const tr = document.createElement("tr");
  const acessou = Boolean(cliente.ultimoAcesso) && !Number.isNaN(new Date(cliente.ultimoAcesso).getTime());
  if (!acessou) tr.className = "highlight-never-access";

  const statusInfo = formatarStatus(cliente.status || cliente.tipo);

  // Coluna 1: Nome/Email
  const tdUsuario = criarElemento("td", { atributos: { "data-label": "Usuário" } });
  tdUsuario.append(
    criarElemento("div", { className: "user-name", texto: textoOuTraco(cliente.nome, "Sem Nome") }),
    criarElemento("div", { className: "user-email", texto: textoOuTraco(cliente.email, "Sem Email") })
  );

  // Coluna 2: Email Simples
  const tdEmail = criarElemento("td", { texto: textoOuTraco(cliente.email), atributos: { "data-label": "Email" } });

  // Coluna 3: CPF
  const tdCpf = criarElemento("td", { texto: textoOuTraco(cliente.cpf), atributos: { "data-label": "CPF" } });

  // Coluna 4: Tipo
  const tdTipo = criarElemento("td", { texto: textoOuTraco(cliente.tipo, "CLIENTE"), atributos: { "data-label": "Tipo" } });

  // Coluna 5: Último Acesso
  const tdUltimoAcesso = criarElemento("td", { atributos: { "data-label": "Último acesso" } });
  const spanAcesso = criarElemento("span", { className: `last-login ${acessou ? "" : "never-accessed"}`.trim() });
  spanAcesso.append(
    criarElemento("i", { className: "fa-solid fa-clock" }),
    document.createTextNode(` ${formatarDataHora(cliente.ultimoAcesso)}`)
  );
  tdUltimoAcesso.appendChild(spanAcesso);

  // Coluna 6: Endereço
  const tdEndereco = criarElemento("td", { texto: textoOuTraco(cliente.endereco), atributos: { "data-label": "Endereço" } });

  // Coluna 7: Status
  const tdStatus = criarElemento("td", { atributos: { "data-label": "Status" } });
  tdStatus.appendChild(criarElemento("span", { className: statusInfo.className, texto: statusInfo.label }));

  // Coluna 8: Ações
  const tdAcoes = criarElemento("td", { atributos: { "data-label": "Ações" } });
  const containerAcoes = criarElemento("div", { className: "actions" });

  const btnVer = criarElemento("button", { className: "icon-btn view-btn", atributos: { title: "Visualizar Detalhes" } });
  btnVer.appendChild(criarElemento("i", { className: "fa-solid fa-eye" }));
  btnVer.addEventListener("click", () => abrirModalUsuario(cliente));

  const btnRemover = criarElemento("button", { className: "delete-btn", atributos: { title: "Remover Cliente" } });
  btnRemover.appendChild(criarElemento("i", { className: "fa-solid fa-trash" }));
  btnRemover.addEventListener("click", () => removerCliente(cliente.cpf));

  const btnWpp = criarElemento("button", { className: "send-message-btn", atributos: { title: "Enviar WhatsApp" } });
  btnWpp.appendChild(criarElemento("i", { className: "fa-brands fa-whatsapp" }));
  btnWpp.addEventListener("click", () => abrirModalMensagemCliente(cliente));

  containerAcoes.append(btnVer, btnRemover, btnWpp);
  tdAcoes.appendChild(containerAcoes);

  tr.append(tdUsuario, tdEmail, tdCpf, tdTipo, tdUltimoAcesso, tdEndereco, tdStatus, tdAcoes);
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
  clientes.forEach(cliente => {
    if (cliente && typeof cliente === "object") {
      fragment.appendChild(criarLinhaCliente(cliente));
    }
  });

  tbody.appendChild(fragment);
  table.appendChild(tbody);
  wrapper.appendChild(table);

  dom.listaClientes.innerHTML = "";
  dom.listaClientes.appendChild(wrapper);
}

// ===========================================================
// 9. MODAL DE USUÁRIO & GERENCIAMENTO DE PROCESSOS
// ===========================================================
async function abrirModalUsuario(cliente) {
  estado.clienteEmDetalhe = cliente;

  if (dom.usuarioNome) dom.usuarioNome.textContent = textoOuTraco(cliente.nome);
  if (dom.usuarioEmail) dom.usuarioEmail.textContent = textoOuTraco(cliente.email);
  if (dom.usuarioCpf) dom.usuarioCpf.textContent = textoOuTraco(cliente.cpf);
  if (dom.usuarioTipo) dom.usuarioTipo.textContent = textoOuTraco(cliente.tipo, "CLIENTE");
  if (dom.usuarioEndereco) dom.usuarioEndereco.textContent = textoOuTraco(cliente.endereco);

  const statusInfo = formatarStatus(cliente.status || cliente.tipo);
  if (dom.usuarioStatus) dom.usuarioStatus.textContent = statusInfo.label;
  if (dom.usuarioUltimoLogin) dom.usuarioUltimoLogin.textContent = formatarDataHora(cliente.ultimoAcesso);

  if (dom.modalUsuario) {
    dom.modalUsuario.classList.add("active");
    dom.modalUsuario.setAttribute("aria-hidden", "false");
  }
  document.body.classList.add("modal-open");

  if (dom.formNovoProcesso) {
    dom.formNovoProcesso.style.display = "none";
  }

  const idParaProcessos = cliente.id || cliente._id || cliente.cpf;
  if (idParaProcessos) {
    const processos = await buscarProcessos(idParaProcessos);
    renderizarProcessos(processos);
  }
}

function fecharModalUsuario() {
  if (dom.modalUsuario) {
    dom.modalUsuario.classList.remove("active");
    dom.modalUsuario.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("modal-open");
  estado.clienteEmDetalhe = null;
}

function renderizarProcessos(processos) {
  if (!dom.listaProcessos) return;
  dom.listaProcessos.innerHTML = "";

  if (!Array.isArray(processos) || processos.length === 0) {
    dom.listaProcessos.innerHTML = "<p style='color: #6b7280; font-style: italic;'>Nenhum processo cadastrado para este cliente.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();

  processos.forEach(p => {
    const card = criarElemento("div", {
      atributos: {
        style: "background: #f3f4f6; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid #3b82f6;"
      }
    });

    const valorFormatado = Number(p.valorProcesso || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    card.innerHTML = `
      <div><strong>Tipo:</strong> ${textoOuTraco(p.tipo)} | <strong>Status:</strong> ${textoOuTraco(p.status)}</div>
      <div><strong>Nº Processo:</strong> ${textoOuTraco(p.numeroProcesso)} | <strong>Valor:</strong> ${valorFormatado}</div>
      <div><strong>Doc. Pendentes:</strong> ${textoOuTraco(p.documentosPendentes)} | <strong>Pendências:</strong> ${textoOuTraco(p.pendencias)}</div>
      <div><strong>Obs:</strong> ${textoOuTraco(p.observacao)}</div>
      <div><strong>Pagamento:</strong> ${p.pagamentoRealizado ? "Sim" : "Não"} | <strong>Biometria:</strong> ${p.biometriaRealizada ? "Sim" : "Não"}</div>
    `;

    fragment.appendChild(card);
  });

  dom.listaProcessos.appendChild(fragment);
}

// ===========================================================
// 10. FILTROS, BUSCA E ORDENAÇÃO
// ===========================================================
function aplicarFiltrosEOrdenacao() {
  const termo = dom.searchInput?.value.trim().toLowerCase() || "";

  let resultado = estado.clientes.filter(cliente => {
    if (!termo) return true;
    const campos = [cliente.nome, cliente.email, cliente.cpf, cliente.tipo];
    return campos.some(campo => String(campo || "").toLowerCase().includes(termo));
  });

  resultado.sort((a, b) => {
    const timeA = new Date(a.ultimoAcesso).getTime();
    const timeB = new Date(b.ultimoAcesso).getTime();
    const valA = Number.isNaN(timeA) ? -Infinity : timeA;
    const valB = Number.isNaN(timeB) ? -Infinity : timeB;

    return estado.sortAscending ? valA - valB : valB - valA;
  });

  return resultado;
}

function renderizarListaAtual() {
  renderizarClientes(aplicarFiltrosEOrdenacao());
}

// ===========================================================
// 11. OPERAÇÕES DE REQUISIÇÃO À API
// ===========================================================
export async function listarClientes() {
  renderizarLoading();
  try {
    const dados = await fazerRequisicaoAPI(ENDPOINTS.CLIENTES);

    if (dados === null) return;

    if (!Array.isArray(dados)) {
      throw new Error("Formato de dados de clientes inválido retornado pelo servidor.");
    }

    estado.clientes = dados;
    atualizarResumo(estado.clientes);
    renderizarListaAtual();
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    renderizarErro(error.message, listarClientes);
  }
}

export async function listarUsuarios() {
  try {
    const dados = await fazerRequisicaoAPI(ENDPOINTS.USERS);
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return [];
  }
}

export async function removerCliente(cpf) {
  if (!cpf) return;

  const confirmou = confirm(`Deseja remover o cliente com CPF ${cpf}? Esta ação não pode ser desfeita.`);
  if (!confirmou) return;

  try {
    await fazerRequisicaoAPI(ENDPOINTS.REMOVE_CLIENTE(cpf), { method: "DELETE" });
    await listarClientes();
  } catch (error) {
    alert(error.message || "Erro ao remover cliente.");
  }
}

export async function buscarProcessos(usuarioId) {
  try {
    const dados = await fazerRequisicaoAPI(ENDPOINTS.PROCESSOS_CLIENTE(usuarioId));
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error("Erro ao buscar processos:", error);
    return [];
  }
}

export async function criarProcesso(usuarioId, processo) {
  try {
    return await fazerRequisicaoAPI(ENDPOINTS.CRIAR_PROCESSO(usuarioId), {
      method: "POST",
      body: JSON.stringify(processo)
    });
  } catch (error) {
    alert(error.message || "Erro ao criar processo.");
    return null;
  }
}

// ===========================================================
// 12. BINDING DE EVENTOS
// ===========================================================
function configurarEventosSidebar() {
  const toggle = () => {
    if (!dom.sidebar) return;
    const isOpened = dom.sidebar.classList.toggle("open");
    dom.sidebarOverlay?.classList.toggle("active", isOpened);
    document.body.classList.toggle("modal-open", isOpened);
  };

  const fechar = () => {
    dom.sidebar?.classList.remove("open");
    dom.sidebarOverlay?.classList.remove("active");
    document.body.classList.remove("modal-open");
  };

  dom.mobileToggle?.addEventListener("click", toggle);
  dom.sidebarOverlay?.addEventListener("click", fechar);

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach(i => i.classList.remove("active"));
      link.classList.add("active");
      fechar();
    });
  });
}

function configurarEventosModalUsuario() {
  dom.fecharUsuario?.addEventListener("click", fecharModalUsuario);

  dom.modalUsuario?.addEventListener("click", (e) => {
    if (e.target === dom.modalUsuario) fecharModalUsuario();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dom.modalUsuario?.classList.contains("active")) {
      fecharModalUsuario();
    }
  });

  dom.btnToggleNovoProcesso?.addEventListener("click", () => {
    if (dom.formNovoProcesso) {
      const oculto = dom.formNovoProcesso.style.display === "none" || !dom.formNovoProcesso.style.display;
      dom.formNovoProcesso.style.display = oculto ? "block" : "none";
    }
  });

  dom.formNovoProcesso?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!estado.clienteEmDetalhe) return;

    const id = estado.clienteEmDetalhe.id || estado.clienteEmDetalhe._id || estado.clienteEmDetalhe.cpf;
    const novoProcesso = {
      tipo: document.getElementById("procTipo")?.value || "",
      status: document.getElementById("procStatus")?.value || "",
      numeroProcesso: document.getElementById("procNumero")?.value || "",
      valorProcesso: parseFloat(document.getElementById("procValor")?.value) || 0,
      pendencias: document.getElementById("procPendencias")?.value || "",
      documentosPendentes: document.getElementById("procDocsPendentes")?.value || "",
      observacao: document.getElementById("procObservacao")?.value || "",
      pagamentoRealizado: Boolean(document.getElementById("procPagamento")?.checked),
      biometriaRealizada: Boolean(document.getElementById("procBiometria")?.checked)
    };

    const resultado = await criarProcesso(id, novoProcesso);
    if (resultado) {
      dom.formNovoProcesso.reset();
      dom.formNovoProcesso.style.display = "none";
      const atualizados = await buscarProcessos(id);
      renderizarProcessos(atualizados);
    }
  });

  dom.btnVerify?.addEventListener("click", () => {
    if (estado.clienteEmDetalhe && modalGuias) {
      modalGuias.carregarGuias(estado.clienteEmDetalhe);
    }
  });
}

function configurarEventosLista() {
  dom.refreshButton?.addEventListener("click", listarClientes);
  dom.searchInput?.addEventListener("input", debounce(renderizarListaAtual, 200));

  dom.sortAccessBtn?.addEventListener("click", () => {
    estado.sortAscending = !estado.sortAscending;
    if (dom.sortDirectionLabel) {
      dom.sortDirectionLabel.textContent = estado.sortAscending ? "↑" : "↓";
    }
    renderizarListaAtual();
  });
}

// ===========================================================
// 13. INICIALIZAÇÃO CONTROLADA DA APLICAÇÃO
// ===========================================================
function inicializar() {
  if (!verificarAutenticacao()) return;

  try {
    modalGuias = ModalGuiasAdmin();
  } catch (err) {
    console.warn("ModalGuiasAdmin não pôde ser instanciado diretamente:", err);
  }

  configurarEventosSidebar();
  configurarEventosModalUsuario();
  configurarEventosLista();

  // Execução inicial obrigatória
  listarClientes();
}

// Garante carregamento do DOM antes da execução
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializar);
} else {
  inicializar();
}