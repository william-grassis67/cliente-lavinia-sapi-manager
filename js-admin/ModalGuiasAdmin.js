/**
 * Módulo Autônomo do Modal de Guias (Histórico Financeiro)
 * Arquivo: ModalGuiasAdmin.js
 *
 * OBS: Este módulo não depende de "clientesService.js" nem de "toast.js"
 * (ambos removidos por não existirem no projeto). As chamadas de API e
 * as notificações visuais são resolvidas internamente, neste arquivo.
 */

const API_GUIAS_BASE = "https://apiadministrativa.onrender.com/api/payments/guias";

/**
 * Escapa strings contra XSS antes da inserção no HTML.
 */
function escapeHtml(val) {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Notificação visual interna (substitui o antigo showToast de "./toast.js").
 * Mesmo padrão visual usado em enviarMensagemCliente.js, para manter
 * consistência sem precisar de um arquivo compartilhado.
 */
function mostrarNotificacao(mensagem, tipo = "sucesso") {
  const notificacaoExistente = document.getElementById("notificacao-custom-guias");
  if (notificacaoExistente) {
    notificacaoExistente.remove();
  }

  const div = document.createElement("div");
  div.id = "notificacao-custom-guias";
  div.innerText = mensagem;

  Object.assign(div.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "bold",
    zIndex: "99999",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    backgroundColor: tipo === "sucesso" ? "#28a745" : "#dc3545",
    transition: "opacity 0.3s ease"
  });

  document.body.appendChild(div);

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 300);
  }, 3500);
}

/**
 * Controla a inicialização, busca de dados e renderização do modal de guias.
 */
export function ModalGuiasAdmin() {
  const modal = document.getElementById("modalGuiasAdmin");
  const btnFechar = document.getElementById("fecharGuiasAdmin");
  const tabelaGuias = document.getElementById("tabelaGuiasAdmin");
  const tituloGuias = document.getElementById("tituloGuiasUsuario");

  if (!modal || !btnFechar) {
    console.error("Elementos do modal de guias não foram encontrados no DOM.");
    return {
      abrir: () => {},
      fechar: () => {},
      carregarGuias: () => {}
    };
  }

  function abrir() {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
  }

  function fechar() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "auto";
  }

  function renderizarLoading() {
    if (tabelaGuias) {
      tabelaGuias.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px;">
            <i class="fa-solid fa-spinner fa-spin"></i> Carregando guias...
          </td>
        </tr>`;
    }
  }

  function renderizarGuias(guias) {
    if (!tabelaGuias) return;

    if (!Array.isArray(guias) || guias.length === 0) {
      tabelaGuias.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 15px;">
            Nenhuma guia encontrada para este cliente.
          </td>
        </tr>`;
      return;
    }

    tabelaGuias.innerHTML = guias
      .map((guia) => {
        const competencia = escapeHtml(guia.competencia ?? "-");
        const valor = Number(guia.valor || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        });
        const vencimento = guia.vencimento
          ? new Date(guia.vencimento).toLocaleDateString("pt-BR")
          : "-";
        const status = escapeHtml(guia.status || "Pago");

        return `
          <tr>
            <td>${competencia}</td>
            <td>${valor}</td>
            <td>${vencimento}</td>
            <td><span class="status-pill">${status}</span></td>
          </tr>`;
      })
      .join("");
  }

  /**
   * Busca e carrega as guias do cliente fornecido, direto da API.
   * @param {Object|string|number} clienteOuId
   */
  async function carregarGuias(clienteOuId) {
    const clienteId = typeof clienteOuId === "object" ? clienteOuId?.id : clienteOuId;
    const nomeCliente = typeof clienteOuId === "object" ? clienteOuId?.nome : "";

    if (tituloGuias) {
      tituloGuias.textContent = nomeCliente
        ? `Guias de ${nomeCliente}`
        : "Guias do Cliente";
    }

    abrir();
    renderizarLoading();

    if (!clienteId) {
      mostrarNotificacao("Cliente inválido: não foi possível identificar o ID.", "erro");
      if (tabelaGuias) {
        tabelaGuias.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--danger-color, #dc2626); padding: 15px;">
              Não foi possível identificar o cliente selecionado.
            </td>
          </tr>`;
      }
      return;
    }

    try {
      const response = await fetch(`${API_GUIAS_BASE}/${encodeURIComponent(clienteId)}`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao carregar guias`);
      }

      const guias = await response.json();
      renderizarGuias(guias);
    } catch (error) {
      console.error("Erro ao carregar guias:", error);
      if (tabelaGuias) {
        tabelaGuias.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--danger-color, #dc2626); padding: 15px;">
              Erro ao carregar as guias do cliente.
            </td>
          </tr>`;
      }
      mostrarNotificacao("Não foi possível carregar as guias.", "erro");
    }
  }

  // Listeners para fechamento
  btnFechar.addEventListener("click", fechar);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      fechar();
    }
  });

  return {
    abrir,
    fechar,
    carregarGuias
  };
}