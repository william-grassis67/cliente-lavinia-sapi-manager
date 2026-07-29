const API_BASE_URL = "https://apiadministrativa.onrender.com";

const TOTAL_ETAPAS = 4;

// Configuração visual de cada status: rótulo, cor, etapa na barra de
// progresso e ícone. As cores seguem a paleta já usada no restante do
// sistema (amarelo reaproveita o tom do badge "Admin", verde reaproveita
// o tom de sucesso usado nas guias pagas).
const STATUS_CONFIG = {
    AGUARDANDO_DOCUMENTOS: {
        label: "Aguardando Documentos",
        icone: "fa-file-circle-exclamation",
        etapa: 1,
        corTexto: "#92400e",
        corFundo: "#fef3c7"
    },
    EM_ANALISE: {
        label: "Em Análise",
        icone: "fa-magnifying-glass",
        etapa: 2,
        corTexto: "#1d4ed8",
        corFundo: "#e7edff"
    },
    AGUARDANDO_PAGAMENTO: {
        label: "Aguardando Pagamento",
        icone: "fa-credit-card",
        etapa: 3,
        corTexto: "#c2410c",
        corFundo: "#ffe8d9"
    },
    FINALIZADO: {
        label: "Finalizado",
        icone: "fa-circle-check",
        etapa: 4,
        corTexto: "#0b8d49",
        corFundo: "#e8fff2"
    }
};

const STATUS_DESCONHECIDO = {
    label: "Status não informado",
    icone: "fa-circle-question",
    etapa: 0,
    corTexto: "#5b6472",
    corFundo: "#eef1f6"
};

let processosCache = [];
let usuarioIdAtual = null;
let listenersRegistrados = false;

function getStatusConfig(status) {
    return STATUS_CONFIG[status] || STATUS_DESCONHECIDO;
}

function getToken() {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        return usuario?.token || "";
    } catch {
        return "";
    }
}

function formatarMoeda(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero)
        ? numero.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
        : "0,00";
}

function formatarDataHora(dataString) {
    if (!dataString) return "Não informado";
    const data = new Date(dataString);
    return isNaN(data.getTime())
        ? "Não informado"
        : data.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
}

function textoOuPadrao(valor, padrao) {
    if (valor === null || valor === undefined) return padrao;
    const texto = String(valor).trim();
    return texto.length ? texto : padrao;
}

/**
 * Monta o HTML da barra de progresso (4 segmentos, preenchidos até a etapa atual).
 * @param {number} etapaAtual
 * @param {string} cor
 */
function renderBarraProgresso(etapaAtual, cor) {
    let html = '<div class="progresso-barra">';

    for (let i = 1; i <= TOTAL_ETAPAS; i++) {
        const estilo = i <= etapaAtual ? ` style="background:${cor}"` : "";
        html += `<span class="progresso-segmento"${estilo}></span>`;
    }

    html += "</div>";
    return html;
}

/**
 * Busca os processos do cliente na API e atualiza a listagem e o dashboard.
 * @param {number|string} usuarioId
 * @returns {Promise<Array>}
 */
