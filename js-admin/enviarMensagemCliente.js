/**
 * Módulo Autônomo de Envio de Mensagens via WhatsApp
 * Arquivo: enviarMensagemCliente.js
 */

// ===========================================================
// 1. ESTADO INTERNO DO MÓDULO
// ===========================================================
let clienteAtual = null;

// ===========================================================
// 2. NOTIFICAÇÕES (FEEDBACK VISUAL INTERNO)
// ===========================================================
function mostrarNotificacao(mensagem, tipo = "sucesso") {
  const notificacaoExistente = document.getElementById("notificacao-custom-wa");
  if (notificacaoExistente) {
    notificacaoExistente.remove();
  }

  const div = document.createElement("div");
  div.id = "notificacao-custom-wa";
  div.innerText = mensagem;

  Object.assign(div.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "bold",
    zIndex: "99999",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    backgroundColor: tipo === "sucesso" ? "#28a745" : "#dc3545",
    transition: "opacity 0.3s ease"
  });

  document.body.appendChild(div);

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 300);
  }, 3500);
}

// ===========================================================
// 3. TRATAMENTO E VALIDAÇÃO DE TELEFONE
// ===========================================================
function obterTelefoneCliente(cliente) {
  if (!cliente || typeof cliente !== "object") {
    throw new Error("Dados do cliente inválidos ou ausentes.");
  }

  const telefone =
    cliente.telefone ||
    cliente.celular ||
    cliente.whatsapp ||
    cliente.phone ||
    cliente.numeroTelefone;

  if (!telefone) {
    throw new Error("Nenhum telefone encontrado para este cliente.");
  }

  return String(telefone);
}

function formatarTelefoneBrasil(telefoneBruto) {
  let apenasNumeros = telefoneBruto.replace(/\D/g, "");

  if (!apenasNumeros) {
    throw new Error("O número de telefone informado é inválido.");
  }

  // Adiciona código do país (55) se for um número com DDD (10 ou 11 dígitos)
  if (apenasNumeros.length === 10 || apenasNumeros.length === 11) {
    apenasNumeros = "55" + apenasNumeros;
  }

  // Valida tamanho padrão brasileiro com DDI + DDD + número (12 ou 13 dígitos)
  if (apenasNumeros.length < 12 || apenasNumeros.length > 13) {
    throw new Error("Número de telefone fora do padrão aceito (DDD + Número).");
  }

  return apenasNumeros;
}

// ===========================================================
// 4. LÓGICA DO WHATSAPP
// ===========================================================
function enviarWhatsApp(cliente, mensagem) {
  const mensagemTratada = mensagem ? mensagem.trim() : "";

  if (!mensagemTratada) {
    throw new Error("Por favor, digite uma mensagem antes de enviar.");
  }

  const telefoneBruto = obterTelefoneCliente(cliente);
  const telefoneFormatado = formatarTelefoneBrasil(telefoneBruto);

  const mensagemCodificada = encodeURIComponent(mensagemTratada);
  const urlWhatsapp = `https://wa.me/${telefoneFormatado}?text=${mensagemCodificada}`;

  window.open(urlWhatsapp, "_blank");
}

// ===========================================================
// 5. CONTROLE DO MODAL
// ===========================================================
export function fecharModalMensagem() {
  const modal = document.getElementById("modal_mensagem");
  const textarea = document.getElementById("mensagem_cliente");

  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("show");
  }

  if (textarea) {
    textarea.value = "";
  }

  clienteAtual = null;
}

export function abrirModalMensagemCliente(cliente) {
  try {
    // Validação preventiva do telefone antes de exibir o modal
    const telBruto = obterTelefoneCliente(cliente);
    formatarTelefoneBrasil(telBruto);

    clienteAtual = cliente;

    const modal = document.getElementById("modal_mensagem");
    if (!modal) {
      throw new Error("Elemento do modal ('modal_mensagem') não foi encontrado no DOM.");
    }

    const textarea = document.getElementById("mensagem_cliente");
    if (textarea) {
      textarea.value = "";
    }

    const elNomeCliente = document.getElementById("nome_cliente_modal");
    if (elNomeCliente) {
      elNomeCliente.innerText = cliente.nome || cliente.name || "Cliente";
    }

    modal.style.display = "block";
    modal.classList.add("show");

    configurarEventos();
  } catch (erro) {
    mostrarNotificacao(erro.message, "erro");
  }
}

// ===========================================================
// 6. GERENCIAMENTO DE EVENTOS (SEM CLONENODE / SEM DUPLICAÇÃO)
// ===========================================================
function processarEnvio() {
  try {
    if (!clienteAtual) {
      throw new Error("Nenhum cliente selecionado.");
    }

    const textarea = document.getElementById("mensagem_cliente");
    const mensagem = textarea ? textarea.value : "";

    enviarWhatsApp(clienteAtual, mensagem);

    mostrarNotificacao("Redirecionando para o WhatsApp...", "sucesso");
    fecharModalMensagem();
  } catch (erro) {
    mostrarNotificacao(erro.message, "erro");
  }
}

// CORREÇÃO: antes, uma flag única do módulo (`eventosInicializados`) era
// marcada como `true` na primeira chamada, mesmo que os botões não
// tivessem sido encontrados no DOM naquele momento (ex.: modal ainda não
// montado). Isso fazia os cliques em "Enviar"/"Fechar" nunca mais serem
// vinculados em aberturas futuras do modal. Agora a marca de "já
// vinculado" fica no próprio elemento (dataset), então, se um botão não
// existir na primeira tentativa, a próxima chamada tenta vincular de
// novo normalmente — e nunca duplica o listener quando ele já existe.
function configurarEventos() {
  const btnEnviar = document.getElementById("btn_send_message");
  const btnFechar = document.getElementById("btn_close_send");

  if (btnEnviar && !btnEnviar.dataset.mensagemListenerAttached) {
    btnEnviar.addEventListener("click", processarEnvio);
    btnEnviar.dataset.mensagemListenerAttached = "true";
  }

  if (btnFechar && !btnFechar.dataset.mensagemListenerAttached) {
    btnFechar.addEventListener("click", fecharModalMensagem);
    btnFechar.dataset.mensagemListenerAttached = "true";
  }
}