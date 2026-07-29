import { PaymentPopUp } from "./popuppayment.js";
import { pagamentoGuiasInss } from "./pagamento-guias.js";
import { Notificacao } from "./Notifacao.js";
import { verifyButton } from "./BotaoPayment.js";
import { ShowGuias } from "./ShowGuais.js";
import { initProcessos } from "./processos.js";

/* ==========================================================================
   CONFIGURAÇÃO DA API & ROTAS DO CLIENTE
   ========================================================================== */
const API_ROUTES = {
    criarGuia: (usuarioId) => `/api/guias/${usuarioId}`,
    confirmarPagamento: (guiaId) => `/api/pagamento/${guiaId}`,
    buscarProcessos: (usuarioId) => `/api/me/processos/${usuarioId}`
};

const FETCH_TIMEOUT_MS = 15000; // 15 segundos de timeout

/* ==========================================================================
   SELETORES DO DOM
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
 * Garante que o container de toasts exista no DOM.
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
 * Retorna o ícone adequado para o tipo de notificação.
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
 * Exibe notificação temporária no padrão window.SapiToast.
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

// Expõe window.SapiToast para consumo global e compatibilidade com scripts legados
window.SapiToast = {
    show: showToast,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    warning: (msg) => showToast(msg, 'warning'),
    info: (msg) => showToast(msg, 'info')
};

/* ==========================================================================
   CENTRALIZADOR DE REQUISIÇÕES HTTP & RETRIES Defensivos
   ========================================================================== */

/**
 * Wrapper centralizado para requisições com timeout e tratamento robusto de erros HTTP/JSON.
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<any>}
 */
async function apiFetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const defaultHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        },
        signal: controller.signal
    };

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (response.status === 401 || response.status === 403) {
            showToast('Sessão expirada ou não autorizada. Faça login novamente.', 'warning');
            handleLogout();
            throw new Error('Acesso não autorizado');
        }

        const contentType = response.headers.get('content-type') || '';
        let data = null;

        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch {
                throw new Error('Resposta do servidor em formato JSON inválido.');
            }
        } else {
            const textData = await response.text();
            data = textData ? { message: textData } : null;
        }

        if (!response.ok) {
            const errorMessage = data?.message || data?.error || `Erro HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('A requisição demorou muito para responder (Timeout).');
        }
        throw error;
    }
}

// Utilitários de API expostos para interações diretas se necessário
window.SapiApi = {
    criarGuia: (usuarioId, payload) => apiFetch(API_ROUTES.criarGuia(usuarioId), {
        method: 'POST',
        body: JSON.stringify(payload)
    }),
    confirmarPagamento: (guiaId, payload) => apiFetch(API_ROUTES.confirmarPagamento(guiaId), {
        method: 'PUT',
        body: JSON.stringify(payload)
    }),
    buscarProcessos: (usuarioId) => apiFetch(API_ROUTES.buscarProcessos(usuarioId), {
        method: 'GET'
    })
};

/* ==========================================================================
   SESSÃO & AUTENTICAÇÃO
   ========================================================================== */

/**
 * Valida a sessão e retorna os dados do usuário.
 * @returns {Object|null}
 */
function getStoredUser() {
    try {
        const data = localStorage.getItem('usuario');
        if (!data) return null;

        const user = JSON.parse(data);

        if (typeof user !== 'object' || user === null || !user.id) {
            return null;
        }

        return user;
    } catch (error) {
        console.error('[paginainicial] Erro ao analisar sessão do usuário:', error);
        return null;
    }
}

/**
 * Redireciona a navegação de forma segura.
 * @param {string} page
 */
function redirectTo(page) {
    window.location.href = page;
}

/**
 * Encerra a sessão e apaga dados locais.
 */
function handleLogout() {
    try {
        localStorage.removeItem('usuario');
        sessionStorage.clear();
    } catch (error) {
        console.error('[paginainicial] Erro ao desconectar:', error);
    } finally {
        redirectTo('index.html');
    }
}

/**
 * Manipulador do evento de clique no botão de logout.
 * @param {MouseEvent} event
 */
function handleLogoutClick(event) {
    event.preventDefault();
    if (window.confirm('Tem certeza que deseja sair da sua conta?')) {
        handleLogout();
    }
}

/* ==========================================================================
   INTERFACE E DOM (UI)
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
 * Extrai as iniciais do nome.
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
 * Atualiza o avatar e as iniciais.
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
 * Atualiza os campos de nome na interface.
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
 * Preenche o perfil do usuário.
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
 * Renderiza todos os dados do usuário.
 * @param {Object} user
 */
function renderUserData(user) {
    updateUserNameUI(user.nome);
    updateUserProfileUI(user);
}

/**
 * Define a competência atual por padrão (mês/ano).
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
   INICIALIZAÇÃO E INTEGRAÇÃO DOS MÓDULOS
   ========================================================================== */

/**
 * Configura os escutadores de eventos básicos.
 */
function setupEventListeners() {
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', handleLogoutClick);
    }
}

/**
 * Inicializa com segurança cada um dos módulos importados com as novas rotas.
 * @param {Object} user
 */
function initModules(user) {
    const userId = user.id;

    const modules = [
        { name: 'PaymentPopUp', fn: () => PaymentPopUp?.() },
        { name: 'pagamentoGuiasInss', fn: () => pagamentoGuiasInss?.(userId) },
        { name: 'Notificacao', fn: () => Notificacao?.(userId) },
        { name: 'verifyButton', fn: () => verifyButton?.() },
        { name: 'ShowGuias', fn: () => ShowGuias?.(userId) },
        { name: 'initProcessos', fn: () => initProcessos?.(userId) }
    ];

    modules.forEach(({ name, fn }) => {
        try {
            fn();
        } catch (error) {
            console.error(`[paginainicial] Erro ao inicializar o módulo "${name}":`, error);
        }
    });
}

/**
 * Ponto de entrada da aplicação.
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
        console.error('[paginainicial] Erro na inicialização do script:', error);
        showToast('Ocorreu um erro ao carregar seus dados na página.', 'error');
    }
}

// Dispara a inicialização após o DOM estar totalmente pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}