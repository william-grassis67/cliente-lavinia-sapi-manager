function PaymentPopUp() {
    const btnPay = document.getElementById("pay_btn");
    const popupPayment = document.getElementById("popup_payment");
    const closePopup = document.getElementById("fecharPagamento");

    if (!btnPay || !popupPayment || !closePopup) {
        console.warn("[PaymentPopUp] Elementos do pagamento não encontrados");
        return;
    }

    const abrir = () => {
        popupPayment.classList.add("active");
        document.body.style.overflow = "hidden";
    };

    const fechar = () => {
        popupPayment.classList.remove("active");
        document.body.style.overflow = "auto";
    };

    btnPay.addEventListener("click", abrir);
    closePopup.addEventListener("click", fechar);

    // Fecha ao clicar fora do conteúdo do popup
    popupPayment.addEventListener("click", (event) => {
        if (event.target === popupPayment) {
            fechar();
        }
    });
}

export { PaymentPopUp };