import { ModalGuiasAdmin } from "./ModalGuiasAdmin.js";

const API_CLIENTES = "https://apiadministrativa.onrender.com/api/clientes";
const API_REMOVE = "https://apiadministrativa.onrender.com/api/remove";

const listaClientes = document.getElementById("clientes"); //VAI RECEBER OS CLIENTES REGISTRADOS
const modalUsuario = document.getElementById("modalUsuario");
const fecharUsuario = document.getElementById("fecharUsuario");
const usuarioNome = document.getElementById("usuarioNome");
const usuarioEmail = document.getElementById("usuarioEmail");
const usuarioCpf = document.getElementById("usuarioCpf");
const usuarioEndereco = document.getElementById("usuarioEndereco");
const usuarioTipo = document.getElementById("usuarioTipo");
const usuarioStatus = document.getElementById("usuarioStatus");
const usuarioUltimoLogin = document.getElementById("usuarioUltimoLogin");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileToggle = document.getElementById("mobileToggle");
const refreshButton = document.getElementById("refreshUsers");
const searchInput = document.getElementById("searchInput");
const sortAccessBtn = document.getElementById("sortAccessBtn");
const sortDirectionLabel = document.getElementById("sortDirectionLabel");
const modalGuiasAdmin =
  document.getElementById("modalGuiasAdmin");


const tabelaGuiasAdmin =
  document.getElementById("tabelaGuiasAdmin");


const fecharGuiasAdmin =
  document.getElementById("fecharGuiasAdmin");


const tituloGuiasUsuario =
  document.getElementById("tituloGuiasUsuario");

let clientesCache = [];//GUARDA OS CLIENTES EM UM Array
let sortAscending = false;

function toggleSidebar(force) {
  if (!sidebar) return;
  const shouldOpen = typeof force === "boolean" ? force : !sidebar.classList.contains("open");
  sidebar.classList.toggle("open", shouldOpen);
  sidebarOverlay?.classList.toggle("active", shouldOpen);
  document.body.classList.toggle("modal-open", shouldOpen);
}

function closeSidebar() {
  toggleSidebar(false);
}

function formatarStatus(status) {
  const normalized = String(status || "ACTIVE").toUpperCase();
  const isActive = normalized === "ACTIVE" || normalized === "ATIVO" || normalized === "TRUE" || normalized === "1";
  return {
    label: isActive ? "Ativo" : "Inativo",
    className: isActive ? "status-pill" : "status-pill inactive"
  };
}

