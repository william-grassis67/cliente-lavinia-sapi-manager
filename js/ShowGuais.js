const API_BASE = "https://apiadministrativa.onrender.com";

function formatarData(data) {
    if (!data) return "";
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("pt-BR");
}

function getStatusMeta(guia) {
    const pago = Boolean(guia?.pago || guia?.statusPago || guia?.status === "PAGO");
    if (pago) {
        return { label: "Pago", className: "status-badge success", icon: "fa-circle-check" };
    }

    const vencimento = guia?.vencimento || guia?.dataVencimento;
    const dataVenc = vencimento ? new Date(vencimento) : null;
    const vencido = dataVenc && dataVenc.getTime() < Date.now();

    if (vencido) {
        return { label: "Vencido", className: "status-badge warning", icon: "fa-triangle-exclamation" };
    }

    return { label: "Pendente", className: "status-badge pending", icon: "fa-clock" };
}

async function ShowGuias() {
    const guias_emitidas_show = document.getElementById("guias_emitidas_show");
    const guias_pagas_show = document.getElementById("guias_pagas_show");
    const guias_pendentes_show = document.getElementById("guias_pendentes_show");
    const listaGuiasPagas = document.getElementById("listaGuiasPagas");

    const usuarioRaw = localStorage.getItem("usuario");
    if (!usuarioRaw) {
        console.error("Usuário não encontrado no localStorage");
        return;
    }

    let usuario;
    try {
        usuario = JSON.parse(usuarioRaw);
    } catch (e) {
        console.error("Erro ao converter os dados do usuário do localStorage:", e);
        return;
    }

    if (!usuario || !usuario.id) {
        console.error("Dados de usuário inválidos ou ID não encontrado");
        return;
    }

    try {
        const resposta = await fetch(`${API_BASE}/api/cliente/guias/${usuario.id}`, {
            headers: {
                Accept: "application/json",
                ...(usuario.token ? { Authorization: `Bearer ${usuario.token}` } : {})
            }
        });

        if (!resposta.ok) {
            throw new Error(`Erro ao buscar guias: ${resposta.status}`);
        }

        const guias = await resposta.json();

        if (!Array.isArray(guias)) {
            console.error("Formato retornado pela API é inválido, esperava-se um array:", guias);
            return;
        }

        let totalGuias = guias.length;
        let totalPagas = 0;
        let totalPendentes = 0;

        if (listaGuiasPagas) {
            listaGuiasPagas.innerHTML = "";
        }

        guias.forEach((guia) => {
            const statusInfo = getStatusMeta(guia);
            if (guia.pago || guia.statusPago || String(guia.status || "").toUpperCase() === "PAGO") {
                totalPagas++;
            } else {
                totalPendentes++;
            }

            if (listaGuiasPagas) {
                const card = document.createElement("div");
                card.className = "guia-card";

                const valorFormatado = Number(guia.valor || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                });

                card.innerHTML = `
                    <div class="guia-header">
                        <strong>Guia #${guia.id || "—"}</strong>
                        <span class="${statusInfo.className}">${statusInfo.label}</span>
                    </div>
                    <div class="guia-body">
                        <p><strong>Cliente:</strong> ${guia.nomeUsuario || usuario.nome || "Não informado"}</p>
                        <p><strong>Competência:</strong> ${guia.competencia || "—"}</p>
                        <p><strong>Vencimento:</strong> ${formatarData(guia.vencimento || guia.dataVencimento)}</p>
                        <p><strong>Valor:</strong> ${valorFormatado}</p>
                    </div>
                `;

                listaGuiasPagas.appendChild(card);
            }
        });

        if (guias_emitidas_show) guias_emitidas_show.textContent = totalGuias;
        if (guias_pagas_show) guias_pagas_show.textContent = totalPagas;
        if (guias_pendentes_show) guias_pendentes_show.textContent = totalPendentes;
    } catch (error) {
        console.error("Erro ao carregar e renderizar as guias:", error);
        window.SapiToast?.error("Não foi possível carregar as guias no momento.");
    }
}

function buttonverGuiasPagas() {
    const verGuiasPagas = document.getElementById("verGuiasPagas");
    const mostrarGuias = document.getElementById("mostrar_guias_pagas");
    const tbody = document.getElementById("tbodyClientes");
    const fecharTabela = document.getElementById("fecharTabela");

    if (!verGuiasPagas || !mostrarGuias || !tbody || !fecharTabela) {
        return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const usuarioId = usuario?.id;

    const url = `${API_BASE}/api/cliente/guias/${usuarioId}`;

    const fechar = () => {
        mostrarGuias.classList.remove("active");
        mostrarGuias.style.display = "none";
        mostrarGuias.setAttribute("aria-hidden", "true");
    };

    const abrir = async () => {
        mostrarGuias.style.display = "flex";
        mostrarGuias.classList.add("active");
        mostrarGuias.setAttribute("aria-hidden", "false");

        try {
            const resposta = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    ...(usuario?.token ? { Authorization: `Bearer ${usuario.token}` } : {})
                }
            });
            if (!resposta.ok) throw new Error("Erro ao buscar guias.");

            const guias = await resposta.json();
            tbody.innerHTML = "";

            guias.forEach((guia) => {
                const statusInfo = getStatusMeta(guia);
                tbody.innerHTML += `
                    <tr>
                        <td data-label="Competência">${guia.competencia || "—"}</td>
                        <td data-label="Vencimento">${formatarData(guia.vencimento || guia.dataVencimento)}</td>
                        <td data-label="Valor">${Number(guia.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        <td data-label="Status"><span class="${statusInfo.className}">${statusInfo.label}</span></td>
                    </tr>
                `;
            });
        } catch (erro) {
            console.error(erro);
        }
    };

    verGuiasPagas.addEventListener("click", abrir);
    fecharTabela.addEventListener("click", fechar);
    mostrarGuias.addEventListener("click", (event) => {
        if (event.target === mostrarGuias) {
            fechar();
        }
    });
}

export {
    buttonverGuiasPagas,
    ShowGuias
};