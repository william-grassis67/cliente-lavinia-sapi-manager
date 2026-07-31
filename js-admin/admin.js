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
  CLIENTES: `${API_BASE_URL}/api/admin/clientes`,
  REGISTER: `${API_BASE_URL}/api/admin/register`,
  PAGAMENTOS: `${API_BASE_URL}/api/admin/pagamentos`,
  REMOVE_CLIENTE: (cpf) => `${API_BASE_URL}/api/admin/clientes/${encodeURIComponent(cpf)}`,
  PROCESSOS_CLIENTE: (usuarioId) => `${API_BASE_URL}/api/cliente/processos/${encodeURIComponent(usuarioId)}`,
  CRIAR_PROCESSO: (usuarioId) => `${API_BASE_URL}/api/admin/processos/${encodeURIComponent(usuarioId)}`,
  ENVIAR_DOCUMENTO: (processoId) => `${API_BASE_URL}/api/admin/processos/${encodeURIComponent(processoId)}/documentos`,
  GUIAS_CLIENTE: (usuarioId) => `${API_BASE_URL}/api/admin/clientes/${encodeURIComponent(usuarioId)}/guias`
};

// Tipos de processo sugeridos para o formulário de criação
const TIPOS_PROCESSO = [
  "Aposentadoria por Idade",
  "Aposentadoria por Tempo",
  "Auxílio Doença",
  "Auxílio Acidente",
  "Pensão por Morte",
  "BPC/LOAS",
  "Salário Maternidade",
  "Revisão de Benefício",
  "Planejamento Previdenciário"
];

