function verifyButton() {
    const data = new Date();
    const hoje = data.getDate();

    const btnPayment = document.getElementById("confirma");

    if (hoje >= 9 && hoje <= 16) {
        btnPayment.disabled = false;

        // estilo quando está liberado
        btnPayment.style.background = "#000080";
        btnPayment.style.color = "#ffffff";
        btnPayment.style.cursor = "pointer";

    } else {
        btnPayment.disabled = true;

        // estilo quando está bloqueado
        btnPayment.style.background = "#9ca3af";
        btnPayment.style.color = "#e5e7eb";
        btnPayment.style.cursor = "not-allowed";
    }
}

// executa ao carregar a página
export {verifyButton}