const API_BASE_URL = "https://apiadministrativa.onrender.com";

function pagamentoGuiasInss() {
    const btnConfirma = document.getElementById("confirma");

    if (!btnConfirma) {
        return;
    }

    btnConfirma.addEventListener("click", async () => {
        let usuario;

        try {
            usuario = JSON.parse(localStorage.getItem("usuario"));
        } catch (erro) {
            console.error("Erro ao ler usuário:", erro);
            window.SapiToast?.error("Sessão inválida. Faça login novamente.");
            return;
        }

        if (!usuario || !usuario.id) {
            window.SapiToast?.error("Usuário não encontrado.");
            return;
        }

        const usuarioId = usuario.id;

        const competenciaInput = document.getElementById("competencia");
        const vencimentoInput = document.getElementById("vencimento");
        const valorInput = document.getElementById("valor");
        const mensagemInput = document.getElementById("mensagemPagamento");

        if (!competenciaInput || !vencimentoInput || !valorInput || !mensagemInput) {
            console.error("Campos da guia não encontrados.");
            return;
        }

        const hoje = new Date();

        // Gera competência automaticamente
        competenciaInput.value =
            `${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;

        const guia = {
            competencia: competenciaInput.value,
            vencimento: vencimentoInput.value,
            valor: Number(valorInput.value),
            mensagemPagamento: mensagemInput.value.trim()
        };

        if (!guia.vencimento) {
            window.SapiToast?.warning("Informe o vencimento.");
            return;
        }

        if (!guia.valor || guia.valor <= 0 || Number.isNaN(guia.valor)) {
            window.SapiToast?.warning("Informe um valor válido.");
            return;
        }

        // Evita duplo envio enquanto a requisição está em andamento
        if (btnConfirma.disabled) return;
        btnConfirma.disabled = true;
        const textoOriginalBtn = btnConfirma.textContent;
        btnConfirma.textContent = "Enviando...";

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/guias/${usuarioId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(guia)
                }
            );

            const texto = await response.text();

            if (!response.ok) {
                throw new Error(texto || "Erro ao criar guia.");
            }

            const resultado = texto ? JSON.parse(texto) : null;
            console.log("Guia criada:", resultado);

            window.SapiToast?.success("Guia INSS confirmada com sucesso!");

            // limpar formulário
            vencimentoInput.value = "";
            valorInput.value = "";
            mensagemInput.value = "";

            // fecha o popup de pagamento
            document.getElementById("popup_payment")?.classList.remove("active");
            document.body.style.overflow = "auto";

            // atualiza contadores e histórico de guias sem recarregar a página
            await window.SapiGuias?.reload();

        } catch (erro) {
            console.error("Erro guia:", erro);
            window.SapiToast?.error(erro.message || "Erro ao processar pagamento.");
        } finally {
            btnConfirma.textContent = textoOriginalBtn;
            // reaplica a regra de dias liberados para pagamento
            window.SapiVerificarBotaoPagamento?.();
        }
    });
}

export { pagamentoGuiasInss };