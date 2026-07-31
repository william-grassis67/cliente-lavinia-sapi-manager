/**
 * Módulo Autônomo do Modal de Guias (Histórico Financeiro)
 * Arquivo: ModalGuiasAdmin.js
 *
 * OBS: Este módulo não depende de "clientesService.js" nem de "toast.js".
 * As chamadas de API e notificações visuais são resolvidas internamente.
 */

const API_BASE = "https://apiadministrativa.onrender.com";

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
 * Notificação visual interna.
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

        // Formatação de data segura para evitar deslocamentos por fuso horário
        let vencimento = "-";
        if (guia.vencimento) {
          const dataString = String(guia.vencimento).split("T")[0];
          const partes = dataString.split("-");
          if (partes.length === 3) {
            vencimento = `${partes[2]}/${partes[1]}/${partes[0]}`;
          } else {
            vencimento = new Date(guia.vencimento).toLocaleDateString("pt-BR");
          }
        }

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
    // 1. Identificação do ID do usuário e Nome do Cliente
    let usuarioId = null;
    let nomeCliente = "";

    if (typeof clienteOuId === "object" && clienteOuId !== null) {
      usuarioId = clienteOuId.usuarioId || clienteOuId.id || clienteOuId._id;
      nomeCliente = clienteOuId.nome || "";
    } else {
      usuarioId = clienteOuId;
    }

    // 2. Construção da URL
    const url = `${API_BASE}/api/cliente/guias/${usuarioId}`;

    // 3. Logs temporários de depuração
    console.log("Cliente recebido:", clienteOuId);
    console.log("ID enviado:", usuarioId);
    console.log("URL:", url);

    // 4. Atualização da Interface Visual
    if (tituloGuias) {
      tituloGuias.textContent = nomeCliente
        ? `Guias de ${escapeHtml(nomeCliente)}`
        : "Guias do Cliente";
    }

    abrir();
    renderizarLoading();

    // Validação da existência do ID
    if (!usuarioId) {
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

    // 5. Requisição HTTP e Tratamento da Resposta
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const erroTexto = await response.text();
        console.error("Erro na API de Guias:", response.status, erroTexto);
        throw new Error(`Erro ${response.status}`);
      }

      const respostaJson = await response.json();

      // Extração resiliente da lista de guias (Array ou Objeto)
      let guiasExtraidas = [];
      if (Array.isArray(respostaJson)) {
        guiasExtraidas = respostaJson;
      } else if (respostaJson && typeof respostaJson === "object") {
        guiasExtraidas =
          respostaJson.guias ||
          respostaJson.data ||
          respostaJson.content ||
          respostaJson.items ||
          [];
      }

      renderizarGuias(guiasExtraidas);
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

  // Remoção de listeners prévios para evitar acúmulo (vazamento de memória)
  const novoBtnFechar = btnFechar.cloneNode(true);
  btnFechar.parentNode.replaceChild(novoBtnFechar, btnFechar);
  novoBtnFechar.addEventListener("click", fechar);

  const novoModal = modal.cloneNode(false);
  while (modal.firstChild) {
    novoModal.appendChild(modal.firstChild);
  }
  modal.parentNode.replaceChild(novoModal, modal);

  novoModal.addEventListener("click", (event) => {
    if (event.target === novoModal) {
      fechar();
    }
  });

  return {
    abrir,
    fechar,
    carregarGuias
  };
}