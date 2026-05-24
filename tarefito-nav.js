/**
 * ============================================================
 *  TAREFITO — Sistema de Navegação
 *  Arquivo: tarefito-nav.js
 *
 *  Como usar:
 *  Adicione <script src="tarefito-nav.js"></script> no <head>
 *  (ou antes de </body>) de TODOS os arquivos HTML.
 *
 *  Mapeamento de páginas:
 *    login_copy.html          → Login
 *    tela0cadastro.html       → Cadastro de Responsável
 *    tela2gerenciarcriancas.html → Gerenciar Crianças
 *    tela3dashboard.html      → Dashboard do Responsável
 *    tela4criartarefa.html    → Criar Missão
 *    tela5aprovartarefa.html  → Aprovar Tarefas
 *    tela6gerenciarloja.html  → Gerenciar Loja (responsável)
 *    tela7dashboardvisaocrianca.html → Dashboard da Criança
 *    tela8realizandotarefa.html      → Realizando Tarefa
 *    tela9lojavisaocrianca.html      → Loja (visão criança)
 *    tela10perfilcrianca.html        → Perfil da Criança
 * ============================================================
 */

// ─── Roteador central ────────────────────────────────────────
const Tarefito = {
  pages: {
    login:              'login_copy.html',
    cadastro:           'tela0cadastro.html',
    gerenciarCriancas:  'tela2gerenciarcriancas.html',
    dashboard:          'tela3dashboard.html',
    criarTarefa:        'tela4criartarefa.html',
    aprovarTarefa:      'tela5aprovartarefa.html',
    gerenciarLoja:      'tela6gerenciarloja.html',
    dashboardCrianca:   'tela7dashboardvisaocrianca.html',
    realizandoTarefa:   'tela8realizandotarefa.html',
    lojaCrianca:        'tela9lojavisaocrianca.html',
    perfilCrianca:      'tela10perfilcrianca.html',
  },

  /**
   * Navega para uma página pelo nome da chave.
   * @param {string} pageKey  — chave de Tarefito.pages
   * @param {object} [params] — parâmetros extras (salvos no sessionStorage)
   */
  navigate(pageKey, params) {
    const target = this.pages[pageKey];
    if (!target) {
      console.warn(`[Tarefito] Página desconhecida: "${pageKey}"`);
      return;
    }
    if (params) {
      sessionStorage.setItem('tarefito_params', JSON.stringify(params));
    }
    window.location.href = target;
  },

  /** Retorna os parâmetros passados pela última navegação. */
  getParams() {
    try {
      return JSON.parse(sessionStorage.getItem('tarefito_params') || '{}');
    } catch {
      return {};
    }
  },

  /** Volta para a página anterior do histórico do navegador. */
  goBack() {
    history.back();
  },
};

// ─── Atalhos globais (usados inline nas telas) ───────────────
// Compatível com os alert() que já existem no cadastro/login

/** Login → Dashboard (responsável) ou Dashboard Criança */
function navigateToDashboard() {
  Tarefito.navigate('dashboard');
}

/** Login → Cadastro */
function navigateToCadastro() {
  Tarefito.navigate('cadastro');
}

/** Cadastro → Dashboard (após criar conta) */
function goToDashboard() {
  Tarefito.navigate('dashboard');
}

/** Qualquer tela → Login */
function goToLogin() {
  Tarefito.navigate('login');
}

/** Botão voltar genérico */
function goBack() {
  Tarefito.goBack();
}

// ─── Inicialização automática por página ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';

  switch (page) {

    /* ════════════════════════════════════════════
       LOGIN
    ════════════════════════════════════════════ */
    case 'login_copy.html': {
      // Botão "INICIAR MISSÃO"
      const ctaBtn = document.getElementById('cta-btn');
      if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
          const profileCards = document.querySelectorAll('.profile-card');
          const isAdult = [...profileCards].some(
            c => c.classList.contains('active') && c.getAttribute('onclick')?.includes('adult')
          );
          // Detecta perfil ativo pelo estado do botão
          const isAdultActive = ctaBtn.style.background.includes('#a855f7') ||
                                ctaBtn.style.background.includes('a855f7');

          if (isAdultActive || ctaBtn.style.borderBottomColor === '#581c87') {
            Tarefito.navigate('dashboard');
          } else {
            Tarefito.navigate('dashboardCrianca');
          }
        });
      }

      // Link "Criar Base"
      document.querySelectorAll('a').forEach(a => {
        if (a.textContent.trim() === 'Criar Base') {
          a.addEventListener('click', e => {
            e.preventDefault();
            Tarefito.navigate('cadastro');
          });
        }
      });
      break;
    }

    /* ════════════════════════════════════════════
       CADASTRO
    ════════════════════════════════════════════ */
    case 'tela0cadastro.html': {
      // goBack() e goToDashboard() já estão definidos globalmente acima
      // e os botões HTML chamam essas funções diretamente —
      // só precisamos sobrescrever os alert() originais:
      window.goBack = () => Tarefito.navigate('login');
      window.goToDashboard = () => Tarefito.navigate('gerenciarCriancas');
      break;
    }

    /* ════════════════════════════════════════════
       TELAS COM IFRAME (UXPilot)
       A navegação ocorre no documento pai (esta página),
       interceptando cliques nos iframes via postMessage
       ou injetando lógica após carregamento.
    ════════════════════════════════════════════ */

    case 'tela2gerenciarcriancas.html':
    case 'tela3dashboard.html':
    case 'tela4criartarefa.html':
    case 'tela5aprovartarefa.html':
    case 'tela6gerenciarloja.html':
    case 'tela7dashboardvisaocrianca.html':
    case 'tela8realizandotarefa.html':
    case 'tela9lojavisaocrianca.html':
    case 'tela10perfilcrianca.html': {
      _hookIframeNav(page);
      break;
    }
  }
});

