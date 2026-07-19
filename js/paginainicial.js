/**
 * paginainicial.js
 * ---------------------------------------------------------------------------
 * Lógica da página inicial do SAPI: autenticação local (protectPage),
 * preenchimento dos dados do usuário na UI, tema claro/escuro, sidebar
 * retrátil e toggles de status (Pago/Pendente).
 *
 * Mesma API pública/IDs do arquivo original — nenhum comportamento visível
 * foi removido. Melhorias aplicadas:
 *   - localStorage acessado com segurança (leitura E escrita protegidas).
 *   - Constantes centralizadas (sem "magic strings" espalhados).
 *   - Acessibilidade: aria-pressed/aria-expanded/aria-label sincronizados.
 *   - JSDoc em todas as funções.
 *   - Estado inicial dos botões de status sincronizado com aria-pressed.
 *   - Persistência opcional do estado da sidebar (não quebra nada se a
 *     sidebar não existir na página).
 *   - Logout usa location.replace para não deixar a página protegida no
 *     histórico do navegador.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  /* =========================================================
     CONSTANTES
     ========================================================= */
  const STORAGE_KEYS = {
    USER: "usuario",
    THEME: "appTheme",
    SIDEBAR_COLLAPSED: "sidebarCollapsed",
  };

  const THEMES = { LIGHT: "light", DARK: "dark" };

  const DEFAULT_USER = {
    nome: "Maria Silva",
    tipo: "CLIENTE",
    email: "maria.silva@email.com",
    cpf: "123.456.789-00",
    telefone: "(11) 99999-0000",
  };

  const LOGIN_PAGE = "index.html";

  /* =========================================================
     REFERÊNCIAS DE DOM
     (mesmos IDs do arquivo original — nada foi renomeado)
     ========================================================= */
  const dom = {
    profileName: document.getElementById("profileName"),
    profileEmail: document.getElementById("profileEmail"),
    profileType: document.getElementById("profileType"),
    profileTag: document.getElementById("profileTag"),
    welcomeTitle: document.getElementById("welcomeTitle"),
    accountName: document.getElementById("accountName"),
    accountEmail: document.getElementById("accountEmail"),
    accountCpf: document.getElementById("accountCpf"),
    accountType: document.getElementById("accountType"),
    accountNameValue: document.getElementById("accountNameValue"),
    accountEmailValue: document.getElementById("accountEmailValue"),
    accountPhone: document.getElementById("accountPhone"),
    logoutBtn: document.getElementById("logoutBtn"),
    adminLink: document.getElementById("adminLink"),
    themeSelect: document.getElementById("themeSelect"),
    themeToggleButton: document.getElementById("themeToggleButton"),
    sidebar: document.getElementById("sidebar"),
    sidebarCollapseBtn: document.getElementById("sidebarCollapseBtn"),
    sidebarToggleMobile: document.getElementById("sidebarToggleMobile"),
  };

  const statusButtons = document.querySelectorAll("[data-status-toggle]");

  /* =========================================================
     UTILITÁRIOS DE STORAGE (leitura e escrita seguras)
     ========================================================= */

  /**
   * Lê e faz parse de um JSON do localStorage.
   * @param {string} key
   * @returns {any|null} valor desserializado, ou null em caso de erro/ausência
   */
  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`[paginainicial] Falha ao ler "${key}" do localStorage:`, error);
      return null;
    }
  }

  /**
   * Lê uma string simples do localStorage.
   * @param {string} key
   * @param {string} [fallback]
   * @returns {string}
   */
  function readString(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (error) {
      console.warn(`[paginainicial] Falha ao ler "${key}" do localStorage:`, error);
      return fallback;
    }
  }

  /**
   * Escreve um valor no localStorage sem lançar exceção (ex.: modo privado
   * do navegador, quota excedida, etc.).
   * @param {string} key
   * @param {string} value
   */
  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[paginainicial] Falha ao gravar "${key}" no localStorage:`, error);
    }
  }

  /**
   * Remove uma chave do localStorage sem lançar exceção.
   * @param {string} key
   */
  function clearStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[paginainicial] Falha ao remover "${key}" do localStorage:`, error);
    }
  }

  function getStoredUser() {
    return readJSON(STORAGE_KEYS.USER);
  }

  /* =========================================================
     NAVEGAÇÃO
     ========================================================= */

  /**
   * Monta a URL de outra página do sistema a partir do diretório atual
   * e navega até ela.
   * @param {string} page - nome do arquivo de destino (ex.: "index.html")
   * @param {{replace?: boolean}} [options] - use replace:true para não
   *   manter a página atual no histórico (útil em logout/redirecionamentos
   *   de proteção de rota).
   */
  function redirectTo(page, options) {
    const currentPath = window.location.pathname;
    const basePath = currentPath.replace(/[^/]+$/, "");
    const target = `${basePath}${page}`;
    if (options && options.replace) {
      window.location.replace(target);
    } else {
      window.location.href = target;
    }
  }

  /* =========================================================
     TEMA (claro/escuro)
     ========================================================= */

  /**
   * Garante que o valor de tema seja sempre 'light' ou 'dark'.
   * @param {string} theme
   * @returns {'light'|'dark'}
   */
  function normalizeTheme(theme) {
    return theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  }

  /**
   * Aplica o tema no <body>, sincroniza o <select> de preferências e
   * atualiza o rótulo/ícone do botão de alternância rápida na topbar.
   * @param {string} theme
   */
  function applyTheme(theme) {
    const selectedTheme = normalizeTheme(theme);
    document.body.dataset.theme = selectedTheme;

    if (dom.themeSelect) dom.themeSelect.value = selectedTheme;

    if (dom.themeToggleButton) {
      const isDark = selectedTheme === THEMES.DARK;
      const icon = dom.themeToggleButton.querySelector("i");
      if (icon) icon.className = isDark ? "fa-solid fa-moon" : "fa-solid fa-sun";
      const label = dom.themeToggleButton.querySelector("[data-theme-label]");
      const labelText = isDark ? "Escuro" : "Claro";
      if (label) {
        label.textContent = labelText;
      } else {
        dom.themeToggleButton.innerHTML = `${icon ? icon.outerHTML : '<i class="fa-solid fa-sun"></i>'} ${labelText}`;
      }
      dom.themeToggleButton.setAttribute("aria-pressed", String(isDark));
      dom.themeToggleButton.setAttribute("aria-label", `Tema atual: ${labelText}. Clique para alternar.`);
    }
  }

  function setTheme(theme) {
    const selectedTheme = normalizeTheme(theme);
    writeStorage(STORAGE_KEYS.THEME, selectedTheme);
    applyTheme(selectedTheme);
  }

  /* =========================================================
     SIDEBAR
     ========================================================= */

  /**
   * Alterna (ou força) o estado "collapsed" da sidebar e mantém os
   * atributos de acessibilidade dos botões de controle sincronizados.
   * @param {boolean} [force] - true força colapsada, false força expandida,
   *   omitido faz o toggle do estado atual.
   */
  function toggleSidebar(force) {
    if (!dom.sidebar) return;
    const shouldCollapse =
      typeof force === "boolean" ? force : !dom.sidebar.classList.contains("collapsed");

    dom.sidebar.classList.toggle("collapsed", shouldCollapse);
    writeStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(shouldCollapse));

    [dom.sidebarCollapseBtn, dom.sidebarToggleMobile].forEach((btn) => {
      if (!btn) return;
      btn.setAttribute("aria-expanded", String(!shouldCollapse));
    });
  }

  /**
   * Restaura o estado da sidebar salvo anteriormente (se houver).
   * Não altera nada caso a preferência nunca tenha sido salva, preservando
   * o estado padrão definido no HTML/CSS.
   */
  function restoreSidebarState() {
    if (!dom.sidebar) return;
    const stored = readString(STORAGE_KEYS.SIDEBAR_COLLAPSED, null);
    if (stored === null) return;
    toggleSidebar(stored === "true");
  }

  /* =========================================================
     BOTÕES DE STATUS (Pago / Pendente)
     ========================================================= */

  /**
   * Sincroniza texto e aria-pressed de um botão de status com sua classe
   * "is-paid" atual.
   * @param {HTMLElement} button
   */
  function syncStatusButton(button) {
    const isPaid = button.classList.contains("is-paid");
    button.textContent = isPaid ? "Pago" : "Pendente";
    button.setAttribute("aria-pressed", String(isPaid));
    // Guarda o estado em dataset para facilitar leitura futura pelo backend.
    button.dataset.status = isPaid ? "pago" : "pendente";
  }

  function handleStatusToggleClick(event) {
    const button = event.currentTarget;
    button.classList.toggle("is-paid");
    syncStatusButton(button);
  }

  /* =========================================================
     PREENCHIMENTO DA UI COM OS DADOS DO USUÁRIO
     ========================================================= */

  /**
   * Escreve um texto em um elemento, ignorando silenciosamente se o
   * elemento não existir nesta página (nem toda tela usa todos os campos).
   * @param {HTMLElement|null} el
   * @param {string} value
   */
  function setText(el, value) {
    if (el) el.textContent = value;
  }

  /**
   * Preenche todos os campos de perfil/conta na página com os dados do
   * usuário autenticado, aplicando os valores padrão quando ausentes.
   * @param {object} user
   */
  function fillUserData(user) {
    const displayName = user.nome || DEFAULT_USER.nome;
    const displayType = user.tipo || DEFAULT_USER.tipo;
    const displayEmail = user.email || DEFAULT_USER.email;
    const displayCpf = user.cpf || DEFAULT_USER.cpf;
    const displayPhone = user.telefone || DEFAULT_USER.telefone;

    setText(dom.profileName, displayName);
    setText(dom.profileEmail, displayEmail);
    setText(dom.profileType, displayType);
    setText(dom.profileTag, displayType);
    setText(dom.welcomeTitle, `Bem-vindo, ${displayName}`);
    setText(dom.accountName, displayName);
    setText(dom.accountEmail, displayEmail);
    setText(dom.accountNameValue, displayName);
    setText(dom.accountEmailValue, displayEmail);
    setText(dom.accountCpf, displayCpf);
    setText(dom.accountPhone, displayPhone);
    setText(dom.accountType, displayType);

    if (dom.adminLink) {
      const canSeeAdmin = user.tipo === "ADMIN" && !!user.acessoLiberado;
      dom.adminLink.style.display = canSeeAdmin ? "inline-flex" : "none";
    }
  }

  /* =========================================================
     PROTEÇÃO DE ROTA / INICIALIZAÇÃO
     ========================================================= */

  /**
   * Garante que a página só seja exibida para um usuário autenticado,
   * preenche a UI com os dados dele e aplica as preferências salvas
   * (tema e sidebar). Redireciona ao login caso não haja sessão válida.
   * @returns {boolean} true se a página pôde ser inicializada normalmente
   */
  function protectPage() {
    const user = getStoredUser();
    if (!user) {
      redirectTo(LOGIN_PAGE, { replace: true });
      return false;
    }

    fillUserData(user);
    applyTheme(readString(STORAGE_KEYS.THEME, THEMES.LIGHT));
    restoreSidebarState();

    return true;
  }

  /* =========================================================
     EVENTOS
     ========================================================= */

  dom.logoutBtn?.addEventListener("click", () => {
    clearStorage(STORAGE_KEYS.USER);
    clearStorage(STORAGE_KEYS.THEME);
    redirectTo(LOGIN_PAGE, { replace: true });
  });

  dom.themeSelect?.addEventListener("change", (event) => {
    setTheme(event.target.value);
  });

  dom.themeToggleButton?.addEventListener("click", () => {
    const current = document.body.dataset.theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
    setTheme(current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  });

  dom.sidebarCollapseBtn?.addEventListener("click", () => toggleSidebar());
  dom.sidebarToggleMobile?.addEventListener("click", () => toggleSidebar(false));

  statusButtons.forEach((button) => {
    syncStatusButton(button); // reflete o estado inicial vindo do HTML
    button.addEventListener("click", handleStatusToggleClick);
  });

  /* =========================================================
     BOOTSTRAP
     ========================================================= */
  protectPage();
})();