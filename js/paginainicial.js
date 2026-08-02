import { PaymentPopUp } from "./popuppayment.js";
import { pagamentoGuiasInss } from "./pagamento-guias.js";
import { Notificacao } from "./Notifacao.js";
import { verifyButton } from "./BotaoPayment.js";
import { initProcessos } from "./processos.js";
import { ShowGuias, buttonverGuiasPagas } from "./ShowGuais.js";

const API_BASE_URL = 'https://apiadministrativa.onrender.com';

const API_ROUTES = {
    criarGuia: (usuarioId) => `${API_BASE_URL}/api/cliente/pagamento/${usuarioId}`,
    confirmarPagamento: (guiaId) => `${API_BASE_URL}/api/cliente/pagamento/${guiaId}`,
    buscarProcessos: (usuarioId) => `${API_BASE_URL}/api/cliente/processos/${usuarioId}`
};

const FETCH_TIMEOUT_MS = 15000;
const TOAST_DURATION_MS = 4500;

const DOM = {
    profileName: document.getElementById('person_name'),
    profileEmail: document.getElementById('person_email_perfil'),
    profileType: document.getElementById('person_tipe_perfil'),
    profilePerfilName: document.getElementById('person_name_perfil'),
    profileNameCard: document.getElementById('person_name_card'),
    userDateLastTime: document.getElementById('userDateLastTime'),
    logoutBtn: document.getElementById('logoutBtn'),
    adminLink: document.getElementById('adminLink'),
    avatar: document.getElementById('profileAvatar'),
    avatarInitials: document.getElementById('avatarInitials'),
    competenciaInput: document.getElementById('competencia'),
    dateCompetenciaSpan: document.getElementById('date_competencia'),
    toastContainer: document.getElementById('toastContainer'),
    topbarTitle: document.getElementById('topbarTitle')
};

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

function iconForToastType(type) {
    switch (type) {
        case 'success': return 'fa-circle-check';
        case 'error': return 'fa-circle-exclamation';
        case 'warning': return 'fa-triangle-exclamation';
        default: return 'fa-circle-info';
    }
}

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

async function apiFetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const user = getStoredUser();
    const defaultHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
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

