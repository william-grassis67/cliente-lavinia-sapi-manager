import { PaymentPopUp } from "./popuppayment.js";
import { pagamentoGuiasInss } from "./pagamento-guias.js";
import { Notificacao } from "./Notifacao.js";
import { verifyButton } from "./BotaoPayment.js";
import { ShowGuias } from "./ShowGuais.js";

/* ==========================================================================
   CONFIGURAÇÃO & SELETORES DO DOM
   ========================================================================== */
const DOM = {
    profileName: document.getElementById('person_name'),
    profileEmail: document.getElementById('person_email_perfil'),
    profileType: document.getElementById('person_tipe_perfil'),
    profilePerfilName: document.getElementById('person_name_perfil'),
    profileNameCard: document.getElementById("person_name_card"),
    userDateLastTime: document.getElementById("userDateLastTime"),
    logoutBtn: document.getElementById('logoutBtn'),
    adminLink: document.getElementById('adminLink')
};

/* ==========================================================================
   SESSÃO & AUTENTICAÇÃO
   ========================================================================== */

/**
 * Busca e valida o objeto do usuário gravado no localStorage.
 * @returns {Object|null} Retorna o usuário válido ou null.
 */
function getStoredUser() {
    try {
        const data = localStorage.getItem('usuario');
        if (!data) return null;

        const user = JSON.parse(data);

        // Validação defensiva do objeto retornado
        if (typeof user !== 'object' || user === null || !user.id) {
            return null;
        }

        return user;
    } catch (error) {
        return null;
    }
}

/**
 * Realiza o redirecionamento de navegação de forma segura.
 * @param {string} page 
 */
function redirectTo(page) {
    window.location.href = page;
}

/**
 * Executa o encerramento da sessão do usuário.
 */
function handleLogout() {
    try {
        localStorage.removeItem('usuario');
        sessionStorage.clear();
    } finally {
        redirectTo('index.html');
    }
}

/* ==========================================================================
   ATUALIZAÇÃO DA INTERFACE (UI)
   ========================================================================== */

/**
 * Formata a data de último acesso do usuário.
 * @param {string|Date} dateString 
 * @returns {string}
 */
function formatLastAccessDate(dateString) {
    if (!dateString) return 'Nunca entrou';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';

        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Data inválida';
    }
}

/**
 * Atualiza o nome do usuário nos diferentes locais da UI.
 * @param {string} name 
 */
function updateUserNameUI(name) {
    const displayName = name || 'Usuário';
    const elements = [DOM.profileNameCard, DOM.profilePerfilName, DOM.profileName];

    elements.forEach(element => {
        if (element) element.textContent = displayName;
    });
}

/**
 * Atualiza as informações detalhadas do perfil.
 * @param {Object} user 
 */
function updateUserProfileUI(user) {
    if (DOM.profileEmail) {
        DOM.profileEmail.textContent = user.email || 'Sem e-mail cadastrado';
    }

    if (DOM.userDateLastTime) {
        DOM.userDateLastTime.textContent = formatLastAccessDate(user.ultimoAcesso);
    }

    if (DOM.profileType) {
        const userType = (user.tipo || 'CLIENTE').toUpperCase();
        DOM.profileType.textContent = userType;
        DOM.profileType.classList.toggle('admin', userType === 'ADMIN');
    }

    if (DOM.adminLink) {
        const isAdmin = (user.tipo || '').toUpperCase() === 'ADMIN';
        DOM.adminLink.style.display = isAdmin ? '' : 'none';
    }
}

/**
 * Renderiza todos os dados do usuário na interface.
 * @param {Object} user 
 */
function renderUserData(user) {
    updateUserNameUI(user.nome);
    updateUserProfileUI(user);
}

/* ==========================================================================
   INICIALIZAÇÃO DE MÓDULOS E EVENTOS
   ========================================================================== */

/**
 * Registra ouvintes de eventos da página.
 */
function setupEventListeners() {
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            handleLogout();
        });
    }
}

/**
 * Inicializa os módulos externos integrados.
 * @param {Object} user 
 */
function initModules(user) {
    const modules = [
        { name: 'PaymentPopUp', fn: () => PaymentPopUp?.() },
        { name: 'pagamentoGuiasInss', fn: () => pagamentoGuiasInss?.() },
        { name: 'Notificacao', fn: () => Notificacao?.() },
        { name: 'verifyButton', fn: () => verifyButton?.() },
        { name: 'ShowGuias', fn: () => ShowGuias?.(user.id) }
    ];

    modules.forEach(({ name, fn }) => {
        try {
            fn();
        } catch (error) {
            // Trata falhas sem derrubar os demais módulos
        }
    });
}

/**
 * Ponto de entrada principal da página inicial.
 */
function init() {
    const user = getStoredUser();

    if (!user) {
        handleLogout();
        return;
    }

    renderUserData(user);
    setupEventListeners();
    initModules(user);
}

// Inicia a aplicação
init();