// ===========================================================
// 2. ESTADO GLOBAL DA APLICAÇÃO
// ===========================================================
const estado = {
  clientes: [],
  sortAscending: false,
  clienteEmDetalhe: null,
  // Guarda, apenas nesta sessão do navegador, os nomes dos arquivos
  // enviados com sucesso para cada processo (não existe endpoint de
  // listagem de documentos no backend atual).
  documentosEnviadosPorProcesso: {}
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
  get usuarioTitulo() { return document.getElementById("usuarioTitulo"); },
  get usuarioNome() { return document.getElementById("usuarioNome"); },
  get usuarioEmail() { return document.getElementById("usuarioEmail"); },
  get usuarioCpf() { return document.getElementById("usuarioCpf"); },
  get usuarioTelefone() { return document.getElementById("usuarioTelefone"); },
  get usuarioEndereco() { return document.getElementById("usuarioEndereco"); },
  get usuarioTipo() { return document.getElementById("usuarioTipo"); },
  get usuarioStatus() { return document.getElementById("usuarioStatus"); },
  get usuarioUltimoLogin() { return document.getElementById("usuarioUltimoLogin"); },
  get btnVerify() { return document.getElementById("btn_verify"); },

  // Processos DOM
  get btnToggleNovoProcesso() { return document.getElementById("btnToggleNovoProcesso"); },
  get formNovoProcesso() { return document.getElementById("formNovoProcesso"); },
  get procTipo() { return document.getElementById("procTipo"); },
  get procTipoLista() { return document.getElementById("procTipoLista"); },
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
    "Authorization": `Bearer ${usuario.token}`,
    ...(opcoes.headers || {})
  };

  // Aplica Content-Type como JSON apenas se não for FormData
  if (!(opcoes.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

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

// Classifica o status livre de um Processo em uma das 3 fases visuais
// (aberto / em análise / concluído), sem inventar valores que o backend
// não envia — serve apenas para escolher a cor do badge e do marcador.
function classificarStatusProcesso(status, dataConclusao) {
  if (dataConclusao) {
    return { fase: "concluido", label: textoOuTraco(status, "Concluído"), className: "processo-badge processo-badge-concluido" };
  }
  const norm = String(status || "").toUpperCase();
  if (!norm || norm.includes("AGUARD") || norm.includes("PENDENTE") || norm.includes("ABERT")) {
    return { fase: "aberto", label: textoOuTraco(status, "Aberto"), className: "processo-badge processo-badge-aberto" };
  }
  if (norm.includes("CONCLU") || norm.includes("FINALIZ") || norm.includes("DEFERID")) {
    return { fase: "concluido", label: status, className: "processo-badge processo-badge-concluido" };
  }
  if (norm.includes("INDEFER") || norm.includes("NEGAD") || norm.includes("CANCEL")) {
    return { fase: "negado", label: status, className: "processo-badge processo-badge-negado" };
  }
  return { fase: "andamento", label: status, className: "processo-badge processo-badge-andamento" };
}

// Classifica a situação de uma guia em Paga / Pendente / Vencida
function classificarSituacaoGuia(guia) {
  if (guia.dataPagamento) {
    return { label: "Paga", className: "guia-badge guia-badge-paga", icone: "fa-circle-check" };
  }
  const vencimento = guia.dataVencimento || guia.vencimento;
  if (vencimento) {
    const dataVenc = new Date(vencimento);
    if (!Number.isNaN(dataVenc.getTime()) && dataVenc.getTime() < Date.now()) {
      return { label: "Vencida", className: "guia-badge guia-badge-vencida", icone: "fa-triangle-exclamation" };
    }
  }
  return { label: "Pendente", className: "guia-badge guia-badge-pendente", icone: "fa-clock" };
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

function formatarData(dataIso, textoPadrao = "—") {
  if (!dataIso) return textoPadrao;
  const date = new Date(dataIso);
  if (Number.isNaN(date.getTime())) return textoPadrao;
  return date.toLocaleDateString("pt-BR");
}

function criarElemento(tag, { className, texto, atributos = {} } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (texto !== undefined) el.textContent = texto;
  Object.entries(atributos).forEach(([chave, valor]) => el.setAttribute(chave, valor));
  return el;
}

function obterIdCliente(cliente) {
  if (!cliente) return null;
  return cliente.id || cliente._id || cliente.usuarioId || cliente.cpf || null;
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

  const btnVer = criarElemento("button", { className: "icon-btn view-btn", atributos: { title: "Visualizar Detalhes", type: "button" } });
  btnVer.appendChild(criarElemento("i", { className: "fa-solid fa-eye" }));
  btnVer.addEventListener("click", () => abrirModalUsuario(cliente));

  const btnRemover = criarElemento("button", { className: "delete-btn", atributos: { title: "Remover Cliente", type: "button" } });
  btnRemover.appendChild(criarElemento("i", { className: "fa-solid fa-trash" }));
  btnRemover.addEventListener("click", () => removerCliente(cliente.cpf));

  const btnWpp = criarElemento("button", { className: "send-message-btn", atributos: { title: "Enviar WhatsApp", type: "button" } });
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
// 9. MODAL DE USUÁRIO
// ===========================================================
function abrirModalUsuario(cliente) {
  estado.clienteEmDetalhe = cliente;

  if (dom.usuarioTitulo) dom.usuarioTitulo.textContent = textoOuTraco(cliente.nome, "Detalhes do cliente");
  if (dom.usuarioNome) dom.usuarioNome.textContent = textoOuTraco(cliente.nome);
  if (dom.usuarioEmail) dom.usuarioEmail.textContent = textoOuTraco(cliente.email);
  if (dom.usuarioCpf) dom.usuarioCpf.textContent = textoOuTraco(cliente.cpf);
  if (dom.usuarioTelefone) dom.usuarioTelefone.textContent = textoOuTraco(cliente.telefone);
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
    dom.formNovoProcesso.reset();
  }

  carregarProcessosDoCliente(cliente);
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
// 10. RENDERIZAÇÃO DE PROCESSOS (ProcessoDTO)
// ===========================================================
async function carregarProcessosDoCliente(cliente) {
  const id = obterIdCliente(cliente);
  if (!dom.listaProcessos) return;

  if (!id) {
    renderizarProcessos(cliente.processos || []);
    return;
  }

  renderizarProcessosCarregando();
  const processos = await buscarProcessosCliente(id);

  // Se o modal foi fechado ou o cliente trocado enquanto a requisição
  // estava em andamento, descarta o resultado.
  if (!estado.clienteEmDetalhe || obterIdCliente(estado.clienteEmDetalhe) !== id) return;

  renderizarProcessos(processos);
}

function renderizarProcessosCarregando() {
  if (!dom.listaProcessos) return;
  dom.listaProcessos.innerHTML = "";
  const container = criarElemento("div", { className: "processos-vazio", atributos: { "aria-busy": "true" } });
  container.append(
    criarElemento("i", { className: "fa-solid fa-spinner fa-spin" }),
    document.createTextNode(" Carregando processos do cliente...")
  );
  dom.listaProcessos.appendChild(container);
}

function renderizarProcessos(processos) {
  if (!dom.listaProcessos) return;
  dom.listaProcessos.innerHTML = "";

  if (!Array.isArray(processos) || processos.length === 0) {
    dom.listaProcessos.appendChild(
      criarElemento("p", { className: "processos-vazio", texto: "Nenhum processo cadastrado para este cliente." })
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  processos.forEach(processo => fragment.appendChild(criarCardProcesso(processo)));
  dom.listaProcessos.appendChild(fragment);
}

function criarCardProcesso(processo) {
  const card = criarElemento("div", { className: "processo-card" });
  const statusInfo = classificarStatusProcesso(processo.status, processo.dataConclusao);

  // Cabeçalho: tipo + badge de status
  const cabecalho = criarElemento("div", { className: "processo-cabecalho" });
  cabecalho.append(
    criarElemento("h4", { className: "processo-tipo", texto: textoOuTraco(processo.tipo, "Processo") }),
    criarElemento("span", { className: statusInfo.className, texto: statusInfo.label })
  );

  // Linha do tempo simplificada: Criado -> Em andamento -> Concluído
  const timeline = criarElemento("div", { className: "processo-timeline" });
  const etapas = [
    { chave: "aberto", texto: "Criado" },
    { chave: "andamento", texto: "Em andamento" },
    { chave: "concluido", texto: statusInfo.fase === "negado" ? "Encerrado" : "Concluído" }
  ];
  const faseAtualIndex = statusInfo.fase === "negado" ? 2 : etapas.findIndex(e => e.chave === statusInfo.fase);
  etapas.forEach((etapa, index) => {
    const concluida = index <= faseAtualIndex;
    const ponto = criarElemento("div", {
      className: `processo-timeline-etapa ${concluida ? "concluida" : ""} ${statusInfo.fase === "negado" && index === 2 ? "negada" : ""}`.trim()
    });
    ponto.append(
      criarElemento("span", { className: "processo-timeline-marcador" }),
      criarElemento("span", { className: "processo-timeline-label", texto: etapa.texto })
    );
    timeline.appendChild(ponto);
  });

  // Metadados
  const linhaDatas = criarElemento("div", { className: "processo-linha" });
  linhaDatas.append(
    criarElemento("span", { texto: `Criado em: ${formatarData(processo.dataCriacao)}` }),
    criarElemento("span", { texto: `Concluído em: ${formatarData(processo.dataConclusao, "Em andamento")}` })
  );

  const linhaExtra = criarElemento("div", { className: "processo-linha" });
  const badgeBiometria = criarElemento("span", {
    className: `processo-biometria ${processo.biometriaRealizada ? "ok" : "pendente"}`
  });
  badgeBiometria.append(
    criarElemento("i", { className: `fa-solid ${processo.biometriaRealizada ? "fa-fingerprint" : "fa-circle-exclamation"}` }),
    document.createTextNode(processo.biometriaRealizada ? " Biometria realizada" : " Biometria pendente")
  );
  linhaExtra.append(
    badgeBiometria,
    criarElemento("span", { className: "processo-ref", texto: `Nº ref.: ${textoOuTraco(processo.id)}` })
  );

  card.append(cabecalho, timeline, linhaDatas, linhaExtra);
  card.appendChild(criarUploadDocumento(processo));

  return card;
}

function criarUploadDocumento(processo) {
  const container = criarElemento("div", { className: "processo-upload" });

  const linhaAcao = criarElemento("div", { className: "processo-upload-acao" });
  const inputArquivo = document.createElement("input");
  inputArquivo.type = "file";
  inputArquivo.className = "processo-upload-input";

  const btnEnviar = criarElemento("button", {
    className: "secondary-btn",
    atributos: { type: "button" }
  });
  btnEnviar.append(
    criarElemento("i", { className: "fa-solid fa-file-arrow-up" }),
    document.createTextNode(" Adicionar Documento")
  );

  const listaEnviados = criarElemento("ul", { className: "processo-documentos-lista" });
  const idProcesso = processo.id || "";
  const jaEnviados = estado.documentosEnviadosPorProcesso[idProcesso] || [];
  jaEnviados.forEach(nomeArquivo => listaEnviados.appendChild(criarItemDocumentoEnviado(nomeArquivo)));

  btnEnviar.addEventListener("click", async () => {
    const arquivo = inputArquivo.files?.[0];
    if (!arquivo) {
      alert("Selecione um arquivo antes de enviar.");
      return;
    }
    if (!processo.id) {
      alert("Este processo não possui um identificador válido.");
      return;
    }

    btnEnviar.disabled = true;
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.innerHTML = "";
    btnEnviar.append(
      criarElemento("i", { className: "fa-solid fa-spinner fa-spin" }),
      document.createTextNode(" Enviando...")
    );

    const resultado = await enviarDocumento(processo.id, arquivo);

    btnEnviar.disabled = false;
    btnEnviar.innerHTML = textoOriginal;

    if (resultado !== null) {
      const nomeArquivo = arquivo.name;
      inputArquivo.value = "";

      if (!estado.documentosEnviadosPorProcesso[idProcesso]) {
        estado.documentosEnviadosPorProcesso[idProcesso] = [];
      }
      estado.documentosEnviadosPorProcesso[idProcesso].push(nomeArquivo);
      listaEnviados.appendChild(criarItemDocumentoEnviado(nomeArquivo));
    }
  });

  linhaAcao.append(inputArquivo, btnEnviar);
  container.append(linhaAcao, listaEnviados);
  return container;
}

function criarItemDocumentoEnviado(nomeArquivo) {
  const item = criarElemento("li", { className: "processo-documento-item" });
  item.append(
    criarElemento("i", { className: "fa-solid fa-circle-check" }),
    document.createTextNode(` ${nomeArquivo}`)
  );
  return item;
}

// ===========================================================
// 11. FILTROS, BUSCA E ORDENAÇÃO
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
// 12. OPERAÇÕES DE REQUISIÇÃO À API
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

export async function cadastrarCliente(dadosCliente) {
  try {
    const resposta = await fazerRequisicaoAPI(ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify(dadosCliente)
    });
    await listarClientes();
    return resposta;
  } catch (error) {
    alert(error.message || "Erro ao cadastrar cliente.");
    return null;
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

export async function buscarProcessosCliente(usuarioId) {
  try {
    const dados = await fazerRequisicaoAPI(ENDPOINTS.PROCESSOS_CLIENTE(usuarioId));
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error("Erro ao buscar processos do cliente:", error);
    if (dom.listaProcessos) {
      dom.listaProcessos.innerHTML = "";
      const container = criarElemento("div", { className: "processos-vazio processos-erro" });
      container.append(
        criarElemento("i", { className: "fa-solid fa-triangle-exclamation" }),
        document.createTextNode(` ${error.message || "Erro ao carregar processos."}`)
      );
      dom.listaProcessos.appendChild(container);
    }
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

export async function enviarDocumento(processoId, arquivo) {
  try {
    const formData = new FormData();
    formData.append("arquivo", arquivo);

    return await fazerRequisicaoAPI(ENDPOINTS.ENVIAR_DOCUMENTO(processoId), {
      method: "POST",
      body: formData
    });
  } catch (error) {
    alert(error.message || "Erro ao enviar documento.");
    return null;
  }
}

export async function buscarGuiasCliente(usuarioId) {
  try {
    const dados = await fazerRequisicaoAPI(ENDPOINTS.GUIAS_CLIENTE(usuarioId));
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error("Erro ao buscar guias do cliente:", error);
    return [];
  }
}

export async function listarPagamentos() {
  try {
    const dados = await fazerRequisicaoAPI(ENDPOINTS.PAGAMENTOS);
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error("Erro ao listar pagamentos:", error);
    return [];
  }
}

// Exporta o classificador de situação de guia para uso por ModalGuiasAdmin.js
export { classificarSituacaoGuia };

// ===========================================================
// 13. BINDING DE EVENTOS
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

function popularSugestoesTipoProcesso() {
  if (!dom.procTipoLista) return;
  dom.procTipoLista.innerHTML = "";
  TIPOS_PROCESSO.forEach(tipo => {
    const option = document.createElement("option");
    option.value = tipo;
    dom.procTipoLista.appendChild(option);
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

    const id = obterIdCliente(estado.clienteEmDetalhe);
    if (!id) {
      alert("Não foi possível identificar o cliente para criar o processo.");
      return;
    }

    // Envia apenas os campos que existem no modelo Processo do backend.
    const novoProcesso = {
      tipo: document.getElementById("procTipo")?.value.trim() || "",
      status: document.getElementById("procStatus")?.value.trim() || "",
      biometriaRealizada: Boolean(document.getElementById("procBiometria")?.checked)
    };

    if (!novoProcesso.tipo) {
      alert("Informe o tipo do processo.");
      return;
    }

    const submitBtn = dom.formNovoProcesso.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    const resultado = await criarProcesso(id, novoProcesso);

    if (submitBtn) submitBtn.disabled = false;

    if (resultado) {
      dom.formNovoProcesso.reset();
      dom.formNovoProcesso.style.display = "none";

      // Atualiza somente a lista de processos deste cliente, sem
      // recarregar a página nem precisar recarregar todos os clientes.
      await carregarProcessosDoCliente(estado.clienteEmDetalhe);
      alert("Processo criado com sucesso.");
    }
  });

  dom.btnVerify?.addEventListener("click", async () => {
    if (!estado.clienteEmDetalhe) return;

    const id = obterIdCliente(estado.clienteEmDetalhe);
    const guias = await buscarGuiasCliente(id);
    if (modalGuias) {
      modalGuias.carregarGuias({ ...estado.clienteEmDetalhe, guias });
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
// 14. INICIALIZAÇÃO CONTROLADA DA APLICAÇÃO
// ===========================================================
function inicializar() {
  if (!verificarAutenticacao()) return;

  try {
    modalGuias = ModalGuiasAdmin();
  } catch (err) {
    console.warn("ModalGuiasAdmin não pôde ser instanciado diretamente:", err);
  }

  popularSugestoesTipoProcesso();
  configurarEventosSidebar();
  configurarEventosModalUsuario();
  configurarEventosLista();

  listarClientes();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializar);
} else {
  inicializar();
}