import { pegarToken, pegarUsuarioLogado, verificarAdmin } from "./auth.js";

const API_CLIENTES = "https://apiadministrativa.onrender.com/api/clientes";
const API_REMOVE = "https://apiadministrativa.onrender.com/api/remove";

const listaClientes = document.getElementById("clientes");
const modalUsuario = document.getElementById("modalUsuario");
const fecharUsuario = document.getElementById("fecharUsuario");
const usuarioNome = document.getElementById("usuarioNome");
const usuarioEmail = document.getElementById("usuarioEmail");
const usuarioCpf = document.getElementById("usuarioCpf");
const usuarioEndereco = document.getElementById("usuarioEndereco");
const usuarioTipo = document.getElementById("usuarioTipo");
const usuarioStatus = document.getElementById("usuarioStatus");
const usuarioUltimoLogin = document.getElementById("usuarioUltimoLogin");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileToggle = document.getElementById("mobileToggle");
const refreshButton = document.getElementById("refreshUsers");
const searchInput = document.getElementById("searchInput");
const sortAccessBtn = document.getElementById("sortAccessBtn");
const sortDirectionLabel = document.getElementById("sortDirectionLabel");
const adminWelcomeTitle = document.getElementById("adminWelcomeTitle");
const adminHeroTitle = document.getElementById("adminHeroTitle");
const adminUserType = document.getElementById("adminUserType");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountCpf = document.getElementById("accountCpf");
const accountType = document.getElementById("accountType");
const themeSelect = document.getElementById("themeSelect");

let clientesCache = [];
let sortAscending = false;

function toggleSidebar(force) {
  if (!sidebar) return;
  const shouldOpen = typeof force === "boolean" ? force : !sidebar.classList.contains("open");
  sidebar.classList.toggle("open", shouldOpen);
  sidebarOverlay?.classList.toggle("active", shouldOpen);
  document.body.classList.toggle("modal-open", shouldOpen);
}

function closeSidebar() {
  toggleSidebar(false);
}