async function carregarProcessos(usuarioId) {
    if (!usuarioId) {
        console.error("[processos] ID do usuário não informado");
        return [];
    }

    usuarioIdAtual = usuarioId;

    try {
        const token = getToken();
        const headers = {
            "Content-Type": "application/json"
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/me/processos/${usuarioId}`, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const processos = await response.json();
        processosCache = Array.isArray(processos) ? processos : [];

        renderizarProcessos(processosCache);
        atualizarDashboardProcessos(processosCache);

        return processosCache;
    } catch (error) {
        console.error("[processos] Erro ao carregar processos:", error);

        processosCache = [];
        renderizarProcessos([], error);
        atualizarDashboardProcessos([]);
        window.SapiToast?.error("Não foi possível carregar seus processos.");

        return [];
    }
}

/**
 * Renderiza os cards de processos na nova seção "Meus Processos".
 * @param {Array} processos
 * @param {Error|null} erro
 */
function renderizarProcessos(processos, erro = null) {
    const container = document.getElementById("listaProcessos");
    if (!container) return;

    container.innerHTML = "";

    if (erro) {
        container.innerHTML = `
            <section class="empty-guias">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h2>Erro ao carregar processos</h2>
                <p>Não foi possível conectar ao servidor.</p>
            </section>
        `;
        return;
    }

    if (!processos.length) {
        container.innerHTML = `
            <section class="empty-guias">
                <i class="fa-solid fa-folder-open"></i>
                <h2>Nenhum processo encontrado</h2>
                <p>Você ainda não possui processos cadastrados.</p>
            </section>
        `;
        return;
    }

    processos.forEach(processo => {
        const status = getStatusConfig(processo.status);

        const card = document.createElement("article");
        card.className = "processo-card";
        card.style.borderTopColor = status.corTexto;
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute(
            "aria-label",
            `Ver detalhes do processo ${textoOuPadrao(processo.numeroProcesso, processo.id ?? "")}`
        );

        card.innerHTML = `
            <div class="processo-header">
                <div class="titulo-guia">
                    <i class="fa-solid ${status.icone}" style="color:${status.corTexto}"></i>
                    <h3>${textoOuPadrao(processo.tipo, "Processo")}</h3>
                </div>

                <span class="status-badge" style="color:${status.corTexto}; background:${status.corFundo}">
                    <i class="fa-solid fa-circle"></i>
                    ${status.label}
                </span>
            </div>

            <p class="processo-numero">Nº ${textoOuPadrao(processo.numeroProcesso, "—")}</p>

            ${renderBarraProgresso(status.etapa, status.corTexto)}

            <div class="guia-info">
                <div>
                    <i class="fa-solid fa-money-bill-wave"></i>
                    <strong>Valor</strong>
                    <p>R$ ${formatarMoeda(processo.valorProcesso)}</p>
                </div>

                <div>
                    <i class="fa-solid fa-calendar-days"></i>
                    <strong>Criado em</strong>
                    <p>${formatarDataHora(processo.dataCriacao)}</p>
                </div>
            </div>
        `;

        const abrir = () => abrirDetalhesProcesso(processo);
        card.addEventListener("click", abrir);
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                abrir();
            }
        });

        container.appendChild(card);
    });
}

/**
 * Preenche e abre o modal com todas as informações do processo selecionado.
 * @param {Object} processo
 */
function abrirDetalhesProcesso(processo) {
    const modal = document.getElementById("popupDetalhesProcesso");
    if (!modal || !processo) return;

    const status = getStatusConfig(processo.status);

    const campos = {
        detalheTipo: textoOuPadrao(processo.tipo, "Não informado"),
        detalheNumero: textoOuPadrao(processo.numeroProcesso, "Não informado"),
        detalheValor: `R$ ${formatarMoeda(processo.valorProcesso)}`,
        detalheObservacao: textoOuPadrao(processo.observacao, "Nenhuma observação"),
        detalhePendencias: textoOuPadrao(processo.pendencias, "Nenhuma pendência"),
        detalheDocumentos: textoOuPadrao(processo.documentosPendentes, "Nenhum documento pendente"),
        detalhePagamento: processo.pagamentoRealizado ? "Realizado" : "Pendente",
        detalheBiometria: processo.biometriaRealizada ? "Realizada" : "Pendente",
        detalheData: formatarDataHora(processo.dataCriacao)
    };

    Object.entries(campos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    });

    const statusBadge = document.getElementById("detalheStatusBadge");
    if (statusBadge) {
        statusBadge.textContent = status.label;
        statusBadge.style.color = status.corTexto;
        statusBadge.style.background = status.corFundo;
    }

    const barraContainer = document.getElementById("detalheBarraProgresso");
    if (barraContainer) {
        barraContainer.innerHTML = renderBarraProgresso(status.etapa, status.corTexto);
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function fecharDetalhesProcesso() {
    const modal = document.getElementById("popupDetalhesProcesso");
    if (!modal) return;

    modal.classList.remove("active");
    document.body.style.overflow = "auto";
}

/**
 * Atualiza os indicadores rápidos do dashboard de processos.
 * @param {Array} processos
 */
function atualizarDashboardProcessos(processos) {
    const total = processos.length;
    const finalizados = processos.filter(p => p.status === "FINALIZADO").length;
    const aguardandoDocumentos = processos.filter(p => p.status === "AGUARDANDO_DOCUMENTOS").length;
    const emAndamento = total - finalizados;

    const setText = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    };

    setText("processos_total_show", total);
    setText("processos_andamento_show", emAndamento);
    setText("processos_finalizados_show", finalizados);
    setText("processos_aguardando_docs_show", aguardandoDocumentos);
}

/**
 * Registra os listeners do modal de detalhes apenas uma vez.
 */
function setupProcessosEventListeners() {
    if (listenersRegistrados) return;

    const fecharBtn = document.getElementById("fecharDetalhesProcesso");
    if (fecharBtn) {
        fecharBtn.addEventListener("click", fecharDetalhesProcesso);
    }

    const modal = document.getElementById("popupDetalhesProcesso");
    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) fecharDetalhesProcesso();
        });
    }

    listenersRegistrados = true;
}

/**
 * Recarrega os processos do usuário atual (útil após alguma ação que possa
 * mudar o status de um processo, ex.: pagamento de uma guia vinculada).
 */
function recarregarProcessos() {
    if (!usuarioIdAtual) return Promise.resolve([]);
    return carregarProcessos(usuarioIdAtual);
}

window.SapiProcessos = { reload: recarregarProcessos };

/**
 * Ponto de entrada do módulo, seguindo o mesmo padrão de inicialização dos
 * demais módulos da página (ex.: ShowGuias).
 * @param {number|string} usuarioId
 */
async function initProcessos(usuarioId) {
    setupProcessosEventListeners();
    return carregarProcessos(usuarioId);
}

export {
    initProcessos,
    carregarProcessos,
    renderizarProcessos,
    abrirDetalhesProcesso,
    atualizarDashboardProcessos
};