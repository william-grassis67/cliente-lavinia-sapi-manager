const API_BASE = "https://apiadministrativa.onrender.com";

function formatarData(data) {
    if (!data) return "";
    const partes = data.split("T")[0].split("-");
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
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
        const resposta = await fetch(`${API_BASE}/api/cliente/guias/${usuario.id}`);

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
            if (guia.pago) {
                totalPagas++;
            } else {
                totalPendentes++;
            }

            if (listaGuiasPagas) {
                const card = document.createElement("div");
                card.className = "guia-card";

                const valorFormatado = Number(guia.valor).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                });

                const statusTexto = guia.pago ? "Pago" : "Aguardando pagamento";
                const statusClasse = guia.pago ? "pago" : "pendente";

                card.innerHTML = `
                    <div class="guia-header">
                        <strong>Guia #${guia.id}</strong>
                        <span class="status-badge ${statusClasse}">${statusTexto}</span>
                    </div>
                    <div class="guia-body">
                        <p><strong>Cliente:</strong> ${guia.nomeUsuario || usuario.nome || "Não informado"}</p>
                        <p><strong>Competência:</strong> ${guia.competencia}</p>
                        <p><strong>Vencimento:</strong> ${formatarData(guia.vencimento)}</p>
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
            const resposta = await fetch(url);
            if (!resposta.ok) throw new Error("Erro ao buscar guias.");

            const guias = await resposta.json();
            tbody.innerHTML = "";

            guias.forEach((guia) => {
                tbody.innerHTML += `
                    <tr>
                        <td data-label="Competência">${guia.competencia}</td>
                        <td data-label="Vencimento">${formatarData(guia.vencimento)}</td>
                        <td data-label="Valor">R$ ${guia.valor}</td>
                        <td data-label="Status">${guia.pago ? "Pago" : "Pendente"}</td>
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