window.SapiApi = {
    criarGuia: (usuarioId, payload) => apiFetch(API_ROUTES.criarGuia(usuarioId), {
        method: 'PUT',
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

function redirectTo(page) {
    window.location.href = page;
}

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

function handleLogoutClick(event) {
    event.preventDefault();
    if (window.confirm('Tem certeza que deseja sair da sua conta?')) {
        handleLogout();
    }
}

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

function getInitials(name) {
    if (!name || typeof name !== 'string') return '';

    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';

    const first = parts[0][0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

    return (first + last).toUpperCase();
}

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

function updateUserNameUI(name) {
    const displayName = name || 'Usuário';
    const elements = [DOM.profileNameCard, DOM.profilePerfilName, DOM.profileName];

    elements.forEach((element) => {
        if (element) element.textContent = displayName;
    });

    updateAvatarUI(name);
}

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

function renderUserData(user) {
    updateUserNameUI(user.nome);
    updateUserProfileUI(user);

    const cpfElement = document.getElementById('person_cpf_perfil');
    const cadastroElement = document.getElementById('person_data_cadastro_perfil');
    const statusElement = document.getElementById('person_status_perfil');

    if (cpfElement) {
        cpfElement.textContent = user.cpf || 'Não disponível';
    }

    if (cadastroElement) {
        cadastroElement.textContent = user.dataCadastro
            ? new Date(user.dataCadastro).toLocaleDateString('pt-BR')
            : 'Não disponível';
    }

    if (statusElement) {
        const isActive = user.status ? user.status.toLowerCase() === 'ativo' : true;
        statusElement.textContent = isActive ? 'Ativa' : 'Inativa';
        statusElement.classList.toggle('active', isActive);
        statusElement.classList.toggle('pending', !isActive);
    }
}

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

function activateSection(sectionId) {
    const section = document.getElementById(`section-${sectionId}`);
    if (!section) return;

    document.querySelectorAll('.page-section').forEach((item) => {
        item.classList.toggle('is-active', item.id === section.id);
    });

    document.querySelectorAll('.sidebar-link[data-target], .mobile-nav-link[data-target]').forEach((link) => {
        link.classList.toggle('is-active', link.dataset.target === sectionId);
    });

    if (DOM.topbarTitle) {
        const labels = {
            dashboard: 'Dashboard',
            perfil: 'Meu Perfil',
            processos: 'Processos',
            guias: 'Guias INSS',
            historico: 'Histórico',
            configuracoes: 'Configurações'
        };
        DOM.topbarTitle.textContent = labels[sectionId] || 'Dashboard';
    }

    closeMobileMenu();
}

function openMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    document.documentElement.classList.add('no-scroll');
    if (overlay) {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    }
}

function closeMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    document.documentElement.classList.remove('no-scroll');
    if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

function setupSectionNavigation() {
    document.querySelectorAll('.sidebar-link[data-target], .mobile-nav-link[data-target]').forEach((button) => {
        button.addEventListener('click', () => activateSection(button.dataset.target));
    });

    document.querySelectorAll('.settings-btn').forEach((button) => {
        button.addEventListener('click', () => {
            if (button.dataset.setting) {
                showToast('Preferência aplicada com sucesso.', 'success');
            }
        });
    });

    document.querySelectorAll('[data-nav-action]').forEach((button) => {
        button.addEventListener('click', () => activateSection(button.dataset.navAction));
    });

    const menuToggle = document.getElementById('mobileMenuToggle');
    const menuClose = document.getElementById('mobileMenuClose');

    if (menuToggle) {
        menuToggle.addEventListener('click', openMobileMenu);
    }

    if (menuClose) {
        menuClose.addEventListener('click', closeMobileMenu);
    }
}

function getStoredPreferences() {
    try {
        const data = localStorage.getItem('sapi-preferences');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('[paginainicial] Erro ao ler preferências:', error);
        return {};
    }
}

function savePreferences(preferences) {
    try {
        localStorage.setItem('sapi-preferences', JSON.stringify(preferences));
    } catch (error) {
        console.error('[paginainicial] Erro ao salvar preferências:', error);
    }
}

function applyPreference(setting, value) {
    const root = document.documentElement;
    const preferences = getStoredPreferences();

    switch (setting) {
        case 'theme':
            if (value === 'auto') {
                root.removeAttribute('data-theme');
            } else {
                root.setAttribute('data-theme', value);
            }
            break;
        case 'color':
            root.setAttribute('data-color', value);
            break;
        case 'density':
            root.classList.remove('density-compact', 'density-standard', 'density-comfortable');
            root.classList.add(`density-${value}`);
            break;
        case 'fontSize':
            root.classList.remove('font-small', 'font-medium', 'font-large');
            root.classList.add(`font-${value}`);
            break;
        case 'borderStyle':
            root.classList.remove('border-soft', 'border-rounded');
            root.classList.add(value === 'rounded' ? 'border-rounded' : 'border-soft');
            break;
        default:
            break;
    }

    preferences[setting] = value;
    savePreferences(preferences);
}

function applyStoredPreferences() {
    const preferences = getStoredPreferences();
    const defaultPreferences = {
        theme: 'auto',
        color: 'blue',
        density: 'standard',
        fontSize: 'medium',
        borderStyle: 'soft'
    };

    const finalPrefs = { ...defaultPreferences, ...preferences };

    Object.entries(finalPrefs).forEach(([setting, value]) => applyPreference(setting, value));

    document.querySelectorAll('[data-setting]').forEach((button) => {
        const setting = button.dataset.setting;
        const value = button.dataset.value;
        button.classList.toggle('is-active', finalPrefs[setting] === value);
    });
}

function setupThemeControls() {
    document.querySelectorAll('[data-setting]').forEach((button) => {
        button.addEventListener('click', () => {
            const setting = button.dataset.setting;
            const value = button.dataset.value;
            applyPreference(setting, value);

            document.querySelectorAll(`[data-setting="${setting}"]`).forEach((item) => {
                item.classList.toggle('is-active', item.dataset.value === value);
            });
        });
    });
}

function setupEventListeners() {
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', handleLogoutClick);
    }
}

function initModules(user) {
    const userId = user.id;

    const modules = [
        { name: 'PaymentPopUp', fn: () => PaymentPopUp?.() },
        { name: 'pagamentoGuiasInss', fn: () => pagamentoGuiasInss?.(userId) },
        { name: 'Notificacao', fn: () => Notificacao?.(userId) },
        { name: 'verifyButton', fn: () => verifyButton?.() },
        { name: 'ShowGuias', fn: () => ShowGuias?.(userId) },
        { name: 'initProcessos', fn: () => initProcessos?.(userId) },
        { name: 'buttonverGuiasPagas', fn: () => buttonverGuiasPagas?.() }
    ];

    modules.forEach(({ name, fn }) => {
        try {
            fn();
        } catch (error) {
            console.error(`[paginainicial] Erro ao inicializar o módulo "${name}":`, error);
        }
    });

    setupSectionNavigation();
    applyStoredPreferences();
    setupThemeControls();
}

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