// ─── Lógica de hook para telas iframe ────────────────────────
function _hookIframeNav(page) {
  const iframe = document.querySelector('iframe[srcdoc]');
  if (!iframe) return;

  // Aguarda o iframe renderizar
  iframe.addEventListener('load', () => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      _bindNavButtons(doc, page);
    } catch (e) {
      // Cross-origin guard — em produção usar postMessage
      console.warn('[Tarefito] Não foi possível acessar o iframe:', e.message);
    }
  });

  // Tenta imediatamente caso já esteja carregado
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (doc && doc.readyState === 'complete') {
      _bindNavButtons(doc, page);
    }
  } catch (_) {}
}

/**
 * Vincula os botões de navegação dentro do documento do iframe.
 * @param {Document} doc  — document do iframe
 * @param {string}   page — nome do arquivo atual
 */
function _bindNavButtons(doc, page) {

  // ── Botão Voltar (chevron-left / arrow-left no header) ──
  const backBtn = doc.querySelector('header button:first-child');
  if (backBtn) {
    backBtn.addEventListener('click', () => Tarefito.goBack());
  }

  // ── Bottom Navigation ────────────────────────────────────
  //    Mapeia ícones da nav bar para páginas
  const navMap = [
    // Responsável
    { icon: 'fa-chart-pie',    page: 'dashboard' },
    { icon: 'fa-list-check',   page: 'criarTarefa' },
    { icon: 'fa-users',        page: 'gerenciarCriancas' },
    { icon: 'fa-gift',         page: 'gerenciarLoja' },
    { icon: 'fa-check-double', page: 'aprovarTarefa' },
    // Criança
    { icon: 'fa-gamepad',      page: 'dashboardCrianca' },
    { icon: 'fa-user-astronaut', page: 'perfilCrianca' },
  ];

  doc.querySelectorAll('nav a').forEach(link => {
    const icon = link.querySelector('i[class]');
    if (!icon) return;
    const classes = icon.className;

    const match = navMap.find(m => classes.includes(m.icon));
    if (match && match.page !== _currentPageKey(page)) {
      link.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        Tarefito.navigate(match.page);
      }, true);
    }
  });

  // ── Ações específicas por tela ───────────────────────────
  _bindPageSpecificActions(doc, page);
}

/** Retorna a chave de Tarefito.pages para o arquivo atual */
function _currentPageKey(filename) {
  const map = {
    'login_copy.html':                  'login',
    'tela0cadastro.html':               'cadastro',
    'tela2gerenciarcriancas.html':      'gerenciarCriancas',
    'tela3dashboard.html':              'dashboard',
    'tela4criartarefa.html':            'criarTarefa',
    'tela5aprovartarefa.html':          'aprovarTarefa',
    'tela6gerenciarloja.html':          'gerenciarLoja',
    'tela7dashboardvisaocrianca.html':  'dashboardCrianca',
    'tela8realizandotarefa.html':       'realizandoTarefa',
    'tela9lojavisaocrianca.html':       'lojaCrianca',
    'tela10perfilcrianca.html':         'perfilCrianca',
  };
  return map[filename] || '';
}

