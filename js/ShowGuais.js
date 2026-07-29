const API_BASE_URL = "https://apiadministrativa.onrender.com";

let guiasCache = [];
let usuarioIdAtual = null;
let listenersRegistrados = false;

/**
 * Recupera o token de autenticação salvo na sessão do usuário.
 * @returns {string}
 */
function getToken() {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        return usuario?.token || "";
    } catch {
        return "";
    }
}

/**
 * Determina se uma guia está paga, com compatibilidade para respostas
 * antigas da API que só retornavam guias já pagas (sem um campo de status).
 * @param {Object} guia
 * @returns {boolean}
 */
function isGuiaPaga(guia) {
    if (typeof guia.pago === "boolean") return guia.pago;
    if (typeof guia.status === "string") return guia.status.toUpperCase() === "PAGO";
    return true;
}

function formatarMoeda(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero)
        ? numero.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
        : "0,00";
}

function formatarDataCurta(dataString) {
    if (!dataString) return "Não informado";
    const data = new Date(dataString);
    return isNaN(data.getTime()) ? "Não informado" : data.toLocaleDateString("pt-BR");
}

/**
 * Busca as guias do usuário na API e atualiza toda a interface relacionada
 * (resumo/contadores e histórico de pagamentos).
 * @param {number|string} usuarioId
 * @returns {Promise<Array>}
 */
async function carregarGuias(usuarioId) {
    if (!usuarioId) {
        console.error("[guias] ID do usuário não informado");
        return [];
    }

    usuarioIdAtual = usuarioId;

    try {
        const response = await fetch(`${API_BASE_URL}/api/payments/guias/${usuarioId}`, {
            method: "GET",
            headers: {
                "Authorization": getToken() ? `Bearer ${getToken()}` : ""
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const guias = await response.json();
        guiasCache = Array.isArray(guias) ? guias : [];

        atualizarResumoGuias(guiasCache);
        atualizarHistoricoGuias(guiasCache);

        return guiasCache;
    } catch (error) {
        console.error("[guias] Erro ao carregar guias:", error);

        guiasCache = [];
        atualizarResumoGuias([]);
        atualizarHistoricoGuias([], error);
        window.SapiToast?.error("Não foi possível carregar suas guias.");

        return [];
    }
}

/**
 * Atualiza os três contadores do card de resumo: total emitidas, pagas e
 * pendentes. No código anterior apenas "pagas" era preenchido.
 * @param {Array} guias
 */
function atualizarResumoGuias(guias) {
    const total = guias.length;
    const pagas = guias.filter(isGuiaPaga).length;
    const pendentes = total - pagas;

    const setText = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    };

    setText("guias_emitidas_show", total);
    setText("guias_pagas_show", pagas);
    setText("guias_pendentes_show", pendentes);
}

/**
 * Renderiza a lista do histórico de pagamentos (modal "Ver histórico").
 * @param {Array} guias
 * @param {Error|null} erro
 */
function atualizarHistoricoGuias(guias, erro = null) {
    const listaGuiasPagas = document.getElementById("listaGuiasPagas");
    if (!listaGuiasPagas) return;

    listaGuiasPagas.innerHTML = "";

    if (erro) {
        listaGuiasPagas.innerHTML = `
            <section class="empty-guias">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h2>Erro ao carregar guias</h2>
                <p>Não foi possível conectar ao servidor.</p>
            </section>
        `;
        return;
    }

    const pagas = guias.filter(isGuiaPaga);

    if (pagas.length === 0) {
        listaGuiasPagas.innerHTML = `
            <section class="empty-guias">
                <i class="fa-solid fa-file-circle-xmark"></i>
                <h2>Nenhuma guia encontrada</h2>
                <p>Você ainda não possui pagamentos.</p>
            </section>
        `;
        return;
    }

    pagas.forEach(guia => {
        const card = document.createElement("article");
        card.className = "guia-item";
        card.innerHTML = `
            <div class="guia-header">
                <div class="titulo-guia">
                    <i class="fa-solid fa-file-invoice-dollar"></i>
                    <h3>${guia.competencia ?? "Sem competência"}</h3>
                </div>
                <span class="status-pago">
                    <i class="fa-solid fa-circle-check"></i>
                    Pago
                </span>
            </div>

            <div class="guia-info">
                <div>
                    <i class="fa-solid fa-money-bill-wave"></i>
                    <strong>Valor</strong>
                    <p>R$ ${formatarMoeda(guia.valor)}</p>
                </div>

                <div>
                    <i class="fa-solid fa-calendar-days"></i>
                    <strong>Vencimento</strong>
                    <p>${formatarDataCurta(guia.vencimento)}</p>
                </div>

                <div>
                    <i class="fa-solid fa-circle-check"></i>
                    <strong>Status</strong>
                    <p>Pagamento confirmado</p>
                </div>
            </div>
        `;
        listaGuiasPagas.appendChild(card);
    });
}

/**
 * Registra os listeners de abrir/fechar o modal de histórico apenas uma vez,
 * mesmo que ShowGuias seja chamada novamente (evita listeners duplicados).
 */
function setupGuiasEventListeners() {
    if (listenersRegistrados) return;

    const btnVerGuias = document.getElementById("verGuiasPagas");
    const popupGuias = document.getElementById("popupGuiasPagas");
    const fecharGuias = document.getElementById("fecharGuiasPagas");

    if (btnVerGuias && popupGuias) {
        btnVerGuias.addEventListener("click", () => {
            popupGuias.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    }

    if (fecharGuias && popupGuias) {
        fecharGuias.addEventListener("click", () => {
            popupGuias.classList.remove("active");
            document.body.style.overflow = "auto";
        });
    }

    listenersRegistrados = true;
}

/**
 * Recarrega as guias do usuário atual. Usado por outros módulos (ex.: após
 * confirmar um pagamento) para atualizar contadores e histórico sem precisar
 * recarregar a página inteira.
 */
function recarregarGuias() {
    if (!usuarioIdAtual) return Promise.resolve([]);
    return carregarGuias(usuarioIdAtual);
}

// Ponte global para módulos que não importam este arquivo via ES modules
// (ex.: pagamento-guias.js) poderem disparar uma atualização.
window.SapiGuias = { reload: recarregarGuias };

/**
 * Ponto de entrada compatível com a assinatura original do módulo.
 * @param {number|string} usuarioId
 */
async function ShowGuias(usuarioId) {
    setupGuiasEventListeners();
    return carregarGuias(usuarioId);
}

export {
    ShowGuias,
    carregarGuias,
    atualizarResumoGuias,
    atualizarHistoricoGuias
};