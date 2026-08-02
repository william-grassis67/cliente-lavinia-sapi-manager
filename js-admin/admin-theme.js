/**
 * admin-theme.js
 * ---------------------------------------------------------------------------
 * Responsabilidade única: TEMA e preferências visuais do painel administrativo.
 *
 * O que este arquivo faz:
 *   1. Alterna entre tema claro/escuro (atributo data-theme no <html>).
 *   2. Salva a preferência de tema do usuário no localStorage e a restaura
 *      automaticamente na próxima vez que o painel for aberto.
 *   3. Atualiza os botões/ícones de tema (classe "active") na section
 *      Configurações.
 *   4. Aplica cor principal / cor secundária escolhidas nos color pickers
 *      como CSS Custom Properties (--primary-color / --secondary-color),
 *      válidas apenas para a sessão atual do navegador.
 *   5. Permite restaurar tudo (tema + cores) para o padrão de fábrica.
 *
 * O que este arquivo NÃO faz:
 *   - Navegação entre sections/abas (fica em admin-navigation.js).
 *   - Qualquer chamada à API ou regra de negócio.
 *
 * Extensibilidade:
 *   Novas personalizações (ex.: densidade da UI, fonte, notificações)
 *   podem ser adicionadas seguindo o mesmo padrão: um valor padrão em
 *   DEFAULTS, uma função applyX() que aplica + persiste, e o binding do
 *   respectivo elemento em bindEvents().
 * ---------------------------------------------------------------------------
 */
(() => {
  'use strict';

  const ACTIVE_CLASS = 'active';

  const STORAGE_KEYS = {
    theme: 'admin-theme:mode',
  };

  const DEFAULTS = {
    theme: 'dark',
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1',
  };

  const root = document.documentElement;

  const els = {
    themeButtons: Array.from(
      document.querySelectorAll('.config-theme-btn[data-theme]')
    ),
    corPrimaria: document.getElementById('corPrimaria'),
    corPrimariaValor: document.getElementById('corPrimariaValor'),
    corSecundaria: document.getElementById('corSecundaria'),
    corSecundariaValor: document.getElementById('corSecundariaValor'),
    btnRestaurar: document.getElementById('btnRestaurarTema'),
  };

  /* ============================================================= */
  /* Tema (claro/escuro) — persistido no localStorage                */
  /* ============================================================= */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);

    els.themeButtons.forEach((btn) => {
      btn.classList.toggle(ACTIVE_CLASS, btn.dataset.theme === theme);
    });

    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch (error) {
      console.warn('Não foi possível salvar a preferência de tema:', error);
    }
  }

  function loadSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.theme) || DEFAULTS.theme;
    } catch (error) {
      console.warn('Não foi possível ler a preferência de tema salva:', error);
      return DEFAULTS.theme;
    }
  }

  /* ============================================================= */
  /* Cores do sistema — aplicadas apenas na sessão atual             */
  /* ============================================================= */
  function applyPrimaryColor(color) {
    root.style.setProperty('--primary-color', color);
    if (els.corPrimaria) els.corPrimaria.value = color;
    if (els.corPrimariaValor) els.corPrimariaValor.textContent = color;
  }

  function applySecondaryColor(color) {
    root.style.setProperty('--secondary-color', color);
    if (els.corSecundaria) els.corSecundaria.value = color;
    if (els.corSecundariaValor) els.corSecundariaValor.textContent = color;
  }

  /* ============================================================= */
  /* Restaurar padrão                                                 */
  /* ============================================================= */
  function restoreDefaults() {
    applyTheme(DEFAULTS.theme);
    applyPrimaryColor(DEFAULTS.primaryColor);
    applySecondaryColor(DEFAULTS.secondaryColor);
  }

  /* ============================================================= */
  /* Eventos                                                          */
  /* ============================================================= */
  function bindEvents() {
    els.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    els.corPrimaria?.addEventListener('input', (event) =>
      applyPrimaryColor(event.target.value)
    );

    els.corSecundaria?.addEventListener('input', (event) =>
      applySecondaryColor(event.target.value)
    );

    els.btnRestaurar?.addEventListener('click', restoreDefaults);
  }

  /* ============================================================= */
  /* Inicialização                                                    */
  /* ============================================================= */
  function init() {
    applyTheme(loadSavedTheme());
    applyPrimaryColor(els.corPrimaria?.value || DEFAULTS.primaryColor);
    applySecondaryColor(els.corSecundaria?.value || DEFAULTS.secondaryColor);
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);

  /* API pública mínima, para uso futuro por admin.js se necessário */
  window.AdminTheme = {
    applyTheme,
    applyPrimaryColor,
    applySecondaryColor,
    restoreDefaults,
  };
})();