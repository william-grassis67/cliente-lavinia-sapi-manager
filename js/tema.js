const themeButton = document.getElementById("themeToggleButton");
const themeIcon = themeButton?.querySelector("i");
//const sidebarToggleMobile = document.getAnimations.getElementById("sidebarToggleMobile");


function aplicarTema(tema){

    if(tema === "dark"){
        document.body.classList.add("dark-theme");
        //sidebarToggleMobile
        
        if(themeButton){
            themeButton.innerHTML =
            '<i class="fa-solid fa-moon"></i> Escuro';
        }

    }else{

        document.body.classList.remove("dark-theme");

        if(themeButton){
            themeButton.innerHTML =
            '<i class="fa-solid fa-sun"></i> Claro';
        }

    }

}



const temaSalvo = localStorage.getItem("tema") || "light";

aplicarTema(temaSalvo);



themeButton?.addEventListener("click",()=>{


    const temaAtual = document.body.classList.contains("dark-theme")
        ? "light"
        : "dark";


    localStorage.setItem(
        "tema",
        temaAtual
    );


    aplicarTema(temaAtual);


});