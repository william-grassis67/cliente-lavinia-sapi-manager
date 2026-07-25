const API_BASE_URL = "https://apiadministrativa.onrender.com";


async function ShowGuias(usuarioId) {


    const usuario = JSON.parse(
        localStorage.getItem("usuario")
    );


    const token = usuario?.token;



    const guiasPagasShow = document.getElementById(
        "guias_pagas_show"
    );


    const listaGuiasPagas = document.getElementById(
        "listaGuiasPagas"
    );


    const btnVerGuias = document.getElementById(
        "verGuiasPagas"
    );


    const popupGuias = document.getElementById(
        "popupGuiasPagas"
    );


    const fecharGuias = document.getElementById(
        "fecharGuiasPagas"
    );



    if (!usuarioId) {

        console.error(
            "ID do usuário não informado"
        );

        return;
    }



    try {


        const response = await fetch(

            `${API_BASE_URL}/api/payments/guias/${usuarioId}`,

            {

                method: "GET",

                headers: {

                    "Authorization":
                        token
                        ? `Bearer ${token}`
                        : ""

                }

            }

        );



        if (!response.ok) {


            console.error(
                "Erro API:",
                response.status
            );


            throw new Error(
                `Erro HTTP ${response.status}`
            );

        }



        const guias =
            await response.json();



        console.log(
            "Guias recebidas:",
            guias
        );



        const guiasPagas =
            Array.isArray(guias)
            ? guias
            : [];




        if (guiasPagasShow) {

            guiasPagasShow.textContent =
                guiasPagas.length;

        }





        if (listaGuiasPagas) {


            listaGuiasPagas.innerHTML = "";



            if (guiasPagas.length === 0) {


                listaGuiasPagas.innerHTML = `

                    <section class="empty-guias">

                        <i class="fa-solid fa-file-circle-xmark"></i>

                        <h2>
                            Nenhuma guia encontrada
                        </h2>

                        <p>
                            Você ainda não possui pagamentos.
                        </p>

                    </section>

                `;


            } else {



                guiasPagas.forEach(guia => {



                    const card =
                        document.createElement(
                            "article"
                        );



                    card.className =
                        "historico-guia-card";



                    card.innerHTML = `


                    <div class="guia-header">


                        <div class="titulo-guia">


                            <i class="fa-solid fa-file-invoice-dollar"></i>


                            <h3>
                                ${
                                    guia.competencia ??
                                    "Sem competência"
                                }
                            </h3>


                        </div>



                        <span class="status-pago">

                            <i class="fa-solid fa-circle-check"></i>

                            Pago

                        </span>


                    </div>





                    <div class="guia-info">


                        <div>

                            <i class="fa-solid fa-money-bill-wave"></i>

                            <strong>
                                Valor
                            </strong>


                            <p>

                                R$
                                ${
                                    guia.valor
                                    ?
                                    Number(
                                        guia.valor
                                    ).toLocaleString(
                                        "pt-BR",
                                        {
                                            minimumFractionDigits:2
                                        }
                                    )
                                    :
                                    "0,00"
                                }

                            </p>


                        </div>





                        <div>

                            <i class="fa-solid fa-calendar-days"></i>

                            <strong>
                                Vencimento
                            </strong>


                            <p>

                            ${
                                guia.vencimento
                                ?
                                new Date(
                                    guia.vencimento
                                )
                                .toLocaleDateString(
                                    "pt-BR"
                                )
                                :
                                "Não informado"
                            }

                            </p>


                        </div>





                        <div>

                            <i class="fa-solid fa-circle-check"></i>


                            <strong>
                                Status
                            </strong>


                            <p>
                                Pagamento confirmado
                            </p>


                        </div>


                    </div>


                    `;



                    listaGuiasPagas.appendChild(
                        card
                    );



                });



            }


        }






        if (
            btnVerGuias &&
            popupGuias
        ) {


            btnVerGuias.onclick = () => {


                popupGuias.classList.add(
                    "active"
                );


                document.body.style.overflow =
                    "hidden";

            };


        }





        if (
            fecharGuias &&
            popupGuias
        ) {


            fecharGuias.onclick = () => {


                popupGuias.classList.remove(
                    "active"
                );


                document.body.style.overflow =
                    "auto";

            };


        }





    } catch(error) {


        console.error(
            "Erro ao carregar guias:",
            error
        );



        if(guiasPagasShow){

            guiasPagasShow.textContent =
                "0";

        }



        if(listaGuiasPagas){


            listaGuiasPagas.innerHTML = `


                <section class="empty-guias">


                    <i class="fa-solid fa-triangle-exclamation"></i>


                    <h2>
                        Erro ao carregar guias
                    </h2>


                    <p>
                        Não foi possível conectar ao servidor.
                    </p>


                </section>


            `;


        }


    }


}



export {
    ShowGuias
};