/** Ações específicas de cada tela */
function _bindPageSpecificActions(doc, page) {

  switch (page) {

    /* ─ Dashboard do Responsável ─ */
    case 'tela3dashboard.html': {
      // "Criar Missão"
      _onBtnContaining(doc, 'Criar Missão', () => Tarefito.navigate('criarTarefa'));
      // "Aprovar" (badge de 4)
      _onBtnContaining(doc, 'Aprovar', () => Tarefito.navigate('aprovarTarefa'));
      // "Recompensas"
      _onBtnContaining(doc, 'Recompensas', () => Tarefito.navigate('gerenciarLoja'));
      // "Trocar Criança" → Gerenciar Crianças
      _onBtnContaining(doc, 'Trocar Criança', () => Tarefito.navigate('gerenciarCriancas'));
      break;
    }

    /* ─ Gerenciar Crianças ─ */
    case 'tela2gerenciarcriancas.html': {
      // "ACESSAR PAINEL"
      _onBtnContaining(doc, 'ACESSAR PAINEL', () => Tarefito.navigate('dashboard'));
      break;
    }

    /* ─ Criar Tarefa ─ */
    case 'tela4criartarefa.html': {
      // "Publicar Missão"
      _onBtnContaining(doc, 'Publicar Missão', () => Tarefito.navigate('dashboard'));
      // "Cancelar"
      _onBtnContaining(doc, 'Cancelar', () => Tarefito.navigate('dashboard'));
      break;
    }

    /* ─ Aprovar Tarefa ─ */
    case 'tela5aprovartarefa.html': {
      // Botões "Aprovar" nos cards
      doc.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.trim() === 'Aprovar') {
          btn.addEventListener('click', () => {
            // Feedback visual rápido e volta ao dashboard
            btn.textContent = '✓ Aprovado!';
            btn.style.background = 'linear-gradient(90deg,#22c55e,#16a34a)';
            setTimeout(() => Tarefito.navigate('dashboard'), 1200);
          });
        }
      });
      break;
    }

    /* ─ Dashboard da Criança ─ */
    case 'tela7dashboardvisaocrianca.html': {
      // Botões "Iniciar" nas missões
      doc.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.trim() === 'Iniciar') {
          btn.addEventListener('click', () => Tarefito.navigate('realizandoTarefa'));
        }
      });
      // "Ir à Loja"
      _onBtnContaining(doc, 'Ir à', () => Tarefito.navigate('lojaCrianca'));
      // "Finalizar" missão em andamento
      _onBtnContaining(doc, 'Finalizar', () => Tarefito.navigate('realizandoTarefa'));
      break;
    }

    /* ─ Realizando Tarefa ─ */
    case 'tela8realizandotarefa.html': {
      // "Finalizar Missão"
      _onBtnContaining(doc, 'Finalizar Missão', () => Tarefito.navigate('dashboardCrianca'));
      break;
    }

    /* ─ Loja Visão Criança ─ */
    case 'tela9lojavisaocrianca.html': {
      // Botões "Resgatar"
      doc.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.trim() === 'Resgatar') {
          btn.addEventListener('click', () => {
            // Abre modal de confirmação se existir
            const modal = doc.getElementById('redemption-modal');
            if (modal) modal.classList.remove('hidden');
          });
        }
      });

      // Fechar modal
      const modal = doc.getElementById('redemption-modal');
      if (modal) {
        // Botão X e Cancelar
        modal.querySelectorAll('button').forEach(btn => {
          if (btn.querySelector('.fa-xmark') || btn.textContent.trim() === 'Cancelar') {
            btn.addEventListener('click', () => modal.classList.add('hidden'));
          }
          // Confirmar resgate
          if (btn.textContent.trim() === 'Confirmar') {
            btn.addEventListener('click', () => {
              modal.classList.add('hidden');
              // Feedback visual
              alert('Resgate solicitado! Aguardando aprovação do responsável.');
            });
          }
        });
      }
      break;
    }

    /* ─ Gerenciar Loja (Responsável) ─ */
    case 'tela6gerenciarloja.html': {
      // "Adicionar à Loja"
      _onBtnContaining(doc, 'Adicionar à Loja', () => {
        alert('Prêmio adicionado à loja com sucesso!');
      });
      // Botões de excluir recompensa
      doc.querySelectorAll('button').forEach(btn => {
        if (btn.querySelector('.fa-trash-can')) {
          btn.addEventListener('click', () => {
            if (confirm('Remover este prêmio da loja?')) {
              btn.closest('.glass-panel, .rounded-2xl')?.remove();
            }
          });
        }
      });
      break;
    }

    /* ─ Perfil da Criança ─ */
    case 'tela10perfilcrianca.html': {
      // Ícone de editar nome
      const editIcon = doc.querySelector('.fa-pen');
      if (editIcon) {
        editIcon.style.cursor = 'pointer';
        editIcon.addEventListener('click', () => {
          const newName = prompt('Novo apelido do herói:');
          if (newName) {
            const nameEl = editIcon.closest('h2') || editIcon.parentElement;
            // Atualiza só o texto, preserva o ícone
            const textNode = [...nameEl.childNodes].find(n => n.nodeType === 3);
            if (textNode) textNode.textContent = newName + ' ';
          }
        });
      }
      break;
    }
  }
}

// ─── Helper: clique em botão que contém determinado texto ─────
function _onBtnContaining(doc, text, callback) {
  doc.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes(text)) {
      btn.addEventListener('click', callback);
    }
  });
}

// ─── Helper: clique em link <a> que contém determinado texto ──
function _onLinkContaining(doc, text, callback) {
  doc.querySelectorAll('a').forEach(a => {
    if (a.textContent.includes(text)) {
      a.addEventListener('click', e => {
        e.preventDefault();
        callback();
      });
    }
  });
}
