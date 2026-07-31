import { formatarNumero } from "./formataNumero.js";


const API_REGISTER = "https://apiadministrativa.onrender.com/api/register";
const API_CLIENTES = "https://apiadministrativa.onrender.com/api/clientes";


const form = document.getElementById("registerForm");
const cpfInput = document.getElementById("cpf");
const numberInput = document.getElementById("telefone");
const messageBox = document.getElementById("messageBox");
const clientesList = document.getElementById("clientesList");


const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileToggle = document.getElementById("mobileToggle");





function getAuthUser() {

    try {

        return JSON.parse(
            localStorage.getItem("usuario") || "null"
        );

    } catch {

        return null;

    }

}





function redirectTo(page) {

    const currentPath = window.location.pathname;

    const basePath = currentPath.replace(/[^/]+$/, "");

    window.location.href = `${basePath}${page}`;

}





function enforceAccess() {

    const user = getAuthUser();


    if (!user || user.tipo !== "ADMIN") {

        redirectTo("paginainicial.html");

    }

}





function formatCpf(value) {


    const numbers = value
        .replace(/\D/g, "")
        .slice(0, 11);



    if (numbers.length <= 3) {

        return numbers;

    }



    if (numbers.length <= 6) {

        return `${numbers.slice(0,3)}.${numbers.slice(3)}`;

    }



    if (numbers.length <= 9) {

        return `${numbers.slice(0,3)}.${numbers.slice(3,6)}.${numbers.slice(6)}`;

    }



    return `${numbers.slice(0,3)}.${numbers.slice(3,6)}.${numbers.slice(6,9)}-${numbers.slice(9)}`;

}







function showMessage(text, type="success") {


    if(!messageBox) return;


    messageBox.textContent = text;

    messageBox.className = `message ${type}`;

}





function clearForm(){

    form.reset();

}







async function loadClients(){


    try {


        const response = await fetch(API_CLIENTES);



        if(!response.ok){

            throw new Error(
                "Erro ao buscar clientes"
            );

        }



        const clientes = await response.json();




        if(!Array.isArray(clientes) || clientes.length === 0){


            clientesList.innerHTML = `

            <div class="empty-state">

                Nenhum cliente cadastrado.

            </div>

            `;


            return;

        }







        clientesList.innerHTML = clientes.map(cliente => `


            <div class="client-item">


                <div>

                    <strong>
                        ${cliente.nome ?? "Sem nome"}
                    </strong>


                    <span>
                        ${cliente.email ?? "Sem email"}
                    </span>


                </div>



                <div>

                    <span>
                        ${cliente.cpf ?? "---"}
                    </span>

                </div>



            </div>


        `).join("");




    } catch(error){


        console.error(error);



        clientesList.innerHTML = `

        <div class="empty-state">

            Erro ao carregar clientes.

        </div>

        `;


    }


}








async function handleSubmit(event){


    event.preventDefault();




    const telefone = numberInput.value
        .replace(/\D/g,"");





    const payload = {


        nome:
        document.getElementById("nome")
        .value
        .trim(),



        email:
        document.getElementById("email")
        .value
        .trim(),



        endereco:
        document.getElementById("endereco")
        .value
        .trim(),



        cpf:
        cpfInput.value
        .replace(/\D/g,""),



        senha:
        document.getElementById("senha")
        .value,



        numeroTelefone:
        Number(telefone)

    };









    if(

        !payload.nome ||
        !payload.email ||
        !payload.endereco ||
        !payload.cpf ||
        !payload.senha ||
        !telefone


    ){


        showMessage(
            "Preencha todos os campos obrigatórios.",
            "error"
        );


        return;

    }









    if(payload.cpf.length !== 11){


        showMessage(
            "CPF precisa ter 11 dígitos.",
            "error"
        );


        return;


    }









    if(telefone.length !== 11){


        showMessage(
            "Telefone precisa ter 11 dígitos.",
            "error"
        );


        return;


    }









    try {


        const response = await fetch(
            API_REGISTER,
            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json"

                },


                body: JSON.stringify(payload)

            }

        );





        const data = await response.json();





        if(!response.ok){


            throw new Error(
                data.message ||
                "Erro ao cadastrar cliente"
            );


        }








        showMessage(
            "Cliente cadastrado com sucesso!",
            "success"
        );



        clearForm();



        await loadClients();







    } catch(error){



        console.error(error);



        showMessage(
            error.message,
            "error"
        );


    }



}









// FORMATAR CPF

cpfInput?.addEventListener(
"input",
(e)=>{


    e.target.value =
    formatCpf(e.target.value);



});









// TELEFONE SEM BLOQUEAR DIGITAÇÃO

numberInput?.addEventListener(
"input",
(e)=>{

    let valor = e.target.value.replace(/\D/g,"");


    if(valor.length > 11){
        valor = valor.slice(0,11);
    }


    e.target.value = valor;

});









// MENU MOBILE

function toggleSidebar(){


    sidebar?.classList.toggle("open");

    sidebarOverlay?.classList.toggle("active");


}





mobileToggle?.addEventListener(
"click",
toggleSidebar
);



sidebarOverlay?.addEventListener(
"click",
toggleSidebar
);







form?.addEventListener(
"submit",
handleSubmit
);






enforceAccess();

loadClients();