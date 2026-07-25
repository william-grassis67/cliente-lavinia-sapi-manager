export function enviarMensagemCliente(cliente) {


    const popup =
        document.getElementById("send_menssage");


    const btnEnviar =
        document.getElementById("btn_send");


    const btnFechar =
        document.getElementById("btn_close_send");


    const campoMensagem =
        document.getElementById("mensagem");



    if (
        !popup ||
        !btnEnviar ||
        !campoMensagem
    ) {

        console.error(
            "Modal de mensagem não encontrado"
        );

        return;

    }



    // abre popup

    popup.classList.add(
        "active"
    );




    // fecha popup

    if(btnFechar){


        btnFechar.onclick = () => {


            popup.classList.remove(
                "active"
            );


            campoMensagem.value = "";


        };


    }





    // enviar mensagem

    btnEnviar.onclick = () => {


        const mensagem =
            campoMensagem.value.trim();




        if(!mensagem){


            alert(
                "Digite uma mensagem."
            );


            return;

        }




        let numero =

            cliente.numeroTelefone ||

            cliente.telefone ||

            cliente.celular ||

            "";





        numero =
            String(numero)
            .replace(/\D/g, "");





        if(!numero){


            alert(
                "Cliente sem telefone cadastrado."
            );


            return;

        }





        // adiciona código do Brasil

        if(!numero.startsWith("55")){


            numero =
                "55" + numero;


        }





        const url =

            `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;





        window.open(
            url,
            "_blank"
        );





        popup.classList.remove(
            "active"
        );


        campoMensagem.value = "";



    };


}