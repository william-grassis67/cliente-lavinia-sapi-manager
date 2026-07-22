function NavegacaoAdmin() {

    const btnDashboard = document.getElementById("btn_dashboard");
    const btnConfiguracoes = document.getElementById("btn_configuracoes");
    const btnUsuarios = document.getElementById("btn_usuarios");


    const sections = {
        homepage: document.getElementById("homepage"),
        settings: document.getElementById("settingspage"),
        userspage: document.getElementById("userpage")
    };


    function esconderSections() {

        Object.values(sections).forEach(section => {

            if(section){

                section.style.display = "none";

            }

        });

    }



    btnDashboard.addEventListener("click", (e) => {

        e.preventDefault();

        esconderSections();

        sections.homepage.style.display = "block";

        console.log("Dashboard aberto");

    });



    btnConfiguracoes.addEventListener("click", (e) => {

        e.preventDefault();

        esconderSections();

        sections.settings.style.display = "block";

        console.log("Configurações abertas");

    });



    btnUsuarios.addEventListener("click", (e) => {

        e.preventDefault();

        esconderSections();

        sections.userspage.style.display = "block";

        console.log("Usuários aberto");

    });

}


export { NavegacaoAdmin };