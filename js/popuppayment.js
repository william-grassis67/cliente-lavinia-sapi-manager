function PaymentPopUp() {

    const btnPay = document.getElementById("pay_btn");
    const popupPayment = document.getElementById("popup_payment");
    const closePopup = document.getElementById("fecharPagamento");


    if (!btnPay || !popupPayment || !closePopup) {
        console.log("Elementos do pagamento não encontrados");
        return;
    }


    btnPay.addEventListener("click", () => {

        popupPayment.classList.add("active");

        console.log("Popup aberto");

    });


    closePopup.addEventListener("click", () => {

        popupPayment.classList.remove("active");

        console.log("Popup fechado");

    });

}


export { PaymentPopUp };