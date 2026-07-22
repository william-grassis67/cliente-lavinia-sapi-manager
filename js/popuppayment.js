function PaymentPopUp() {

    const btnPay = document.getElementById("pay_btn");
    const popupPayment = document.getElementById("popup_payment");

    if (!btnPay || !popupPayment) {
        return;
    }

    btnPay.addEventListener("click", () => {
        popupPayment.classList.add("active");
    });

}

export { PaymentPopUp };