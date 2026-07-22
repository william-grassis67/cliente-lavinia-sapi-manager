function Notificacao() {

    async function SolicitarPermissao() {

        const permissao = await Notification.requestPermission();

        if (permissao === "granted") {
            console.log("Permissão concedida");

        } else {
            console.log("Permissão negada");
        }

    }


    const btnConfirmNotification = document.getElementById("btn_confirm_notification");


    if (btnConfirmNotification) {

        btnConfirmNotification.addEventListener("click", () => {

            SolicitarPermissao();

        });

    }


    function verificarVencimento() {

        const hoje = new Date();

        const dia = hoje.getDate();
        const mes = hoje.getMonth();
        const ano = hoje.getFullYear();


        // Todo dia 10 do mês
        let vencimento = new Date(ano, mes, 10);


        // Se já passou do dia 10, pega o próximo mês
        if (hoje > vencimento) {

            vencimento = new Date(ano, mes + 1, 10);

        }


        const diferenca = vencimento - hoje;


        const diasRestantes = Math.ceil(
            diferenca / (1000 * 60 * 60 * 24)
        );


        console.log("Dias restantes:", diasRestantes);


        if (Notification.permission === "granted") {


            if (diasRestantes === 3) {

                new Notification("Atenção!", {
                    body: "Faltam 3 dias para o vencimento da guia do INSS."
                });

            }


            if (diasRestantes === 1) {

                new Notification("Atenção!", {
                    body: "Falta 1 dia para o vencimento da guia do INSS."
                });

            }


            if (diasRestantes === 0) {

                new Notification("Atenção!", {
                    body: "Hoje é o último dia para pagar a guia do INSS."
                });

            }

        }

    }


    verificarVencimento();

}


export {
    Notificacao
};