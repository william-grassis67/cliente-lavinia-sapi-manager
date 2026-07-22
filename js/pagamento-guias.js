function pagamentoGuiasInss() {

    const data = new Date();
    const mes = data.getMonth();
    const dia = data.getDate() + 1;

    const btnConfirma = document.getElementById("confirma");

    if (!btnConfirma) {
        return;
    }

    btnConfirma.addEventListener("click", async () => {

        const usuario = JSON.parse(localStorage.getItem("usuario"));

        if (!usuario) {
            alert("Usuário não está logado.");
            return;
        }

        const usuarioId = usuario.id;

        const competencia = document.getElementById("competencia");

        competencia.value = `${mes}/${data.getFullYear()}`;
        const vencimento = document.getElementById("vencimento").value;
        const valor = Number(document.getElementById("valor").value);
        const mensagemPagamento = document.getElementById("mensagemPagamento").value;

        const API_PAGAMENTO = `http://localhost:8080/api/pagamento/${usuarioId}`;

        try {

            const response = await fetch(API_PAGAMENTO, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    competencia,
                    vencimento,
                    valor,
                    mensagemPagamento,
                    pago: true
                })
            });

            if (!response.ok) {
                throw new Error("Erro ao registrar pagamento.");
            }

            const data = await response.json();

            console.log("Pagamento registrado:", data);

            alert("Pagamento registrado com sucesso!");

        } catch (erro) {

            console.error(erro);

            alert("Erro ao registrar pagamento.");

        }

    });

}

export { pagamentoGuiasInss };