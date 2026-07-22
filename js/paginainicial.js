import { PaymentPopUp } from "./popuppayment.js";
import { pagamentoGuiasInss } from "./pagamento-guias.js";
import { Notificacao } from "./Notifacao.js";

const profileName = document.getElementById('person_name');
const profileEmail = document.getElementById('person_email_perfil');
const profileType = document.getElementById('person_tipe_perfil');
const profilePerfilName = document.getElementById('person_name_perfil')
const logoutBtn = document.getElementById('logoutBtn');
const adminLink = document.getElementById('adminLink');
const profileNameCard = document.getElementById("person_name_card")

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  } catch (error) {
    return null;
  }
}

function redirectTo(page) {
  const currentPath = window.location.pathname;
  const basePath = currentPath.replace(/[^/]+$/, '');
  window.location.href = `${basePath}${page}`;
}

function protectPage() {
  const user = getStoredUser();
  if (!user) {
    redirectTo('index.html');
    return false;
  }
  if(profileNameCard) profileNameCard.textContent = user.nome || 'Usuario'
  if(profilePerfilName) profilePerfilName.textContent = user.nome || 'Usuario';
  if (profileName) profileName.textContent = user.nome || 'Usuário';
  if (profileEmail) profileEmail.textContent = user.email || 'Sem e-mail cadastrado';
  if (profileType) {
    profileType.textContent = user.tipo || 'CLIENTE';
    profileType.classList.toggle('admin', user.tipo === 'ADMIN');
  }

  if (adminLink && user.tipo !== 'ADMIN') {
    adminLink.style.display = 'none';
  }

  return true;
}

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('usuario');
  redirectTo('index.html');
});

protectPage();
PaymentPopUp();
pagamentoGuiasInss();
Notificacao();