function initProcessos(){

    const URL_PRINCIPAL = "https://apiadministrativa.onrender.com";

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const processos_total_show = document.getElementById("processos_total_show");
    const processos_andamento_show = document.getElementById("processos_andamento_show");
    const processos_aguardando_docs_show = document.getElementById("processos_aguardando_docs_show")

    if (!usuario) {
        console.log("Usuário não encontrado no localStorage");
        return;
    }

    console.log("usuario:", usuario.id);

    fetch(`${URL_PRINCIPAL}/api/cliente/processos/${usuario.id}`)
        .then(resposta => resposta.json())
        .then(processos => {

            console.log("Processos recebidos:", processos);

            processos.forEach(processo => {
                console.log("Tipo:", processo.tipo);
                if(processo.status == "AGUARDANDO_DOCUMENTOS"){
                    processos_andamento_show.innerHTML = processos.length;
                    processos_aguardando_docs_show.innerHTML = processos.length;
                }
            });

           // alert(processos.length)
            const qtdProcessos = processos.length
            processos_total_show.innerHTML = qtdProcessos;
            //alert(processos.lenght)


        })
        .catch(erro => {
            console.error("Erro ao buscar processos:", erro);
        });
}

export { initProcessos };