function formatarUltimoLogin(data) {
  if (!data) return "Nunca acessou";

  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "Nunca acessou";

  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

function atualizarResumo(clientes) {
  const totalElement = document.getElementById("totalUsers");
  const ativosElement = document.getElementById("activeUsers");
  const lastLoginUser = document.getElementById("lastLoginUser");
  const lastLoginValue = document.getElementById("lastLoginValue");

  if (totalElement) totalElement.textContent = clientes.length;
  if (ativosElement) {
    const ativos = clientes.filter((cliente) => {
      const status = String(cliente.status || cliente.tipo || "ACTIVE").toUpperCase();
      return status === "ACTIVE" || status === "ATIVO" || status === "ADMIN" || status === "TRUE" || status === "1";
    }).length;
    ativosElement.textContent = ativos;
  }

  const usuariosComLogin = clientes.filter((cliente) => cliente.ultimoAcesso);
  const maisRecente = usuariosComLogin.sort((a, b) => new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso))[0];

  if (lastLoginUser && lastLoginValue) {
    if (maisRecente) {
      lastLoginUser.textContent = maisRecente.nome || "Usuário";
      lastLoginValue.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${formatarUltimoLogin(maisRecente.ultimoAcesso)}`;
    } else {
      lastLoginUser.textContent = "Nenhum acesso";
      lastLoginValue.textContent = "Último login registrado";
    }
  }
}

function renderizarClientes(clientes) {

    listaClientes.innerHTML = "";


    if (!Array.isArray(clientes) || clientes.length === 0) {

        listaClientes.innerHTML =
            '<div class="empty-state">Nenhum usuário encontrado.</div>';

        return;

    }



    const table = document.createElement("div");

    table.className = "table-wrapper";


    table.innerHTML = `

        <table class="users-table">

            <thead>

                <tr>

                    <th>Usuário</th>
                    <th>Email</th>
                    <th>CPF</th>
                    <th>Tipo</th>
                    <th>Último acesso</th>
                    <th>Endereço</th>
                    <th>Status</th>
                    <th>Ações</th>

                </tr>

            </thead>


            <tbody></tbody>


        </table>

    `;



    const body = table.querySelector("tbody");





    clientes.forEach(cliente => {


        const row = document.createElement("tr");



        const status =
            formatarStatus(
                cliente.status || cliente.tipo
            );



        const ultimoAcesso =
            formatarUltimoLogin(
                cliente.ultimoAcesso
            );



        const acessou =
            Boolean(cliente.ultimoAcesso) &&
            !Number.isNaN(
                new Date(cliente.ultimoAcesso).getTime()
            );



        row.className =
            acessou
            ? ""
            : "highlight-never-access";





        row.innerHTML = `


            <td data-label="Usuário">

                <div class="user-name">
                    ${cliente.nome || "Sem nome"}
                </div>

                <div class="user-email">
                    ${cliente.email || "Sem email"}
                </div>

            </td>



            <td data-label="Email">
                ${cliente.email || "—"}
            </td>



            <td data-label="CPF">
                ${cliente.cpf || "—"}
            </td>



            <td data-label="Tipo">
                ${cliente.tipo || "CLIENTE"}
            </td>



            <td data-label="Último acesso" title="${ultimoAcesso}">

                <span class="last-login ${acessou ? "" : "never-accessed"}">

                    <i class="fa-solid fa-clock"></i>

                    ${ultimoAcesso}

                </span>

            </td>




            <td data-label="Endereço">
                ${cliente.endereco || "—"}
            </td>



            <td data-label="Status">

                <span class="${status.className}">

                    ${status.label}

                </span>

            </td>




            <td data-label="Ações">


                <div class="actions">


                    <button 
                        class="icon-btn view-btn"
                        title="Visualizar">

                        <i class="fa-solid fa-eye"></i>

                    </button>



                    <button 
                        class="delete-btn"
                        title="Remover">

                        <i class="fa-solid fa-trash"></i>

                    </button>



                    <button 
                        class="send-message-btn"
                        title="Enviar mensagem">

                        <i class="fa-brands fa-whatsapp"></i>

                    </button>


                </div>


            </td>


        `;





        // =========================
        // VISUALIZAR USUÁRIO
        // =========================

        const btnView =
            row.querySelector(".view-btn");


        if (btnView) {

            btnView.addEventListener(
                "click",
                () => {

                    abrirModalUsuario(cliente);

                }
            );

        }







        // =========================
        // REMOVER USUÁRIO
        // =========================

        const btnDelete =
            row.querySelector(".delete-btn");


        if (btnDelete) {


            btnDelete.addEventListener(
                "click",
                () => {

                    removerCliente(
                        cliente.cpf
                    );

                }
            );


        }







        // =========================
        // WHATSAPP
        // =========================

        const btnWhats =
            row.querySelector(
                ".send-message-btn"
            );



        if (btnWhats) {


            btnWhats.addEventListener(
                "click",
                () => {


                    const popup =
                        document.getElementById(
                            "send_menssage"
                        );


                    const btnEnviar =
                        document.getElementById(
                            "btn_send"
                        );


                    const btnFechar =
                        document.getElementById(
                            "btn_close_send"
                        );


                    const campoMensagem =
                        document.getElementById(
                            "mensagem"
                        );





                    if (
                        !popup ||
                        !btnEnviar ||
                        !campoMensagem
                    ) {


                        console.error(
                            "Modal WhatsApp não encontrado"
                        );


                        return;

                    }





                    popup.classList.add(
                        "active"
                    );





                    btnFechar.onclick = () => {


                        popup.classList.remove(
                            "active"
                        );


                        campoMensagem.value = "";


                    };








                    btnEnviar.onclick = () => {


                        const mensagem =
                            campoMensagem.value.trim();




                        if (!mensagem) {


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






                        if (!numero) {


                            alert(
                                "Este cliente não possui telefone."
                            );


                            return;

                        }






                        if (!numero.startsWith("55")) {


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
            );


        }





        body.appendChild(row);



    });





    listaClientes.appendChild(table);


}
function abrirModalUsuario(cliente) {

  document.getElementById("usuarioNome").textContent = cliente.nome || "—";
  document.getElementById("usuarioEmail").textContent = cliente.email || "—";
  document.getElementById("usuarioCpf").textContent = cliente.cpf || "—";
  document.getElementById("usuarioTipo").textContent = cliente.tipo || "CLIENTE";
  document.getElementById("usuarioEndereco").textContent = cliente.endereco || "—";

  const status = formatarStatus(cliente.status || cliente.tipo);

  document.getElementById("usuarioStatus").textContent = status.label;
  document.getElementById("usuarioUltimoLogin").textContent =
    formatarUltimoLogin(cliente.ultimoAcesso);

  const modal = document.getElementById("modalUsuario");

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");

  const btnVerify = document.getElementById("btn_verify");

  // Remove eventos antigos
  btnVerify.replaceWith(btnVerify.cloneNode(true));

  const novoBotao = document.getElementById("btn_verify");

  novoBotao.addEventListener("click", async () => {


    try {


      const response = await fetch(

        `http://localhost:8080/api/payments/guias/${cliente.id}`

      );



      if (!response.ok) {

        throw new Error();

      }



      const guias =
        await response.json();



      tituloGuiasUsuario.textContent =
        `Guias de ${cliente.nome}`;



      tabelaGuiasAdmin.innerHTML = "";



      guias.forEach(guia => {


        tabelaGuiasAdmin.innerHTML += `


            <tr>


                <td>

                ${guia.competencia ?? "-"}

                </td>



                <td>

                R$ ${Number(
          guia.valor || 0
        ).toFixed(2)
          }

                </td>



                <td>

                ${guia.vencimento
            ?
            new Date(
              guia.vencimento
            )
              .toLocaleDateString(
                "pt-BR"
              )
            :
            "-"
          }

                </td>



                <td>


                <span class="status-pill">

                    Pago

                </span>


                </td>


            </tr>


            `;


      });



      modalGuiasAdmin.classList.add(
        "active"
      );


      document.body.classList.add(
        "modal-open"
      );



    } catch (error) {


      console.error(error);

      alert(
        "Erro ao carregar guias"
      );


    }


  });

}

