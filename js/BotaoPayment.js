function verifyButton() {
    const btnPayment = document.getElementById("confirma");

    if (!btnPayment) {
        return;
    }

    const hoje = new Date().getDate();
    const liberado = hoje >= 9 && hoje <= 16;

    btnPayment.disabled = !liberado;

    // estilo quando está liberado / bloqueado
    btnPayment.style.background = liberado ? "#000080" : "#9ca3af";
    btnPayment.style.color = liberado ? "#ffffff" : "#e5e7eb";
    btnPayment.style.cursor = liberado ? "pointer" : "not-allowed";
}

// Ponte global para que pagamento-guias.js reaplique a regra após o envio
window.SapiVerificarBotaoPagamento = verifyButton;

export { verifyButton };