/**
 * admin-navigation.js
 * ---------------------------------------------------------------------------
 * Responsabilidade única: NAVEGAÇÃO do painel administrativo.
 *
 * O que este arquivo faz:
 *   1. Alterna entre as <section class="page-section"> do admin.html a
 *      partir dos links do menu lateral que possuem [data-section-target].
 *   2. Atualiza o item ativo do menu (classe "active") e o cabeçalho
 *      (eyebrow / título) com base em [data-page-eyebrow] / [data-page-title].
 *   3. Controla a abertura/fechamento do menu lateral em telas mobile.
 *   4. Controla a troca de abas dentro do "Prontuário do Cliente"
 *      ([data-client-tab] / [data-client-tab-panel]).
 *
 * O que este arquivo NÃO faz (fica a cargo de admin.js):
 *   - Buscar dados de clientes/processos na API.
 *   - Abrir/fechar modais (modalUsuario, modalGuiasAdmin, modal_mensagem).
 *   - Qualquer regra de negócio.
 *
 * Como adicionar uma nova section no futuro:
 *   1. Crie a <section class="page-section" id="minha-secao"> dentro de
 *      .page-sections no admin.html.
 *   2. Adicione um link no menu lateral com:
 *      data-section-target="minha-secao"
 *      data-page-eyebrow="..." data-page-title="..."
 *   Nenhuma alteração de código é necessária — a navegação já cobre
 *   qualquer link/section que siga esse padrão.
 * ---------------------------------------------------------------------------
 */
(() => {
  'use strict';

  const ACTIVE_CLASS = 'active';
  const SECTION_ACTIVE_CLASS = 'section-active';

  /* ============================================================= */
  /* Navegação entre sections do painel (menu lateral)              */
  /* ============================================================= */
  const SidebarNavigation = (() => {
    const links = Array.from(
      document.querySelectorAll('.sidebar-nav .nav-link[data-section-target]')
    );
    const sections = Array.from(
      document.querySelectorAll('.page-sections > .page-section')
    );
    const topbarEyebrow = document.getElementById('topbarEyebrow');
    const topbarTitle = document.getElementById('topbarTitle');

    function showSection(targetId) {
      sections.forEach((section) => {
        section.classList.toggle(SECTION_ACTIVE_CLASS, section.id === targetId);
      });
    }

    function markActiveLink(activeLink) {
      links.forEach((link) => link.classList.remove(ACTIVE_CLASS));
      activeLink.classList.add(ACTIVE_CLASS);
    }

    function updateTopbar(link) {
      const { pageEyebrow, pageTitle } = link.dataset;
      if (pageEyebrow && topbarEyebrow) topbarEyebrow.textContent = pageEyebrow;
      if (pageTitle && topbarTitle) topbarTitle.textContent = pageTitle;
    }

    function goTo(link) {
      const targetId = link.dataset.sectionTarget;
      if (!targetId) return;

      showSection(targetId);
      markActiveLink(link);
      updateTopbar(link);
    }

    function goToId(targetId) {
      const link = links.find((l) => l.dataset.sectionTarget === targetId);
      if (link) goTo(link);
    }

    function bindEvents(onNavigate) {
      links.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          goTo(link);
          if (typeof onNavigate === 'function') onNavigate();
        });
      });
    }

    function init() {
      const initialLink =
        links.find((l) => l.classList.contains(ACTIVE_CLASS)) || links[0];
      if (initialLink) goTo(initialLink);
    }

    return { bindEvents, init, goToId };
  })();

  /* ============================================================= */
  /* Menu lateral responsivo (mobile)                                */
  /* ============================================================= */
  const MobileSidebar = (() => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('mobileToggle');

    function open() {
      sidebar?.classList.add('sidebar-open');
      overlay?.classList.add(ACTIVE_CLASS);
    }

    function close() {
      sidebar?.classList.remove('sidebar-open');
      overlay?.classList.remove(ACTIVE_CLASS);
    }

    function toggle() {
      sidebar?.classList.contains('sidebar-open') ? close() : open();
    }

    function init() {
      toggleBtn?.addEventListener('click', toggle);
      overlay?.addEventListener('click', close);
    }

    return { init, close };
  })();

  /* ============================================================= */
  /* Abas do Prontuário do Cliente (modal)                          */
  /* ============================================================= */
  const ClientTabs = (() => {
    const buttons = Array.from(
      document.querySelectorAll('.client-tab-btn[data-client-tab]')
    );
    const panels = Array.from(
      document.querySelectorAll('.client-tab-panel[data-client-tab-panel]')
    );

    function showTab(tabName) {
      panels.forEach((panel) => {
        panel.classList.toggle(
          SECTION_ACTIVE_CLASS,
          panel.dataset.clientTabPanel === tabName
        );
      });
      buttons.forEach((btn) => {
        btn.classList.toggle(ACTIVE_CLASS, btn.dataset.clientTab === tabName);
      });
    }

    function init() {
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => showTab(btn.dataset.clientTab));
      });

      const initialBtn =
        buttons.find((b) => b.classList.contains(ACTIVE_CLASS)) || buttons[0];
      if (initialBtn) showTab(initialBtn.dataset.clientTab);
    }

    return { init, showTab };
  })();

  /* ============================================================= */
  /* Inicialização                                                   */
  /* ============================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    SidebarNavigation.bindEvents(MobileSidebar.close);
    SidebarNavigation.init();

    MobileSidebar.init();

    ClientTabs.init();
  });

  /* API pública mínima, para uso futuro por admin.js se necessário */
  window.AdminNavigation = {
    goToSection: SidebarNavigation.goToId,
    showClientTab: ClientTabs.showTab,
  };
})();