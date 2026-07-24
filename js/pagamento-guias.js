function pagamentoGuiasInss() {

    const btnConfirma = document.getElementById("confirma");

    if (!btnConfirma) {
        return;
    }


    btnConfirma.addEventListener("click", async () => {


        let usuario;

        try {

            usuario = JSON.parse(
                localStorage.getItem("usuario")
            );

        } catch (erro) {

            console.error(
                "Erro ao ler usuário:",
                erro
            );

            alert(
                "Sessão inválida. Faça login novamente."
            );

            return;
        }



        if (!usuario || !usuario.id) {

            alert(
                "Usuário não encontrado."
            );

            return;

        }



        const usuarioId = usuario.id;



        const competenciaInput =
            document.getElementById("competencia");


        const vencimentoInput =
            document.getElementById("vencimento");


        const valorInput =
            document.getElementById("valor");


        const mensagemInput =
            document.getElementById("mensagemPagamento");



        if (
            !competenciaInput ||
            !vencimentoInput ||
            !valorInput ||
            !mensagemInput
        ) {

            console.error(
                "Campos da guia não encontrados."
            );

            return;

        }




        const hoje = new Date();


        // Gera competência automaticamente
        competenciaInput.value =
            `${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;




        const guia = {


            competencia:
                competenciaInput.value,


            vencimento:
                vencimentoInput.value,


            valor:
                Number(valorInput.value),


            mensagemPagamento:
                mensagemInput.value.trim()

        };




        if (!guia.vencimento) {

            alert(
                "Informe o vencimento."
            );

            return;

        }



        if (
            !guia.valor ||
            guia.valor <= 0 ||
            Number.isNaN(guia.valor)
        ) {

            alert(
                "Informe um valor válido."
            );

            return;

        }




        console.log(
            "Enviando guia:",
            guia
        );



        try {


            const response = await fetch(

                `http://localhost:8080/api/guias/${usuarioId}`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },


                    body:
                        JSON.stringify(guia)

                }

            );



            const texto =
                await response.text();



            if (!response.ok) {

                throw new Error(
                    texto ||
                    "Erro ao criar guia."
                );

            }



            const resultado =
                texto
                ? JSON.parse(texto)
                : null;



            console.log(
                "Guia criada:",
                resultado
            );



            alert(
                "Guia INSS criada com sucesso!"
            );




            // limpar formulário

            vencimentoInput.value = "";

            valorInput.value = "";

            mensagemInput.value = "";



        } catch (erro) {


            console.error(
                "Erro guia:",
                erro
            );


            alert(
                erro.message
            );

        }


    });


}


export { pagamentoGuiasInss };