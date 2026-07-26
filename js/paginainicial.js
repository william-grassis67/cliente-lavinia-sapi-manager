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
    adminLink: document.getElementById('adminLink'),
    avatar: document.getElementById('profileAvatar'),
    avatarInitials: document.getElementById('avatarInitials'),
    competenciaInput: document.getElementById('competencia'),
    dateCompetenciaSpan: document.getElementById('date_competencia'),
    toastContainer: document.getElementById('toastContainer')
};

const TOAST_DURATION_MS = 4500;

/* ==========================================================================
   FEEDBACK VISUAL (TOASTS)
   ========================================================================== */

/**
 * Garante que o container de toasts exista no DOM, criando-o se necessário.
 * @returns {HTMLElement}
 */
function ensureToastContainer() {
    if (DOM.toastContainer && document.body.contains(DOM.toastContainer)) {
        return DOM.toastContainer;
    }

    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    DOM.toastContainer = container;
    return container;
}

/**
 * Retorna o ícone adequado para cada tipo de notificação.
 * @param {'info'|'success'|'error'|'warning'} type
 */
function iconForToastType(type) {
    switch (type) {
        case 'success': return 'fa-circle-check';
        case 'error': return 'fa-circle-exclamation';
        case 'warning': return 'fa-triangle-exclamation';
        default: return 'fa-circle-info';
    }
}

/**
 * Exibe uma notificação temporária e amigável para o usuário.
 * Disponível globalmente como window.SapiToast para os demais módulos.
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} [type]
 */
function showToast(message, type = 'info') {
    if (!message) return;

    const container = ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    const icon = document.createElement('i');
    icon.className = `fa-solid ${iconForToastType(type)}`;

    const text = document.createElement('span');
    text.textContent = message;

    toast.append(icon, text);
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, TOAST_DURATION_MS);
}

window.SapiToast = {
    show: showToast,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    warning: (msg) => showToast(msg, 'warning'),
    info: (msg) => showToast(msg, 'info')
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
        console.error('[paginainicial] Não foi possível ler os dados de sessão:', error);
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
    } catch (error) {
        console.error('[paginainicial] Erro ao limpar dados de sessão:', error);
    } finally {
        redirectTo('index.html');
    }
}

/**
 * Confirma com o usuário antes de encerrar a sessão.
 * @param {MouseEvent} event
 */
function handleLogoutClick(event) {
    event.preventDefault();

    const confirmado = window.confirm('Tem certeza que deseja sair da sua conta?');
    if (confirmado) {
        handleLogout();
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
 * Extrai as iniciais do nome do usuário (ex: "William Gabriel" -> "WG").
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return '';

    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';

    const first = parts[0][0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

    return (first + last).toUpperCase();
}

/**
 * Atualiza o avatar do perfil com as iniciais do usuário, quando possível.
 * @param {string} name
 */
function updateAvatarUI(name) {
    if (!DOM.avatar || !DOM.avatarInitials) return;

    const initials = getInitials(name);

    if (initials) {
        DOM.avatarInitials.textContent = initials;
        DOM.avatar.classList.add('has-initials');
    } else {
        DOM.avatarInitials.textContent = '';
        DOM.avatar.classList.remove('has-initials');
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

    updateAvatarUI(name);
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

/**
 * Preenche a competência atual (mês/ano) no formulário de pagamento e no resumo,
 * evitando duplicar essa lógica em um script inline no HTML.
 */
function setDefaultCompetenciaAtual() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const competenciaAtual = `${mes}/${ano}`;

    if (DOM.competenciaInput) {
        DOM.competenciaInput.value = competenciaAtual;
    }

    if (DOM.dateCompetenciaSpan) {
        DOM.dateCompetenciaSpan.textContent = competenciaAtual;
    }
}

/* ==========================================================================
   INICIALIZAÇÃO DE MÓDULOS E EVENTOS
   ========================================================================== */

/**
 * Registra ouvintes de eventos da página.
 */
function setupEventListeners() {
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', handleLogoutClick);
    }
}

/**
 * Inicializa os módulos externos integrados.
 * Cada módulo é isolado para que a falha de um não derrube os demais.
 * @param {Object} user
 */
function initModules(user) {
    const modules = [
        { name: 'PaymentPopUp', fn: () => PaymentPopUp?.(), critical: false },
        { name: 'pagamentoGuiasInss', fn: () => pagamentoGuiasInss?.(), critical: false },
        { name: 'Notificacao', fn: () => Notificacao?.(), critical: false },
        { name: 'verifyButton', fn: () => verifyButton?.(), critical: false },
        { name: 'ShowGuias', fn: () => ShowGuias?.(user.id), critical: true }
    ];

    modules.forEach(({ name, fn, critical }) => {
        try {
            fn();
        } catch (error) {
            console.error(`[paginainicial] Falha ao iniciar o módulo "${name}":`, error);

            if (critical) {
                showToast(
                    'Não foi possível carregar suas guias no momento. Tente atualizar a página.',
                    'error'
                );
            }
        }
    });
}

/**
 * Ponto de entrada principal da página inicial.
 */
function init() {
    try {
        setDefaultCompetenciaAtual();

        const user = getStoredUser();

        if (!user) {
            handleLogout();
            return;
        }

        renderUserData(user);
        setupEventListeners();
        initModules(user);
    } catch (error) {
        console.error('[paginainicial] Erro inesperado ao inicializar a página:', error);
        showToast('Ocorreu um erro ao carregar a página. Tente recarregar.', 'error');
    }
}

// Inicia a aplicação assim que o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}