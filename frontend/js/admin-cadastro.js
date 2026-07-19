const API_REGISTER = "https://apiadministrativa.onrender.com/api/register";
const API_CLIENTES = "https://apiadministrativa.onrender.com/api/clientes";

const form = document.getElementById("registerForm");
const cpfInput = document.getElementById("cpf");
const messageBox = document.getElementById("messageBox");
const clientesList = document.getElementById("clientesList");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileToggle = document.getElementById("mobileToggle");

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch (error) {
    return null;
  }
}

function redirectTo(page) {
  const currentPath = window.location.pathname;
  const basePath = currentPath.replace(/[^/]+$/, "");
  window.location.href = `${basePath}${page}`;
}

function enforceAccess() {
  const authUser = getAuthUser();
  if (!authUser || authUser.tipo !== "ADMIN") {
    redirectTo("paginainicial.html");
  }
}

function formatCpf(value) {
  const onlyNumbers = value.replace(/\D/g, "").slice(0, 11);
  if (onlyNumbers.length <= 3) return onlyNumbers;
  if (onlyNumbers.length <= 6) return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3)}`;
  if (onlyNumbers.length <= 9) return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3, 6)}.${onlyNumbers.slice(6)}`;
  return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3, 6)}.${onlyNumbers.slice(6, 9)}-${onlyNumbers.slice(9)}`;
}

function showMessage(text, type = "success") {
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

function clearForm() {
  form?.reset();
}

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

async function loadClients() {
  try {
    const response = await fetch(API_CLIENTES);
    if (!response.ok) throw new Error("Erro ao carregar clientes");
    const clientes = await response.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      clientesList.innerHTML = '<div class="empty-state">Nenhum cliente cadastrado ainda.</div>';
      return;
    }

    clientesList.innerHTML = clientes
      .map(
        (cliente) => `
          <div class="client-item">
            <div>
              <strong>${cliente.nome || "Sem nome"}</strong>
              <span>${cliente.email || "Sem email"}</span>
            </div>
            <div>
              <span>${cliente.cpf || "—"}</span>
            </div>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error(error);
    clientesList.innerHTML = '<div class="empty-state">Não foi possível carregar os clientes.</div>';
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    nome: document.getElementById("nome").value.trim(),
    email: document.getElementById("email").value.trim(),
    endereco: document.getElementById("endereco").value.trim(),
    cpf: document.getElementById("cpf").value.replace(/\D/g, ""),
    senha: document.getElementById("senha").value
  };

  if (!payload.nome || !payload.email || !payload.endereco || !payload.cpf || !payload.senha) {
    showMessage("Preencha todos os campos obrigatórios.", "error");
    return;
  }

  if (payload.cpf.length !== 11) {
    showMessage("Informe um CPF válido com 11 dígitos.", "error");
    return;
  }

  try {
    const response = await fetch(API_REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Falha ao cadastrar");

    showMessage("Cliente cadastrado com sucesso!", "success");
    clearForm();
    await loadClients();
  } catch (error) {
    console.error(error);
    showMessage("Não foi possível cadastrar o cliente.", "error");
  }
}

if (cpfInput) {
  cpfInput.addEventListener("input", (event) => {
    event.target.value = formatCpf(event.target.value);
  });
}

form?.addEventListener("submit", handleSubmit);
mobileToggle?.addEventListener("click", () => toggleSidebar());
sidebarOverlay?.addEventListener("click", closeSidebar);

enforceAccess();
loadClients();
