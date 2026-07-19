document.addEventListener("DOMContentLoaded", () => {


    const sections = {

        inicio: document.getElementById("overview"),
        configuracoes: document.getElementById("preferencesSection"),
        conta: document.getElementById("accountSection")

    };


    const links = document.querySelectorAll(".nav-link");


    function esconderTodasSections(){

        Object.values(sections).forEach(section=>{

            if(section){
                section.style.display = "none";
            }

        });

    }



    function mostrarSection(nome){

        esconderTodasSections();


        if(sections[nome]){

            sections[nome].style.display = "block";

        }

    }



    links.forEach(link=>{


        link.addEventListener("click",(event)=>{


            const texto = link.querySelector(".nav-label")?.textContent;


            if(!texto) return;



            event.preventDefault();



            links.forEach(item=>{

                item.classList.remove("active");

            });


            link.classList.add("active");



            switch(texto){


                case "Início":

                    mostrarSection("inicio");

                    break;



                case "Configurações":

                case "Preferências":

                    mostrarSection("configuracoes");

                    break;



                case "Minha Conta":

                    mostrarSection("conta");

                    break;


            }



        });


    });



    // começa mostrando início

    mostrarSection("inicio");


});