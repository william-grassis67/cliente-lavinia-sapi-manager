const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileType = document.getElementById('profileType');
const logoutBtn = document.getElementById('logoutBtn');
const adminLink = document.getElementById('adminLink');

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
