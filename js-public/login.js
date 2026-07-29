const API_LOGIN_URL = "https://apiadministrativa.onrender.com/api/login";


function redirectTo(pageName) {

    const currentPath = window.location.pathname;
    const basePath = currentPath.replace(/[^/]+$/, "");

    window.location.href = `${basePath}${pageName}`;
}



function formatCpf(value) {

    const onlyNumbers = value
        .replace(/\D/g, "")
        .slice(0, 11);


    if (onlyNumbers.length <= 3) {
        return onlyNumbers;
    }


    if (onlyNumbers.length <= 6) {
        return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3)}`;
    }


    if (onlyNumbers.length <= 9) {
        return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3, 6)}.${onlyNumbers.slice(6)}`;
    }


    return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3, 6)}.${onlyNumbers.slice(6, 9)}-${onlyNumbers.slice(9)}`;

}




async function login() {


    const inputCpf = document.getElementById("cpf");
    const inputSenha = document.getElementById("password");
    const btnEnter = document.getElementById("btn_enter");


    const alertsContainer = document.querySelector(".alerts");

    const erroservidor = document.getElementById("erroservidor");
    const errologin = document.getElementById("errologin");
    const truelogin = document.getElementById("corretologin");



    if (!inputCpf || !inputSenha || !btnEnter) {
        console.error("Elementos do login não encontrados");
        return;
    }



    function hideAlerts(){

        if(alertsContainer){
            alertsContainer.style.display = "none";
        }


        [erroservidor, errologin, truelogin]
        .forEach(alert => {

            if(alert){
                alert.style.display = "none";
            }

        });

    }



    function showAlert(alert){

        hideAlerts();


        if(alertsContainer){
            alertsContainer.style.display = "flex";
        }


        if(alert){
            alert.style.display = "block";
        }

    }



    function setLoading(status){

        btnEnter.disabled = status;

        btnEnter.textContent = status
            ? "Entrando..."
            : "Entrar";

    }




    inputCpf.addEventListener("input", (event)=>{

        event.target.value = formatCpf(event.target.value);

    });





    btnEnter.addEventListener("click", async ()=>{


        const cpf = inputCpf.value
            .replace(/\D/g,"")
            .trim();


        const senha = inputSenha.value.trim();



        console.log("CPF enviado:", cpf);
        console.log("Senha enviada:", senha);



        if(cpf.length !== 11 || senha === ""){

            showAlert(errologin);
            return;

        }




        setLoading(true);
        hideAlerts();



        try{


            const response = await fetch(API_LOGIN_URL, {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },


                body: JSON.stringify({

                    cpf,
                    senha

                })

            });



            const data = await response.json();



            console.log("Status:", response.status);
            console.log("Resposta API:", data);



            if(!response.ok){

                showAlert(errologin);
                return;

            }




            localStorage.setItem(
                "usuario",
                JSON.stringify(data)
            );



            showAlert(truelogin);



            setTimeout(()=>{


                if(data.tipo === "ADMIN"){

                    redirectTo("admin.html");


                }else{

                    redirectTo("paginainicial.html");

                }


            },500);




        }catch(error){


            console.error("Erro de conexão:", error);

            showAlert(erroservidor);


        }finally{


            setLoading(false);


        }


    });


}




function protectAdminPage(){


    const usuario = JSON.parse(
        localStorage.getItem("usuario")
    );


    if(!usuario || usuario.tipo !== "ADMIN"){

        redirectTo("index.html");

    }


}



export {
    login,
    protectAdminPage
};