async function carregarClientes() {
  try {
    const resposta = await fetch(API_CLIENTES);
    if (!resposta.ok) throw new Error("Falha ao buscar clientes");

    const clientes = await resposta.json();
    clientesCache = Array.isArray(clientes) ? clientes : [];
    atualizarResumo(clientesCache);
    renderizarClientes(aplicarFiltroEOrdenacao(clientesCache));
  } catch (error) {
    console.error("Erro ao carregar clientes", error);
    listaClientes.innerHTML = '<div class="empty-state">Não foi possível carregar a lista de usuários.</div>';
  }
}

function aplicarFiltroEOrdenacao(clientes) {
  const termo = searchInput?.value.trim().toLowerCase() || "";
  const filtrados = clientes.filter((cliente) => {
    const nome = String(cliente.nome || "").toLowerCase();
    const email = String(cliente.email || "").toLowerCase();
    const cpf = String(cliente.cpf || "").toLowerCase();
    const tipo = String(cliente.tipo || "").toLowerCase();
    return nome.includes(termo) || email.includes(termo) || cpf.includes(termo) || tipo.includes(termo);
  });

  return filtrados.slice().sort((a, b) => {
    const dataA = new Date(a.ultimoAcesso).getTime();
    const dataB = new Date(b.ultimoAcesso).getTime();
    const aVal = Number.isNaN(dataA) ? -8640000000000000 : dataA;
    const bVal = Number.isNaN(dataB) ? -8640000000000000 : dataB;
    return sortAscending ? aVal - bVal : bVal - aVal;
  });
}

async function removerCliente(cpf) {
  if (!cpf) return;
  const confirmar = confirm("Deseja remover este usuário?");
  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API_REMOVE}/${cpf}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error("Erro ao remover");
    await carregarClientes();
  } catch (error) {
    console.error(error);
    alert("Não foi possível remover o usuário.");
  }
}

if (fecharUsuario) {
  fecharUsuario.addEventListener("click", () => {
    modalUsuario?.classList.remove("active");
    document.body.classList.remove("modal-open");
  });
}

modalUsuario?.addEventListener("click", (event) => {
  if (event.target === modalUsuario) {
    modalUsuario.classList.remove("active");
    document.body.classList.remove("modal-open");
  }
});

mobileToggle?.addEventListener("click", () => toggleSidebar());
sidebarOverlay?.addEventListener("click", closeSidebar);
refreshButton?.addEventListener("click", carregarClientes);
searchInput?.addEventListener("input", () => {
  renderizarClientes(aplicarFiltroEOrdenacao(clientesCache));
});
sortAccessBtn?.addEventListener("click", () => {
  sortAscending = !sortAscending;
  if (sortDirectionLabel) sortDirectionLabel.textContent = sortAscending ? "↑" : "↓";
  renderizarClientes(aplicarFiltroEOrdenacao(clientesCache));
});

Array.from(document.querySelectorAll(".nav-link")).forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    closeSidebar();
  });
});

carregarClientes();
ModalGuiasAdmin();
//abrirModalUsuario();