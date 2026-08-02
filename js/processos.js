function formatarData(data) {
    if (!data) return "—";
    const partes = data.split("T")[0].split("-");
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
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

function renderProcessos(processos, container) {
    if (!container) return;

    if (!Array.isArray(processos) || processos.length === 0) {
        container.innerHTML = `
            <div class="processo-card">
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
        const valor = Number(processo.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const numero = processo.numero || processo.id || "—";
        const tipo = processo.tipo || "Processo";
        const data = formatarData(processo.data || processo.criadoEm || processo.createdAt);

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
                    <button class="secondary-btn" type="button" data-processo-id="${processo.id || ""}">
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
            const popup = document.getElementById('popupDetalhesProcesso');
            if (!popup) return;

            popup.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
}

function initProcessos(userId) {
    const URL_PRINCIPAL = "https://apiadministrativa.onrender.com";
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

    fetch(`${URL_PRINCIPAL}/api/cliente/processos/${user}`)
        .then((resposta) => resposta.json())
        .then((processos) => {
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
        })
        .catch((erro) => {
            console.error("Erro ao buscar processos:", erro);
        });
}

export { initProcessos };