const sidebar = document.getElementById("sidebar");
const appShell = document.getElementById("appShell");

const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
const sidebarToggleMobile = document.getElementById("sidebarToggleMobile");


// Recolher menu no desktop
sidebarCollapseBtn?.addEventListener("click", () => {

    appShell.classList.toggle("sidebar-collapsed");
    sidebar.style.display = "none";

});


// Abrir menu no celular
sidebarToggleMobile?.addEventListener("click", () => {

    sidebar.classList.toggle("open");
    sidebar.style.display = "flex";

});


// Fechar menu clicando fora no celular
document.addEventListener("click", (event)=>{

    const clicouDentro =
        sidebar.contains(event.target) ||
        sidebarToggleMobile.contains(event.target);


    if(!clicouDentro){

        sidebar.classList.remove("open");

    }

});


// Menu ativo ao clicar
const links = document.querySelectorAll(".nav-link");


links.forEach(link=>{

    link.addEventListener("click",()=>{

        links.forEach(item=>{
            item.classList.remove("active");
        });


        link.classList.add("active");


        // fecha menu mobile
        sidebar.classList.remove("open");

    });

});