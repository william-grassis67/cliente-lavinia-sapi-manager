/**
 * Módulo de Atualização de Dados do Cliente - atualizarDados.js
 * Sistema SAPI
 *
 * Responsável pelo formulário "Atualizar Dados" dentro do modal de detalhes
 * do cliente (prontuário). Usa exatamente os nomes de propriedades
 * retornados pelo backend: nome, email, endereco, cpf, numeroTelefone,
 * tipo, ultimoAcesso. O CPF é somente leitura e não é reenviado.
 */

import { estado, atualizarCliente, obterIdCliente, listarClientes } from "./admin.js";

// ===========================================================
// REFERÊNCIAS DO DOM (LAZY GETTERS)
// ===========================================================
const dom = {
  get form() { return document.getElementById("formAtualizarCliente"); },
  get btnSalvar() { return document.getElementById("btnSalvarDados"); },
  get editNome() { return document.getElementById("editNome"); },
  get editEmail() { return document.getElementById("editEmail"); },
  get editTelefone() { return document.getElementById("editTelefone"); },
  get editEndereco() { return document.getElementById("editEndereco"); },

  // Elementos de leitura do cabeçalho do prontuário, sincronizados após salvar
  get usuarioTitulo() { return document.getElementById("usuarioTitulo"); },
  get usuarioNome() { return document.getElementById("usuarioNome"); },
  get usuarioEmail() { return document.getElementById("usuarioEmail"); },
  get usuarioTelefone() { return document.getElementById("usuarioTelefone"); },
  get usuarioEndereco() { return document.getElementById("usuarioEndereco"); }
};

// ===========================================================
// HELPERS
// ===========================================================
function alternarCarregamento(carregando) {
  const btn = dom.btnSalvar;
  if (!btn) return;

  btn.disabled = carregando;
  btn.innerHTML = carregando
    ? '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...'
    : '<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações';
}

function lerDadosDoFormulario() {
  return {
    nome: dom.editNome?.value.trim() || "",
    email: dom.editEmail?.value.trim() || "",
    numeroTelefone: dom.editTelefone?.value.trim() || "",
    endereco: dom.editEndereco?.value.trim() || ""
  };
}

function sincronizarCabecalho(dadosAtualizados) {
  if (dom.usuarioTitulo) dom.usuarioTitulo.textContent = dadosAtualizados.nome || "-";
  if (dom.usuarioNome) dom.usuarioNome.textContent = dadosAtualizados.nome || "-";
  if (dom.usuarioEmail) dom.usuarioEmail.textContent = dadosAtualizados.email || "-";
  if (dom.usuarioTelefone) dom.usuarioTelefone.textContent = dadosAtualizados.numeroTelefone || "-";
  if (dom.usuarioEndereco) dom.usuarioEndereco.textContent = dadosAtualizados.endereco || "-";
}

// ===========================================================
// SUBMIT DO FORMULÁRIO
// ===========================================================
async function salvarDadosCliente(evento) {
  evento.preventDefault();

  if (!estado.clienteEmDetalhe) {
    alert("Nenhum cliente selecionado para atualização.");
    return;
  }

  const id = obterIdCliente(estado.clienteEmDetalhe);
  if (!id) {
    alert("Não foi possível identificar o cliente para atualização.");
    return;
  }

  const dadosAtualizados = lerDadosDoFormulario();

  if (!dadosAtualizados.nome || !dadosAtualizados.email) {
    alert("Nome e e-mail são obrigatórios.");
    return;
  }

  alternarCarregamento(true);

  try {
    const resposta = await atualizarCliente(id, dadosAtualizados);

    if (resposta !== null) {
      // Mantém o objeto em memória consistente com o que foi salvo
      Object.assign(estado.clienteEmDetalhe, dadosAtualizados);
      sincronizarCabecalho(dadosAtualizados);

      // Atualiza a listagem/tabela em segundo plano, sem fechar o modal
      await listarClientes();

      alert("Dados atualizados com sucesso.");
    }
  } catch (error) {
    console.error("Erro ao atualizar dados do cliente:", error);
    alert(error.message || "Erro ao atualizar dados do cliente.");
  } finally {
    alternarCarregamento(false);
  }
}

// ===========================================================
// INICIALIZAÇÃO DO MÓDULO
// ===========================================================
export function atualizarDados() {
  dom.form?.addEventListener("submit", salvarDadosCliente);
}