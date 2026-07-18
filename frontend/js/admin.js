const API_CLIENTES = "http://localhost:8080/api/clientes";
const API_REMOVE = "http://localhost:8080/api/remove";

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
  const normalized = String(status || "ACTIVE").toUpperCase();
  const isActive = normalized === "ACTIVE" || normalized === "ATIVO" || normalized === "TRUE" || normalized === "1";
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

function atualizarResumo(clientes) {
  const totalElement = document.getElementById("totalUsers");
  const ativosElement = document.getElementById("activeUsers");
  const lastLoginUser = document.getElementById("lastLoginUser");
  const lastLoginValue = document.getElementById("lastLoginValue");

  if (totalElement) totalElement.textContent = clientes.length;
  if (ativosElement) {
    const ativos = clientes.filter((cliente) => {
      const status = String(cliente.status || cliente.tipo || "ACTIVE").toUpperCase();
      return status === "ACTIVE" || status === "ATIVO" || status === "ADMIN" || status === "TRUE" || status === "1";
    }).length;
    ativosElement.textContent = ativos;
  }

  const usuariosComLogin = clientes.filter((cliente) => cliente.ultimoAcesso);
  const maisRecente = usuariosComLogin.sort((a, b) => new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso))[0];

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
    const status = formatarStatus(cliente.status || cliente.tipo);
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
    const resposta = await fetch(API_CLIENTES);
    if (!resposta.ok) throw new Error("Falha ao buscar clientes");

    const clientes = await resposta.json();
    clientesCache = Array.isArray(clientes) ? clientes : [];
    atualizarResumo(clientesCache);
    renderizarClientes(aplicarFiltroEOrdenacao(clientesCache));
  } catch (error) {
    console.error("Erro ao carregar clientes", error);
    listaClientes.innerHTML = '<div class="empty-state">Não foi possível carregar a lista de usuários.</div>';
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
  usuarioNome.textContent = cliente.nome || "Sem nome";
  usuarioEmail.textContent = cliente.email || "—";
  usuarioCpf.textContent = cliente.cpf || "—";
  usuarioEndereco.textContent = cliente.endereco || "—";
  usuarioTipo.textContent = cliente.tipo || "CLIENTE";
  const status = formatarStatus(cliente.status || cliente.tipo);
  usuarioStatus.textContent = status.label;
  usuarioStatus.className = status.className;
  usuarioUltimoLogin.textContent = formatarUltimoLogin(cliente.ultimoAcesso);
  modalUsuario?.classList.add("active");
  document.body.classList.add("modal-open");
}

async function removerCliente(cpf) {
  if (!cpf) return;
  const confirmar = confirm("Deseja remover este usuário?");
  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API_REMOVE}/${cpf}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error("Erro ao remover");
    await carregarClientes();
  } catch (error) {
    console.error(error);
    alert("Não foi possível remover o usuário.");
  }
}

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
searchInput?.addEventListener("input", () => {
  renderizarClientes(aplicarFiltroEOrdenacao(clientesCache));
});
sortAccessBtn?.addEventListener("click", () => {
  sortAscending = !sortAscending;
  if (sortDirectionLabel) sortDirectionLabel.textContent = sortAscending ? "↑" : "↓";
  renderizarClientes(aplicarFiltroEOrdenacao(clientesCache));
});

Array.from(document.querySelectorAll(".nav-link")).forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    closeSidebar();
  });
});

carregarClientes();