function formatarStatus(status) {
  const normalized = String(status || "PENDENTE").toUpperCase();
  const isPago = normalized === "PAGO" || normalized === "PAID" || normalized === "TRUE" || normalized === "1";
  return {
    label: isPago ? "Pago" : "Pendente",
    className: isPago ? "status-pill" : "status-pill inactive"
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

function atualizarResumo(clientes) {
  const totalElement = document.getElementById("totalUsers");
  const ativosElement = document.getElementById("activeUsers");
  const lastLoginUser = document.getElementById("lastLoginUser");
  const lastLoginValue = document.getElementById("lastLoginValue");

  if (totalElement) totalElement.textContent = clientes.length;
  if (ativosElement) {
    const ativos = clientes.filter((cliente) => {
      const status = String(cliente.statusPagamento || cliente.status || cliente.tipo || "PENDENTE").toUpperCase();
      return status === "PAGO" || status === "PAID" || status === "TRUE" || status === "1";
    }).length;
    ativosElement.textContent = ativos;
  }

  const usuariosComLogin = clientes.filter((cliente) => cliente.ultimoAcesso);
  const maisRecente = [...usuariosComLogin].sort((a, b) => new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso))[0];

  if (lastLoginUser && lastLoginValue) {
    if (maisRecente) {
      lastLoginUser.textContent = maisRecente.nome || "Usuário";
      lastLoginValue.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${formatarUltimoLogin(maisRecente.ultimoAcesso)}`;
    } else {
      lastLoginUser.textContent = "Nenhum acesso";
      lastLoginValue.textContent = "Último login registrado";
    }
  }
}

function renderizarClientes(clientes) {
  if (!listaClientes) return;
  listaClientes.innerHTML = "";

  if (!Array.isArray(clientes) || clientes.length === 0) {
    listaClientes.innerHTML = '<div class="empty-state">Nenhum usuário encontrado.</div>';
    return;
  }

  const table = document.createElement("div");
  table.className = "table-wrapper";
  table.innerHTML = `
    <table class="users-table">
      <thead>
        <tr>
          <th>Usuário</th>
          <th>Email</th>
          <th>CPF</th>
          <th>Tipo</th>
          <th>Último acesso</th>
          <th>Endereço</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  const body = table.querySelector("tbody");

  clientes.forEach((cliente) => {
    const row = document.createElement("tr");
    const status = formatarStatus(cliente.statusPagamento || cliente.status || cliente.tipo);
    const ultimoAcesso = formatarUltimoLogin(cliente.ultimoAcesso);
    const acessou = Boolean(cliente.ultimoAcesso) && !Number.isNaN(new Date(cliente.ultimoAcesso).getTime());
    row.className = acessou ? "" : "highlight-never-access";
    row.innerHTML = `
      <td data-label="Usuário">
        <div class="user-name">${cliente.nome || "Sem nome"}</div>
        <div class="user-email">${cliente.email || "Sem email"}</div>
      </td>
      <td data-label="Email">${cliente.email || "—"}</td>
      <td data-label="CPF">${cliente.cpf || "—"}</td>
      <td data-label="Tipo">${cliente.tipo || "CLIENTE"}</td>
      <td data-label="Último acesso" title="${ultimoAcesso}">
        <span class="last-login ${acessou ? "" : "never-accessed"}">
          <i class="fa-solid fa-clock"></i> ${ultimoAcesso}
        </span>
      </td>
      <td data-label="Endereço">${cliente.endereco || "—"}</td>
      <td data-label="Status"><span class="${status.className}">${status.label}</span></td>
      <td data-label="Ações">
        <div class="actions">
          <button class="icon-btn view-btn" title="Visualizar"><i class="fa-solid fa-eye"></i></button>
          <button class="delete-btn" title="Remover"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;

    row.querySelector(".view-btn").addEventListener("click", () => abrirModalUsuario(cliente));
    row.querySelector(".delete-btn").addEventListener("click", () => removerCliente(cliente.cpf));
    body.appendChild(row);
  });

  listaClientes.appendChild(table);
}

async function carregarClientes() {
  try {
    const token = pegarToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const resposta = await fetch(API_CLIENTES, { headers });
    if (!resposta.ok) throw new Error("Falha ao buscar clientes");

    const clientes = await resposta.json();
    clientesCache = Array.isArray(clientes) ? clientes : [];
    atualizarResumo(clientesCache);
    renderizarClientes(aplicarFiltroEOrdenacao(clientesCache));
  } catch (error) {
    console.error("Erro ao carregar clientes", error);
    if (listaClientes) {
      listaClientes.innerHTML = '<div class="empty-state">Não foi possível carregar a lista de usuários.</div>';
    }
  }
}

function aplicarFiltroEOrdenacao(clientes) {
  const termo = searchInput?.value.trim().toLowerCase() || "";
  const filtrados = clientes.filter((cliente) => {
    const nome = String(cliente.nome || "").toLowerCase();
    const email = String(cliente.email || "").toLowerCase();
    const cpf = String(cliente.cpf || "").toLowerCase();
    const tipo = String(cliente.tipo || "").toLowerCase();
    return nome.includes(termo) || email.includes(termo) || cpf.includes(termo) || tipo.includes(termo);
  });

  return filtrados.slice().sort((a, b) => {
    const dataA = new Date(a.ultimoAcesso).getTime();
    const dataB = new Date(b.ultimoAcesso).getTime();
    const aVal = Number.isNaN(dataA) ? -8640000000000000 : dataA;
    const bVal = Number.isNaN(dataB) ? -8640000000000000 : dataB;
    return sortAscending ? aVal - bVal : bVal - aVal;
  });
}

function abrirModalUsuario(cliente) {
  if (usuarioNome) usuarioNome.textContent = cliente.nome || "Sem nome";
  if (usuarioEmail) usuarioEmail.textContent = cliente.email || "—";
  if (usuarioCpf) usuarioCpf.textContent = cliente.cpf || "—";
  if (usuarioEndereco) usuarioEndereco.textContent = cliente.endereco || "—";
  if (usuarioTipo) usuarioTipo.textContent = cliente.tipo || "CLIENTE";
  const status = formatarStatus(cliente.statusPagamento || cliente.status || cliente.tipo);
  if (usuarioStatus) {
    usuarioStatus.innerHTML = `<span class="${status.className}">${status.label}</span>`;
    if (cliente.dataPagamento) {
      const detalhePagamento = document.createElement("div");
      detalhePagamento.className = "payment-detail";
      detalhePagamento.textContent = `Pagamento em ${formatarUltimoLogin(cliente.dataPagamento)}`;
      usuarioStatus.appendChild(detalhePagamento);
    } else {
      const detalhePagamento = document.createElement("div");
      detalhePagamento.className = "payment-detail pending";
      detalhePagamento.textContent = "Pagamento pendente";
      usuarioStatus.appendChild(detalhePagamento);
    }
  }
  if (usuarioUltimoLogin) {
    usuarioUltimoLogin.textContent = formatarUltimoLogin(cliente.ultimoAcesso);
  }
  modalUsuario?.classList.add("active");
  document.body.classList.add("modal-open");
}

async function removerCliente(cpf) {
  if (!cpf) return;
  const confirmar = confirm("Deseja remover este usuário?");
  if (!confirmar) return;

  try {
    const token = pegarToken();
    const resposta = await fetch(`${API_REMOVE}/${cpf}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!resposta.ok) throw new Error("Erro ao remover");
    await carregarClientes();
  } catch (error) {
    console.error(error);
    alert("Não foi possível remover o usuário.");
  }
}

function popularDadosAdmin() {
  const usuario = pegarUsuarioLogado() || JSON.parse(localStorage.getItem("usuario") || "null");
  if (!usuario) return;

  const nome = usuario.nome || "Administrador";
  const tipo = usuario.tipo || "ADMIN";

  if (adminWelcomeTitle) adminWelcomeTitle.textContent = `Olá, ${nome}`;
  if (adminHeroTitle) adminHeroTitle.textContent = `Bem-vindo, ${nome}`;
  if (adminUserType) adminUserType.textContent = tipo;
  if (accountName) accountName.textContent = nome;
  if (accountEmail) accountEmail.textContent = usuario.email || "—";
  if (accountCpf) accountCpf.textContent = usuario.cpf || "—";
  if (accountType) accountType.textContent = tipo;

  const temaSalvo = localStorage.getItem("appTheme") || "light";
  document.body.dataset.theme = temaSalvo;
  if (themeSelect) themeSelect.value = temaSalvo;
}

function inicializarAdmin() {
  if (!verificarAdmin()) {
    return;
  }

  popularDadosAdmin();

  if (fecharUsuario) {
    fecharUsuario.addEventListener("click", () => {
      modalUsuario?.classList.remove("active");
      document.body.classList.remove("modal-open");
    });
  }

  modalUsuario?.addEventListener("click", (event) => {
    if (event.target === modalUsuario) {
      modalUsuario.classList.remove("active");
      document.body.classList.remove("modal-open");
    }
  });

  mobileToggle?.addEventListener("click", () => toggleSidebar());
  sidebarOverlay?.addEventListener("click", closeSidebar);
  refreshButton?.addEventListener("click", carregarClientes);
  searchInput?.addEventListener("input", () => renderizarClientes(aplicarFiltroEOrdenacao(clientesCache)));
  sortAccessBtn?.addEventListener("click", () => {
    sortAscending = !sortAscending;
    if (sortDirectionLabel) sortDirectionLabel.textContent = sortAscending ? "↑" : "↓";
    renderizarClientes(aplicarFiltroEOrdenacao(clientesCache));
  });

  document.querySelectorAll(".status-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const guide = button.dataset.guide;
      const isPaid = button.textContent.includes("Pago");
      button.textContent = isPaid ? "Marcar como pendente" : "Foi pago";
      button.classList.toggle("is-paid", !isPaid);
      if (guide) {
        const note = document.querySelector(`[data-guide="${guide}"]`);
        if (note && note.tagName === "TEXTAREA") {
          note.placeholder = isPaid ? "Descreva o que falta para concluir." : "Defina o que falta para concluir a guia.";
        }
      }
    });
  });

  document.querySelectorAll(".guide-notes").forEach((textarea) => {
    const savedValue = localStorage.getItem(`guide:${textarea.dataset.guide}`);
    if (savedValue) textarea.value = savedValue;

    textarea.addEventListener("input", () => {
      localStorage.setItem(`guide:${textarea.dataset.guide}`, textarea.value);
    });
  });

  themeSelect?.addEventListener("change", (event) => {
    const selectedTheme = event.target.value;
    localStorage.setItem("appTheme", selectedTheme);
    document.body.dataset.theme = selectedTheme;
  });

  Array.from(document.querySelectorAll(".nav-link")).forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      closeSidebar();
    });
  });

  carregarClientes();
}

document.addEventListener("DOMContentLoaded", inicializarAdmin);