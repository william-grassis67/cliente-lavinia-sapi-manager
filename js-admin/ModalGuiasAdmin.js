/**
 * Módulo Autônomo do Modal de Guias (Histórico Financeiro)
 * Arquivo: ModalGuiasAdmin.js
 *
 * OBS: Este módulo não depende de "clientesService.js" nem de "toast.js".
 * As chamadas de API e notificações visuais são resolvidas internamente.
 *
 * ATENÇÃO: existia uma segunda versão deste mesmo arquivo circulando no
 * projeto, com um endpoint de guias totalmente diferente
 * ("/api/payments/guias/{id}") e ignorando o cache de guias já buscado
 * pelo admin.js. Esta é a versão a ser mantida — ela reaproveita o array
 * `guias` que o admin.js já buscou em ENDPOINTS.GUIAS_CLIENTE
 * ("/api/admin/clientes/{id}/guias") e só refaz a requisição quando
 * necessário, usando a MESMA rota.
 */

const API_BASE = "https://apiadministrativa.onrender.com";

/**
 * Escapa strings contra XSS antes da inserção no HTML.
 */
function escapeHtml(val) {
  if (val === null || val === undefined || val === "") return "—";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Formata datas com segurança para evitar deslocamento por fuso horário local.
 */
function formatarData(dataRaw) {
  if (!dataRaw) return "—";
  const dataString = String(dataRaw).split("T")[0];
  const partes = dataString.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  const dateObj = new Date(dataRaw);
  return isNaN(dateObj.getTime()) ? "—" : dateObj.toLocaleDateString("pt-BR");
}

/**
 * Retorna a classe badge apropriada conforme a situação/status da guia (suporta Booleano e String).
 */
function obterClasseBadge(statusOuPago) {
  if (typeof statusOuPago === "boolean") {
    return statusOuPago
      ? "guia-badge guia-badge-paga"
      : "guia-badge guia-badge-pendente";
  }

  if (!statusOuPago) return "guia-badge";
  const st = String(statusOuPago).toLowerCase();
  if (st.includes("pago") || st.includes("paga") || st === "true") {
    return "guia-badge guia-badge-paga";
  }
  if (st.includes("vencid")) return "guia-badge guia-badge-vencida";
  if (st.includes("pendent") || st === "false") {
    return "guia-badge guia-badge-pendente";
  }
  return "guia-badge";
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

  let carregandoGuias = false;
  let abortController = null;

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
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    carregandoGuias = false;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "auto";
  }

  function renderizarLoading() {
    if (tabelaGuias) {
      tabelaGuias.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px;">
            <i class="fa-solid fa-spinner fa-spin"></i> Carregando guias...
          </td>
        </tr>`;
    }
  }

  function renderizarErroComRetry(mensagem, clienteOuId) {
    if (!tabelaGuias) return;

    tabelaGuias.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: var(--danger-color, #dc2626);">
          <p style="margin-bottom: 10px;">${escapeHtml(mensagem)}</p>
          <button id="btnRetryGuias" type="button" style="padding: 6px 16px; cursor: pointer; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 600;">
            <i class="fa-solid fa-rotate-right"></i> Tentar novamente
          </button>
        </td>
      </tr>`;

    const btnRetry = document.getElementById("btnRetryGuias");
    if (btnRetry) {
      btnRetry.onclick = () => carregarGuias(clienteOuId, true);
    }
  }

  function renderizarGuias(guias) {
    if (!tabelaGuias) return;

    if (!Array.isArray(guias) || guias.length === 0) {
      tabelaGuias.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 15px;">
            Nenhuma guia encontrada para este cliente.
          </td>
        </tr>`;
      return;
    }

    tabelaGuias.innerHTML = guias
      .map((guia) => {
        const idGuia = escapeHtml(guia.id ?? "—");
        const valor = guia.valor !== undefined && guia.valor !== null
          ? Number(guia.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : "—";
        const vencimento = formatarData(guia.vencimento);
        const dataPagamento = formatarData(guia.dataPagamento || guia.pagamento);

        // Trata o campo booleano 'pago' retornado pela API
        const pago = Boolean(guia.pago);
        const statusTexto = pago ? "Paga" : "Pendente";
        const statusClasse = obterClasseBadge(pago);

        return `
          <tr>
            <td>${idGuia}</td>
            <td>${valor}</td>
            <td>${vencimento}</td>
            <td>${dataPagamento}</td>
            <td><span class="${statusClasse}">${statusTexto}</span></td>
          </tr>`;
      })
      .join("");
  }

  /**
   * Busca e carrega as guias do cliente fornecido.
   * @param {Object|string|number} clienteOuId
   * @param {boolean} forcarAtualizacao Se verdadeiro, ignora o cache local cliente.guias
   */
  async function carregarGuias(clienteOuId, forcarAtualizacao = false) {
    let usuarioId = null;
    let nomeCliente = "";
    let guiasExistentes = null;

    if (typeof clienteOuId === "object" && clienteOuId !== null) {
      usuarioId = clienteOuId.usuarioId || clienteOuId.id || clienteOuId._id;
      nomeCliente = clienteOuId.nome || clienteOuId.nomeUsuario || "";
      if (Array.isArray(clienteOuId.guias)) {
        guiasExistentes = clienteOuId.guias;
      }
    } else {
      usuarioId = clienteOuId;
    }

    if (tituloGuias) {
      tituloGuias.textContent = nomeCliente
        ? `Guias de ${escapeHtml(nomeCliente)}`
        : "Guias do Cliente";
    }

    abrir();

    // 1. Aproveitar dados em memória se disponíveis e não forçada a atualização
    if (!forcarAtualizacao && guiasExistentes && guiasExistentes.length > 0) {
      console.log("Usando guias já existentes no objeto do cliente:", usuarioId);
      renderizarGuias(guiasExistentes);
      return;
    }

    // 2. Prevenção de requisições sobrepostas / paralelas
    if (carregandoGuias) {
      if (abortController) {
        abortController.abort();
      }
    }

    if (!usuarioId) {
      mostrarNotificacao("Cliente inválido: não foi possível identificar o ID.", "erro");
      renderizarErroComRetry("Não foi possível identificar o cliente selecionado.", clienteOuId);
      return;
    }

    carregandoGuias = true;
    abortController = new AbortController();
    renderizarLoading();

    // CORREÇÃO: a rota antiga era "/api/cliente/guias/{id}" (singular, sem
    // "/admin"), que não existe no backend administrativo e retornava 404.
    // A rota correta é a mesma que admin.js usa em ENDPOINTS.GUIAS_CLIENTE.
    const url = `${API_BASE}/api/admin/clientes/${encodeURIComponent(usuarioId)}/guias`;

    try {
      const response = await fetch(url, { signal: abortController.signal });

      if (!response.ok) {
        const erroTexto = await response.text();

        // Log completo em caso de falha da API
        console.group("Erro API Guias");
        console.log("Status:", response.status);
        console.log("URL:", url);
        console.log("Cliente:", clienteOuId);
        console.log("Resposta da API:", erroTexto);
        console.groupEnd();

        throw new Error(`Erro HTTP ${response.status}`);
      }

      const respostaJson = await response.json();

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

      // Atualiza o título do modal com nomeUsuario retornado se não estivesse definido antes
      if (!nomeCliente && guiasExtraidas.length > 0 && guiasExtraidas[0].nomeUsuario) {
        nomeCliente = guiasExtraidas[0].nomeUsuario;
        if (tituloGuias) {
          tituloGuias.textContent = `Guias de ${escapeHtml(nomeCliente)}`;
        }
      }

      // Atualiza o objeto do cliente localmente se for um objeto
      if (typeof clienteOuId === "object" && clienteOuId !== null) {
        clienteOuId.guias = guiasExtraidas;
      }

      renderizarGuias(guiasExtraidas);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Requisição anterior de guias abortada.");
        return;
      }

      console.error("Erro ao processar guias do cliente:", error);
      mostrarNotificacao("Não foi possível carregar as guias.", "erro");
      renderizarErroComRetry("Erro ao buscar guias no servidor.", clienteOuId);
    } finally {
      carregandoGuias = false;
    }
  }

  // Configuração segura de listeners sem vazamento de memória
  if (!modal.dataset.guiasListenersAttached) {
    btnFechar.addEventListener("click", fechar);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        fechar();
      }
    });
    modal.dataset.guiasListenersAttached = "true";
  }

  return {
    abrir,
    fechar,
    carregarGuias
  };
}