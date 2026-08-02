const API_BASE = "https://apiadministrativa.onrender.com";

function formatarData(data) {
    if (!data) return "—";
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("pt-BR");
}

function getAuthHeaders() {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
        return {
            ...(usuario?.token ? { Authorization: `Bearer ${usuario.token}` } : {})
        };
    } catch {
        return {};
    }
}

function getStatusMeta(status) {
    const normalized = String(status || "").toUpperCase();
    const map = {
        AGUARDANDO_DOCUMENTOS: { label: "Aguardando documentos", className: "warning", progress: 28 },
        EM_ANDAMENTO: { label: "Em andamento", className: "pending", progress: 58 },
        FINALIZADO: { label: "Finalizado", className: "success", progress: 100 },
        CONCLUIDO: { label: "Concluído", className: "success", progress: 100 },
        PENDENTE: { label: "Pendente", className: "warning", progress: 35 },
        DEFAULT: { label: "Em análise", className: "pending", progress: 45 }
    };

    return map[normalized] || map.DEFAULT;
}

function formatarValor(valor) {
    const number = Number(valor);
    if (Number.isNaN(number)) return "—";
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function preencherPopupDetalhes(processo) {
    const popup = document.getElementById('popupDetalhesProcesso');
    if (!popup) return;

    const meta = getStatusMeta(processo?.status);
    const detalheStatusBadge = document.getElementById('detalheStatusBadge');
    const detalheBarraProgresso = document.getElementById('detalheBarraProgresso');
    const detalheTipo = document.getElementById('detalheTipo');
    const detalheNumero = document.getElementById('detalheNumero');
    const detalheValor = document.getElementById('detalheValor');
    const detalheData = document.getElementById('detalheData');
    const detalheObservacao = document.getElementById('detalheObservacao');
    const detalhePendencias = document.getElementById('detalhePendencias');
    const detalheDocumentos = document.getElementById('detalheDocumentos');
    const detalhePagamento = document.getElementById('detalhePagamento');
    const detalheBiometria = document.getElementById('detalheBiometria');

    if (detalheStatusBadge) {
        detalheStatusBadge.className = `status-badge ${meta.className}`;
        detalheStatusBadge.textContent = meta.label;
    }

    if (detalheBarraProgresso) {
        detalheBarraProgresso.innerHTML = `
            <div class="processo-progress-track">
                <div class="processo-progress-fill" style="width:${meta.progress}%"></div>
            </div>
        `;
    }

    if (detalheTipo) detalheTipo.textContent = processo?.tipo || "Processo";
    if (detalheNumero) detalheNumero.textContent = processo?.numero || processo?.id || "—";
    if (detalheValor) detalheValor.textContent = formatarValor(processo?.valor || processo?.valorProcesso);
    if (detalheData) detalheData.textContent = formatarData(processo?.data || processo?.criadoEm || processo?.createdAt || processo?.dataCriacao);
    if (detalheObservacao) detalheObservacao.textContent = processo?.observacao || processo?.ultimaMovimentacao || "Sem observações registradas.";
    if (detalhePendencias) detalhePendencias.textContent = processo?.pendencias || "Nenhuma pendência registrada no momento.";
    if (detalheDocumentos) detalheDocumentos.textContent = processo?.documentosPendentes || processo?.documentos || "Nenhum documento pendente.";
    if (detalhePagamento) detalhePagamento.textContent = processo?.pagamentoRealizado ? "Sim" : "Pendente";
    if (detalheBiometria) detalheBiometria.textContent = processo?.biometriaRealizada ? "Sim" : "Não";

    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharPopupDetalhes() {
    const popup = document.getElementById('popupDetalhesProcesso');
    if (!popup) return;
    popup.classList.remove('active');
    document.body.style.overflow = '';
}

function renderProcessos(processos, container) {
    if (!container) return;

    if (!Array.isArray(processos) || processos.length === 0) {
        container.innerHTML = `
            <div class="processo-card empty-state-card">
                <div class="processo-header">
                    <strong>Nenhum processo encontrado</strong>
                </div>
                <div class="processo-meta">
                    <span>Não há processos cadastrados para esta conta no momento.</span>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = processos.map((processo) => {
        const meta = getStatusMeta(processo.status);
        const valor = formatarValor(processo.valor || processo.valorProcesso || 0);
        const numero = processo.numero || processo.id || "—";
        const tipo = processo.tipo || "Processo";
        const data = formatarData(processo.data || processo.criadoEm || processo.createdAt || processo.dataCriacao);
        const ultimaMovimentacao = processo.ultimaMovimentacao || processo.ultimaAtualizacao || "Sem movimentação registrada";

        const dadosProcesso = JSON.stringify(processo);

        return `
            <article class="processo-card">
                <div class="processo-header">
                    <strong>${tipo}</strong>
                    <span class="status-badge ${meta.className}">${meta.label}</span>
                </div>
                <div class="processo-meta">
                    <p><strong>Número:</strong> ${numero}</p>
                    <p><strong>Valor:</strong> ${valor}</p>
                    <p><strong>Data:</strong> ${data}</p>
                    <p><strong>Última movimentação:</strong> ${ultimaMovimentacao}</p>
                </div>
                <div class="processo-meta" style="margin-top: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span>Progresso</span>
                        <strong>${meta.progress}%</strong>
                    </div>
                    <div style="height:8px; background:rgba(15,23,42,0.08); border-radius:999px; overflow:hidden;">
                        <div style="width:${meta.progress}%; height:100%; background:linear-gradient(90deg, var(--azul-corporativo), var(--azul-marinho)); border-radius:inherit;"></div>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="secondary-btn" type="button" data-processo-id="${processo.id || ""}" data-processo-data='${dadosProcesso}'>
                        <i class="fa-solid fa-eye"></i>
                        Ver detalhes
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function bindDetailsButtons(container) {
    if (!container) return;

    container.querySelectorAll('[data-processo-id]').forEach((button) => {
        button.addEventListener('click', () => {
            const processoId = button.getAttribute('data-processo-id');
            const processoRaw = button.getAttribute('data-processo-data');
            let processo = null;

            try {
                processo = processoRaw ? JSON.parse(processoRaw) : null;
            } catch (error) {
                console.warn('Não foi possível ler os dados do processo:', error);
            }

            if (processo && String(processo.id || processo.numero || "") === String(processoId)) {
                preencherPopupDetalhes(processo);
            }
        });
    });
}

function bindPopupClose() {
    const btnFechar = document.getElementById('fecharDetalhesProcesso');
    if (btnFechar) {
        btnFechar.addEventListener('click', fecharPopupDetalhes);
    }
}

async function initProcessos(userId) {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const user = userId || usuario?.id;

    const processos_total_show = document.getElementById("processos_total_show");
    const processos_andamento_show = document.getElementById("processos_andamento_show");
    const processos_finalizados_show = document.getElementById("processos_finalizados_show");
    const processos_aguardando_docs_show = document.getElementById("processos_aguardando_docs_show");
    const listaProcessos = document.getElementById("listaProcessos");

    if (!user) {
        console.log("Usuário não encontrado no localStorage");
        return;
    }

    bindPopupClose();

    if (listaProcessos) {
        listaProcessos.innerHTML = '<div class="processo-card empty-state-card"><div class="processo-header"><strong>Carregando processos...</strong></div></div>';
    }

    try {
        const resposta = await fetch(`${API_BASE}/api/cliente/processos/${user}`, {
            headers: {
                Accept: "application/json",
                ...getAuthHeaders()
            }
        });
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }
        const processos = await resposta.json();
        const list = Array.isArray(processos) ? processos : [];
        const qtdProcessos = list.length;
        const emAndamento = list.filter((processo) => ["EM_ANDAMENTO", "PENDENTE"].includes(String(processo.status || "").toUpperCase())).length;
        const finalizados = list.filter((processo) => ["FINALIZADO", "CONCLUIDO"].includes(String(processo.status || "").toUpperCase())).length;
        const aguardandoDocs = list.filter((processo) => String(processo.status || "").toUpperCase() === "AGUARDANDO_DOCUMENTOS").length;

        if (processos_total_show) processos_total_show.innerHTML = qtdProcessos;
        if (processos_andamento_show) processos_andamento_show.innerHTML = emAndamento;
        if (processos_finalizados_show) processos_finalizados_show.innerHTML = finalizados;
        if (processos_aguardando_docs_show) processos_aguardando_docs_show.innerHTML = aguardandoDocs;

        renderProcessos(list, listaProcessos);
        bindDetailsButtons(listaProcessos);
    } catch (erro) {
        console.error("Erro ao buscar processos:", erro);
        if (listaProcessos) {
            listaProcessos.innerHTML = '<div class="processo-card empty-state-card"><div class="processo-header"><strong>Não foi possível carregar os processos.</strong></div><div class="processo-meta"><span>Tente novamente em instantes.</span></div></div>';
        }
        window.SapiToast?.error("Não foi possível carregar os processos no momento.");
    }
}

export { initProcessos };