
function ModalGuiasAdmin() {

    const modal = document.getElementById(
        "modalGuiasAdmin"
    );


    const btnFechar = document.getElementById(
        "fecharGuiasAdmin"
    );



    if (!modal || !btnFechar) {

        console.error(
            "Modal de guias não encontrado"
        );

        return;

    }



    // Abrir modal
    function abrir() {

        modal.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }



    // Fechar modal
    function fechar() {

        modal.classList.remove(
            "active"
        );


        document.body.style.overflow =
            "auto";

    }



    // Botão fechar
    btnFechar.addEventListener(
        "click",
        fechar
    );



    // Clique fora fecha
    modal.addEventListener(
        "click",
        (event)=>{


            if(event.target === modal){

                fechar();

            }


        }
    );



    return {

        abrir,

        fechar

    };

}



export {
    ModalGuiasAdmin
};