/**
 * TAREFITO — Navegação + Lógica de telas
 * Requer: tarefito-supabase.js
 */

const Tarefito = {
  pages: {
    login:             'login.html',
    cadastro:          'tela0cadastro.html',
    gerenciarCriancas: 'tela2gerenciarcriancas.html',
    dashboard:         'tela3dashboard.html',
    criarTarefa:       'tela4criartarefa.html',
    aprovarTarefa:     'tela5aprovartarefa.html',
    gerenciarLoja:     'tela6gerenciarloja.html',
    dashboardCrianca:  'tela7dashboardvisaocrianca.html',
    realizandoTarefa:  'tela8realizandotarefa.html',
    lojaCrianca:       'tela9lojavisaocrianca.html',
  },
  navigate(key) {
    const p = this.pages[key];
    if (p) window.location.href = p;
    else console.warn('[Nav] desconhecida:', key);
  },
  goBack() { history.back(); },
};

// ── Atalhos globais ──────────────────────────────────────────
function goBack()             { Tarefito.goBack(); }
function goToLogin()          { auth.signOut().then(() => Tarefito.navigate('login')); }
function goToDashboard()      { Tarefito.navigate('gerenciarCriancas'); }
function navigateToCadastro() { Tarefito.navigate('cadastro'); }

// ── Moldura mobile ───────────────────────────────────────────
(function addMobileFrame() {
  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 500px) {
      body { background: #0a0a0f !important; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; }
      body > *:not(#tf-toast):not(script):not(style):not(link) { max-width: 430px !important; width: 100% !important; }
      /* Wrapper do conteúdo principal */
      #app-container, main, .app-wrapper {
        max-width: 430px !important; width: 430px !important;
        box-shadow: 0 0 60px rgba(168,85,247,0.15), 0 0 0 1px rgba(168,85,247,0.1);
        border-radius: 0 !important; min-height: 100vh;
        margin: 0 auto; position: relative;
      }
    }
  `;
  document.head.appendChild(style);

  // Centraliza nav e header
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (nav) {
      nav.style.maxWidth = '430px';
      nav.style.left = '50%';
      nav.style.transform = 'translateX(-50%)';
    }
  });
})();

// ── Init por página ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';
  console.log('[Tarefito] página:', page);

  switch (page) {

    // ════════════ LOGIN ═════════════════════════════════════
    case 'login.html': {
      const btn = document.getElementById('cta-btn');
      if (!btn) break;

      btn.addEventListener('click', async () => {
        // Detecta modo criança pelo elemento PIN visível (form de criança mostra #pin_entry_overlay)
        const pinOverlay = document.getElementById('pin_entry_overlay');
        const isChild = pinOverlay && pinOverlay.style.display !== 'none' && pinOverlay.style.display !== '';

        if (isChild) {
          const pin = document.querySelector('.input-gaming-green')?.value?.trim();
          if (!pin) return _toast('Digite o código secreto!', 'err');
          try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            const members = await db.get('members', 'pin=eq.' + encodeURIComponent(pin) + '&select=*');
            if (!members?.length) {
              btn.innerHTML = 'INICIAR MISSÃO <i class="fa-solid fa-rocket"></i>';
              return _toast('Código secreto inválido!', 'err');
            }
            const fam = await db.get('families', 'owner_id=eq.' + members[0].parent_id + '&select=*');
            if (fam?.[0]) DB.family.save(fam[0]);
            DB.child.save(members[0]);
            Tarefito.navigate('dashboardCrianca');
          } catch (e) {
            console.error(e);
            btn.innerHTML = 'INICIAR MISSÃO <i class="fa-solid fa-rocket"></i>';
            _toast('Erro ao conectar.', 'err');
          }
        } else {
          const email = document.querySelector('#email-input-group input')?.value?.trim();
          const pass  = document.querySelector('#password-input-group input')?.value?.trim();
          if (!email || !pass) return _toast('Preencha email e senha!', 'err');
          try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            const session = await auth.signIn(email, pass);
            await DB.getOrCreateFamily(session.user.id, session.user.user_metadata?.full_name || 'Responsável');
            Tarefito.navigate('gerenciarCriancas');
          } catch (e) {
            console.error(e);
            btn.innerHTML = 'INICIAR MISSÃO <i class="fa-solid fa-rocket"></i>';
            _toast(e.message || 'Email ou senha incorretos.', 'err');
          }
        }
      });

      document.querySelectorAll('a').forEach(a => {
        if (a.textContent.includes('Criar Base')) {
          a.addEventListener('click', e => { e.preventDefault(); Tarefito.navigate('cadastro'); });
        }
      });
      break;
    }

    // ════════════ GERENCIAR CRIANÇAS ════════════════════════
    case 'tela2gerenciarcriancas.html': {
      if (!requireAuth()) break;
      _loadChildren();
      // Botão "ACESSAR PAINEL" — seletor exato
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.trim().includes('ACESSAR PAINEL')) {
          btn.addEventListener('click', () => Tarefito.navigate('dashboard'));
        }
      });
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ════════════ DASHBOARD RESPONSÁVEL ═════════════════════
    case 'tela3dashboard.html': {
      if (!requireAuth()) break;
      _loadDashboard();
      _onBtnText('Criar Missão',   () => Tarefito.navigate('criarTarefa'));
      _onBtnText('Recompensas',    () => Tarefito.navigate('gerenciarLoja'));
      _onBtnText('Trocar Criança', () => Tarefito.navigate('gerenciarCriancas'));
      _onBtnText('Aprovar',        () => Tarefito.navigate('aprovarTarefa'));
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ════════════ CRIAR TAREFA ════════════════════════════
    case 'tela4criartarefa.html': {
      if (!requireAuth()) break;
      _loadChildCheckboxes();
      _onBtnText('Publicar Missão', _submitTask);
      _onBtnText('Cancelar',        () => Tarefito.navigate('dashboard'));
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ════════════ APROVAR TAREFA ═════════════════════════
    case 'tela5aprovartarefa.html': {
      if (!requireAuth()) break;
      _loadPendingTasks();
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ════════════ GERENCIAR LOJA ═════════════════════════
    case 'tela6gerenciarloja.html': {
      if (!requireAuth()) break;
      _loadRewardsAdmin();
      _onBtnText('Adicionar à Loja', _submitReward);
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ════════════ DASHBOARD CRIANÇA ══════════════════════
    case 'tela7dashboardvisaocrianca.html': {
      const child = DB.child.get();
      if (!child) { Tarefito.navigate('login'); break; }
      _loadChildDashboard(child);
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Ir à')) btn.addEventListener('click', () => Tarefito.navigate('lojaCrianca'));
      });
      _bindBottomNavChild();
      break;
    }

    // ════════════ REALIZANDO TAREFA ══════════════════════
    case 'tela8realizandotarefa.html': {
      const child = DB.child.get();
      if (!child) { Tarefito.navigate('login'); break; }
      _loadMissionDetail();
      _onBtnText('Finalizar Missão', _submitMissionDone);
      _bindBackBtn();
      _bindBottomNavChild();
      break;
    }

    // ════════════ LOJA CRIANÇA ═══════════════════════════
    case 'tela9lojavisaocrianca.html': {
      const child = DB.child.get();
      if (!child) { Tarefito.navigate('login'); break; }
      _loadShop(child);
      _bindBackBtn();
      _bindBottomNavChild();
      break;
    }

  }
});

// ════════════════════════════════════════════════════════════
//  LOADERS
// ════════════════════════════════════════════════════════════

async function _loadChildren() {
  const family  = DB.family.get();
  const session = DB.session.get();
  if (!family || !session) return;
  const parentId = session.user?.id || family.owner_id;
  const list = document.getElementById('children-list');
  if (!list) return;

  list.innerHTML = '';

  try {
    const children = await DB.getChildren(parentId);

    if (!children?.length) {
      list.innerHTML = `<div class="glass-panel rounded-[24px] p-8 border border-gray-700 text-center">
        <i class="fa-solid fa-rocket text-neon-purple text-3xl mb-3 block"></i>
        <p class="text-white font-display text-lg">Nenhum explorador ainda!</p>
        <p class="text-gray-400 text-sm mt-1">Adicione o primeiro abaixo.</p>
      </div>`;
    } else {
      children.forEach(c => {
        const div = document.createElement('div');
        div.innerHTML = _childCardHTML(c);
        list.appendChild(div.firstElementChild);
      });
      list.querySelectorAll('.btn-edit-name').forEach(btn => {
        btn.addEventListener('click', () => _editChildName(btn.dataset.id, btn.dataset.name));
      });
      list.querySelectorAll('.btn-regen-pin').forEach(btn => {
        btn.addEventListener('click', () => _regenPin(btn.dataset.id));
      });
    }
  } catch(e) { console.error('[loadChildren]', e); }

  // Botão sempre visível independente de erro
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn-gaming w-full h-16 rounded-[24px] border-2 border-dashed border-gray-700 ' +
    'bg-dark-surface/30 flex items-center justify-center gap-3 text-gray-400 ' +
    'hover:text-neon-purple hover:border-neon-purple transition-all';
  addBtn.innerHTML = '<i class="fa-solid fa-plus text-lg"></i><span class="font-display text-base">Novo Explorador</span>';
  addBtn.addEventListener('click', _showAddChildForm);
  list.appendChild(addBtn);
}

function _childCardHTML(c) {
  const initial  = c.name.charAt(0).toUpperCase();
  const safeName = c.name.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const pin      = c.pin || '—';
  return `<div class="glass-panel rounded-[24px] p-5 border border-gray-700 relative overflow-hidden mb-4" data-child-id="${c.id}">
    <!-- Avatar + nome + editar -->
    <div class="flex items-center gap-4 mb-4">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-green-900 to-teal-900
           border-2 border-neon-green shadow-neon-green flex items-center justify-center
           text-2xl font-bold text-white flex-shrink-0">${initial}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="child-name font-display text-lg text-white">${safeName}</h3>
          <button class="btn-edit-name text-gray-500 hover:text-neon-purple transition-colors"
                  data-id="${c.id}" data-name="${safeName}" title="Editar nome">
            <i class="fa-solid fa-pen text-xs"></i>
          </button>
        </div>
        <span class="text-xs text-gray-400 font-bold">
          <i class="fa-solid fa-star text-yellow-400 text-[10px] mr-1"></i>${c.stars || 0} estrelas
        </span>
      </div>
    </div>
    <!-- PIN sempre visível -->
    <div class="flex items-center justify-between rounded-xl px-4 py-3"
         style="background:rgba(11,14,20,0.65); border:1px solid rgba(34,197,94,0.35);">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-key text-green-400"></i>
        <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PIN</span>
        <span class="font-display text-green-400 text-base tracking-widest">${pin}</span>
      </div>
      <button class="btn-regen-pin text-gray-500 hover:text-blue-400 transition-colors"
              data-id="${c.id}" title="Gerar novo PIN">
        <i class="fa-solid fa-rotate text-sm"></i>
      </button>
    </div>
  </div>`;
}

async function _showAddChildForm() {
  // Modal inline — sem prompt()
  const existing = document.getElementById('tf-add-child-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'tf-add-child-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9998;' +
    'display:flex;align-items:center;justify-content:center;padding:20px;';

  // Gera PIN automático
  const autoPin = _generatePin();

  modal.innerHTML = `
    <div style="background:#13131a;border:1px solid rgba(168,85,247,0.4);border-radius:24px;
                padding:28px;width:100%;max-width:380px;box-shadow:0 0 40px rgba(168,85,247,0.2);">
      <h2 style="color:#fff;font-family:'Fredoka One',sans-serif;font-size:20px;margin:0 0 20px;">
        Novo Explorador
      </h2>

      <label style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        Nome do Herói
      </label>
      <input id="tf-child-name" type="text" placeholder="Ex: Leo, Mia..."
        style="width:100%;height:48px;background:#1e1e2e;border:2px solid #374151;border-radius:12px;
               padding:0 16px;color:#fff;font-weight:700;font-size:15px;margin:8px 0 16px;box-sizing:border-box;" />

      <div style="background:#1e1e2e;border:1px solid rgba(34,197,94,0.3);border-radius:16px;padding:16px;margin-bottom:20px;">
        <p style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 8px;">
          Código Secreto (gerado automaticamente)
        </p>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <span id="tf-pin-display" style="color:#22c55e;font-family:'Fredoka One',sans-serif;
                font-size:28px;letter-spacing:4px;">${autoPin}</span>
          <button id="tf-regen-pin" type="button"
            style="background:#1e1e2e;border:1px solid #374151;border-radius:10px;
                   padding:8px 14px;color:#9ca3af;font-size:12px;cursor:pointer;white-space:nowrap;">
            🔄 Novo código
          </button>
        </div>
        <p style="color:#6b7280;font-size:11px;margin:8px 0 0;">
          Anote este código — a criança vai usá-lo para entrar no app.
        </p>
      </div>

      <div style="display:flex;gap:12px;">
        <button id="tf-cancel-child" type="button"
          style="flex:1;height:48px;border-radius:14px;border:2px solid #374151;
                 background:transparent;color:#9ca3af;font-weight:700;cursor:pointer;font-size:14px;">
          Cancelar
        </button>
        <button id="tf-save-child" type="button"
          style="flex:2;height:48px;border-radius:14px;border:none;
                 background:linear-gradient(90deg,#a855f7,#3b82f6);color:#fff;
                 font-family:'Fredoka One',sans-serif;font-size:16px;cursor:pointer;
                 box-shadow:0 0 20px rgba(168,85,247,0.4);">
          Criar Explorador 🚀
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Foco no nome
  setTimeout(() => document.getElementById('tf-child-name')?.focus(), 100);

  // Regenerar PIN
  document.getElementById('tf-regen-pin').addEventListener('click', () => {
    const newPin = _generatePin();
    document.getElementById('tf-pin-display').textContent = newPin;
    document.getElementById('tf-regen-pin').dataset.pin = newPin;
  });

  // Cancelar
  document.getElementById('tf-cancel-child').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Salvar
  document.getElementById('tf-save-child').addEventListener('click', async () => {
    const name = document.getElementById('tf-child-name').value.trim();
    const goal = 50;
    const pin  = document.getElementById('tf-pin-display').textContent.trim();
    const family  = DB.family.get();
    const session = DB.session.get();

    if (!name) { document.getElementById('tf-child-name').style.borderColor = '#ef4444'; return; }
    if (!family || !session) return _toast('Sessão expirada, faça login novamente', 'err');

    const parentId = session.user?.id || family.owner_id;
    const saveBtn = document.getElementById('tf-save-child');
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    saveBtn.disabled = true;

    try {
      await DB.createChild(parentId, name, pin, goal);
      modal.remove();
      _toast(name + ' adicionado com código ' + pin + '! 🚀', 'ok');
      await _loadChildren();
    } catch(e) {
      console.error(e);
      saveBtn.innerHTML = 'Criar Explorador 🚀';
      saveBtn.disabled = false;
      _toast('Erro: ' + (e?.message || JSON.stringify(e)), 'err');
    }
  });
}

function _generatePin() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pin = '';
  for (let i = 0; i < 6; i++) pin += chars[Math.floor(Math.random() * chars.length)];
  return pin;
}

async function _loadDashboard() {
  const family  = DB.family.get();
  const session = DB.session.get();
  if (!family || !session) return;
  const parentId = session.user?.id || family.owner_id;
  try {
    const [children, pending] = await Promise.all([
      DB.getChildren(parentId),
      DB.getPendingApproval(parentId),
    ]);
    const totalStars = (children||[]).reduce((s,c) => s+(c.stars||0), 0);

    // Stats cards — estrelas e pendentes
    const statNums = document.querySelectorAll('#global-stats .font-display');
    if (statNums[0]) statNums[0].textContent = totalStars;
    if (statNums[1]) statNums[1].textContent = pending?.length || 0;

    // Badge do botão Aprovar (só esse botão, pelo ID)
    const badgeAprovar = document.getElementById('badge-aprovar');
    if (badgeAprovar && pending?.length) {
      badgeAprovar.textContent = 'Aprovar (' + pending.length + ')';
    }

    // Contador de filhos no botão Filhos
    const badgeFilhos = document.getElementById('badge-filhos');
    if (badgeFilhos) {
      badgeFilhos.textContent = children?.length ? '(' + children.length + ')' : '';
    }

    // Navegação do botão Filhos para tela2
    const btnFilhos = document.getElementById('btn-filhos');
    if (btnFilhos && !btnFilhos._navBound) {
      btnFilhos._navBound = true;
      btnFilhos.addEventListener('click', () => Tarefito.navigate('gerenciarCriancas'));
    }

    // Progresso de crianças
    const progressSection = document.getElementById('child-progress');
    if (progressSection && children?.length) {
      const items = progressSection.querySelectorAll('.flex.items-center.justify-between');
      children.forEach((child, i) => {
        if (items[i]) {
          const nameEl = items[i].querySelector('.font-bold, .font-display');
          const starEl = items[i].querySelector('.text-yellow-400');
          if (nameEl) nameEl.textContent = child.name;
          if (starEl) starEl.textContent = child.stars || 0;
        }
      });
    }
  } catch(e) { console.error('[dashboard]', e); }
}

async function _loadChildCheckboxes() {
  const family  = DB.family.get();
  const session = DB.session.get();
  if (!family || !session) return;
  const parentId = session.user?.id || family.owner_id;
  const children = await DB.getChildren(parentId).catch(() => []);
  if (!children?.length) return;

  // Encontra o container dos checkboxes de crianças
  const container = document.querySelector('#target-schedule .flex.gap-3, #target-schedule .overflow-x-auto');
  if (!container) return;

  container.innerHTML = children.map((c, i) => `
    <label class="relative cursor-pointer shrink-0">
      <input type="checkbox" name="assigned_child" value="${c.id}"
             class="peer sr-only radio-gaming" ${i===0 ? 'checked' : ''} />
      <div class="w-16 h-20 rounded-xl border-2 border-gray-700 bg-dark-surface
           flex flex-col items-center justify-center gap-2 transition-all
           peer-checked:border-neon-blue peer-checked:bg-neon-blue/10">
        <div class="w-10 h-10 rounded-full bg-dark-bg border border-gray-600
             flex items-center justify-center font-bold text-white text-lg">
          ${c.name.charAt(0)}
        </div>
        <span class="text-[10px] font-bold text-white truncate w-14 text-center">${c.name}</span>
      </div>
    </label>`).join('') + `
    <label class="relative cursor-pointer shrink-0">
      <input type="checkbox" name="assigned_child" value="all" class="peer sr-only" />
      <div class="w-16 h-20 rounded-xl border-2 border-gray-700 bg-dark-surface
           flex flex-col items-center justify-center gap-2 transition-all
           peer-checked:border-neon-blue peer-checked:bg-neon-blue/10">
        <div class="w-10 h-10 rounded-full bg-dark-bg border border-gray-600
             flex items-center justify-center">
          <i class="fa-solid fa-users text-gray-400"></i>
        </div>
        <span class="text-[10px] font-bold text-white">Todos</span>
      </div>
    </label>`;
}

async function _submitTask() {
  const family  = DB.family.get();
  const session = DB.session.get();
  if (!family || !session) return _toast('Sessão expirada', 'err');
  const parentId = session.user?.id || family.owner_id;

  const title = document.querySelector('#mission-basics input[type="text"]')?.value?.trim();
  if (!title) return _toast('Digite o título da missão!', 'err');

  const stars  = parseInt(document.querySelector('input[type="range"]')?.value || '15');
  const repeat = document.querySelector('select')?.value || 'none';

  const checked = [...document.querySelectorAll('[name="assigned_child"]:checked')];
  const allSelected = checked.some(c => c.value === 'all');
  let targets = checked.map(c => c.value).filter(v => v !== 'all');
  if (allSelected || !targets.length) {
    const ch = await DB.getChildren(family.id);
    targets = ch.map(c => String(c.id));
  }

  const publishBtn = document.querySelector('button');
  if (publishBtn) { publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; publishBtn.disabled = true; }

  try {
    await Promise.all(targets.map(childId =>
      DB.createTask(parentId, { name: title, child_id: childId, stars, recorrente: repeat !== 'none' })
    ));
    _toast('Missão publicada! 🚀', 'ok');
    setTimeout(() => Tarefito.navigate('dashboard'), 1200);
  } catch(e) {
    console.error(e);
    if (publishBtn) { publishBtn.innerHTML = '🚀 Publicar Missão'; publishBtn.disabled = false; }
    _toast('Erro: ' + (e?.message || JSON.stringify(e)), 'err');
  }
}

async function _loadPendingTasks() {
  const family  = DB.family.get();
  const session = DB.session.get();
  if (!family || !session) return;
  const parentId = session.user?.id || family.owner_id;
  const queue = document.getElementById('approval-queue');
  if (!queue) return;

  try {
    const [tasks, approved, children] = await Promise.all([
      DB.getPendingApproval(parentId),
      DB.getApprovedCount(parentId).catch(() => []),
      DB.getChildren(parentId).catch(() => []),
    ]);

    // mapa child_id → nome para uso nos cards
    const childMap = {};
    (children || []).forEach(c => { childMap[c.id] = c.name; });

    const pendCount = tasks?.length  ?? 0;
    const aprvCount = approved?.length ?? 0;

    // Cards de contagem
    const elPend = document.getElementById('count-pendentes');
    const elApro = document.getElementById('count-aprovadas');
    if (elPend) elPend.textContent = pendCount;
    if (elApro) elApro.textContent = aprvCount;

    // Subtítulo dinâmico
    const elSub = document.getElementById('subtitle-pendentes');
    if (elSub) {
      elSub.textContent = pendCount === 0
        ? 'Nenhuma missão aguardando'
        : pendCount === 1 ? '1 missão aguardando revisão'
        : pendCount + ' missões aguardando revisão';
    }

    // Limpa fila e renderiza
    queue.innerHTML = '';

    if (!pendCount) {
      queue.innerHTML = `<div class="glass-panel rounded-[24px] p-8 border border-gray-700 text-center">
        <i class="fa-solid fa-check-double text-neon-green text-3xl mb-3 block"></i>
        <p class="text-white font-display">Tudo em dia! Nenhuma missão pendente.</p>
      </div>`;
      return;
    }

    tasks.forEach(t => {
      const div = document.createElement('div');
      div.className = 'glass-panel rounded-[24px] p-5 border border-neon-purple/30 flex flex-col gap-4 mb-4';
      div.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <p class="font-display text-base text-white">${t.name}</p>
            <span class="text-xs text-gray-400">${childMap[t.child_id] || 'Aventureiro'}</span>
          </div>
          <div class="flex items-center gap-1 bg-dark-bg/80 px-2 py-1 rounded-lg border border-yellow-400/30">
            <span class="text-xs font-display text-yellow-400">${t.stars}</span>
            <i class="fa-solid fa-star text-yellow-400 text-[10px]"></i>
          </div>
        </div>
        ${t.evidence_note ? `<div class="bg-dark-surface rounded-xl p-3 border border-gray-700">
          <p class="text-sm text-gray-300 italic">"${t.evidence_note}"</p></div>` : ''}
        <div class="flex gap-3">
          <button class="btn-aprovar btn-gaming flex-1 h-12 rounded-xl bg-gradient-to-r
            from-neon-green to-emerald-600 text-white font-display text-sm border-b-4
            border-emerald-900 flex items-center justify-center gap-2">
            <i class="fa-solid fa-check"></i> Aprovar
          </button>
          <button class="btn-rejeitar btn-gaming flex-1 h-12 rounded-xl bg-dark-surface
            text-neon-pink font-bold text-sm border-2 border-neon-pink/50
            flex items-center justify-center gap-2">
            <i class="fa-solid fa-xmark"></i> Rejeitar
          </button>
        </div>`;

      div.querySelector('.btn-aprovar').addEventListener('click', async () => {
        try {
          await DB.updateTaskStatus(t.id, 'approved');
          if (t.child_id) {
            const rows = await db.get('members', 'id=eq.' + t.child_id + '&select=stars');
            const cur  = rows?.[0]?.stars || 0;
            await DB.updateChild(t.child_id, { stars: cur + (t.stars||0) });
          }
          div.remove();
          _toast('+' + t.stars + '⭐ aprovados!', 'ok');
        } catch(e) { _toast('Erro: ' + JSON.stringify(e), 'err'); }
      });

      div.querySelector('.btn-rejeitar').addEventListener('click', async () => {
        const fb = prompt('O que precisa melhorar?');
        if (fb === null) return;
        try {
          await DB.updateTaskStatus(t.id, 'rejected');
          div.remove();
          _toast('Missão devolvida.', 'ok');
        } catch(e) { _toast('Erro', 'err'); }
      });

      queue.appendChild(div);
    });
  } catch(e) { console.error('[pending]', e); }
}

async function _loadRewardsAdmin() {
  const family = DB.family.get();
  if (!family) return;
  const list = document.getElementById('active-rewards-list');
  if (!list) return;

  try {
    const rewards = await DB.getRewards(family.id);
    list.innerHTML = '';
    if (!rewards?.length) {
      list.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Nenhum prêmio cadastrado ainda.</p>';
      return;
    }
    rewards.forEach(r => {
      const div = document.createElement('div');
      div.className = 'glass-panel rounded-2xl p-3 border border-neon-purple/30 flex items-center gap-3 relative overflow-hidden mb-3';
      div.innerHTML = `
        <div class="absolute left-0 top-0 w-1 h-full bg-neon-purple"></div>
        <div class="w-14 h-14 rounded-xl bg-dark-bg border border-neon-purple/50 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-gift text-neon-purple text-xl"></i>
        </div>
        <div class="flex flex-col flex-1 min-w-0">
          <span class="font-display text-sm text-white truncate">${r.name}</span>
          <div class="flex items-center gap-1 mt-1">
            <i class="fa-solid fa-star text-yellow-400 text-[10px]"></i>
            <span class="text-xs font-display text-yellow-400">${r.cost}</span>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <button class="btn-edit text-gray-400 hover:text-neon-purple transition-colors" title="Editar">
            <i class="fa-solid fa-pen text-sm"></i>
          </button>
          <button class="btn-del text-gray-400 hover:text-neon-pink transition-colors" title="Excluir">
            <i class="fa-solid fa-trash-can text-sm"></i>
          </button>
        </div>`;
      div.querySelector('.btn-edit').addEventListener('click', () => _editReward(r));
      div.querySelector('.btn-del').addEventListener('click', async () => {
        if (!confirm('Remover "' + r.name + '"?')) return;
        await DB.deleteReward(r.id);
        div.remove();
      });
      list.appendChild(div);
    });
  } catch(e) { console.error('[rewards]', e); }
}

async function _submitReward() {
  const family = DB.family.get();
  if (!family) return;
  const nameEl = document.querySelector('#reward-creation-form input[type="text"]');
  const costEl = document.querySelector('#reward-creation-form input[type="number"], #reward-creation-form input[placeholder="50"]');

  const name = nameEl?.value?.trim();
  const cost = parseInt(costEl?.value);

  if (!name) return _toast('Digite o nome do prêmio!', 'err');
  if (!cost || cost < 1) return _toast('Defina o custo em estrelas!', 'err');

  try {
    await DB.createReward(family.id, { name, cost });
    _toast('"' + name + '" adicionado! 🎁', 'ok');
    if (nameEl) nameEl.value = '';
    if (costEl) costEl.value = '';
    await _loadRewardsAdmin();
  } catch(e) { _toast('Erro: ' + (e?.message || JSON.stringify(e)), 'err'); }
}

async function _loadChildDashboard(child) {
  // Atualiza nome
  const h1 = document.querySelector('#app-header h1, #hero-stats h1');
  if (h1) h1.textContent = child.name + "'s Space";

  // Saldo
  document.querySelectorAll('#hero-stats .font-display, .text-5xl').forEach(el => {
    if (/^\d+$/.test(el.textContent.trim())) el.textContent = child.stars || 0;
  });

  const family = DB.family.get();
  if (!family) return;

  try {
    const session = DB.session.get();
    const parentId = session?.user?.id || family.owner_id;
    const tasks = await DB.getTasks(parentId, child.id);
    const pending = (tasks||[]).filter(t => !t.done);

    const missionSection = document.getElementById('active-missions');
    if (!missionSection) return;

    const carousel = missionSection.querySelector('.flex.gap-4, .overflow-x-auto .flex, .flex.overflow-x-auto');
    if (!carousel) return;

    if (!pending.length) {
      carousel.innerHTML = `<div class="text-center py-6 w-full">
        <i class="fa-solid fa-trophy text-yellow-400 text-3xl mb-2 block"></i>
        <p class="text-white font-bold font-display">Todas as missões concluídas!</p>
      </div>`;
      return;
    }

    carousel.innerHTML = pending.map(t => `
      <div class="snap-center shrink-0 w-[240px] glass-panel rounded-[24px] p-4 border
           border-neon-blue/40 flex flex-col gap-3">
        <div class="flex justify-between items-start">
          <div class="w-12 h-12 rounded-xl bg-dark-bg border border-neon-blue/50 flex items-center justify-center">
            <i class="fa-solid fa-list-check text-neon-blue text-lg"></i>
          </div>
          <div class="flex items-center gap-1 bg-dark-bg/80 px-2 py-1 rounded-lg border border-yellow-400/30">
            <span class="text-xs font-display text-yellow-400">+${t.stars}</span>
            <i class="fa-solid fa-star text-yellow-400 text-[10px]"></i>
          </div>
        </div>
        <div>
          <p class="font-display text-sm text-white">${t.name}</p>
        </div>
        <button class="btn-iniciar btn-gaming h-10 rounded-xl bg-gradient-to-r from-neon-blue
          to-cyan-600 text-white font-display text-xs border-b-2 border-blue-900
          flex items-center justify-center gap-2"
          data-task-id="${t.id}" data-task='${JSON.stringify(t).replace(/'/g,"&#39;")}'>
          <i class="fa-solid fa-play"></i> Iniciar
        </button>
      </div>`).join('');

    carousel.querySelectorAll('.btn-iniciar').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = JSON.parse(btn.getAttribute('data-task'));
        DB.mission.save(task);
        DB.updateTaskStatus(task.id, 'in_progress').catch(()=>{});
        Tarefito.navigate('realizandoTarefa');
      });
    });
  } catch(e) { console.error('[childDash]', e); }
}

function _loadMissionDetail() {
  const mission = DB.mission.get();
  if (!mission) return;

  const titleEl = document.querySelector('#mission-header h2, #mission-header .font-display');
  if (titleEl) titleEl.textContent = mission.name;

  const starsEl = document.querySelector('#mission-header .font-display.text-xl, #mission-header .text-yellow-400');
  if (starsEl && starsEl.textContent.includes('+')) starsEl.textContent = '+' + mission.stars;

  if (mission.description) {
    const descEl = document.querySelector('#mission-description p');
    if (descEl) descEl.textContent = mission.description;
  }
}

async function _submitMissionDone() {
  const mission = DB.mission.get();
  if (!mission) return _toast('Sessão expirada', 'err');
  const note = document.querySelector('#evidence-submission textarea')?.value?.trim() || '';
  try {
    await DB.updateTaskStatus(mission.id, 'submitted');
    DB.mission.clear();
    _toast('Missão enviada para aprovação! ⭐', 'ok');
    setTimeout(() => Tarefito.navigate('dashboardCrianca'), 1500);
  } catch(e) { _toast('Erro: ' + (e?.message||''), 'err'); }
}

async function _loadShop(child) {
  document.querySelectorAll('#star-balance .font-display, #star-balance .text-4xl').forEach(el => {
    if (/^\d+$/.test(el.textContent.trim())) el.textContent = child.stars || 0;
  });

  const family = DB.family.get();
  if (!family) return;

  try {
    const rewards = await DB.getRewards(family.id);
    const grid = document.querySelector('#reward-catalog .grid');
    if (!grid || !rewards?.length) return;

    grid.innerHTML = rewards.map(r => {
      const can = (child.stars||0) >= r.cost;
      return `
        <div class="glass-panel rounded-[20px] p-3 border border-neon-purple/30 flex flex-col gap-3">
          <div class="w-full h-24 rounded-xl bg-dark-surface border border-gray-700 flex items-center justify-center">
            <i class="fa-solid fa-gift text-neon-purple text-3xl"></i>
          </div>
          <div class="flex flex-col gap-1">
            <h3 class="font-display text-sm text-white truncate">${r.name}</h3>
            <div class="flex items-center gap-1">
              <i class="fa-solid fa-star text-yellow-400 text-xs"></i>
              <span class="font-display text-sm text-yellow-400">${r.cost}</span>
            </div>
          </div>
          <button class="btn-resgatar w-full py-2 rounded-lg text-[10px] font-bold uppercase transition-all
            ${can ? 'bg-dark-surface border border-neon-purple/50 text-neon-purple hover:bg-neon-purple/20'
                  : 'bg-dark-surface border border-gray-600 text-gray-400 cursor-not-allowed opacity-60'}"
            data-id="${r.id}" data-name="${r.name}" data-cost="${r.cost}"
            ${can ? '' : 'disabled'}>
            ${can ? 'Resgatar' : 'Faltam '+(r.cost-(child.stars||0))+'⭐'}
          </button>
        </div>`;
    }).join('');

    grid.querySelectorAll('.btn-resgatar:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Resgatar "' + btn.dataset.name + '" por ' + btn.dataset.cost + '⭐?')) return;
        try {
          await DB.requestRedemption(child.id, btn.dataset.id, parseInt(btn.dataset.cost));
          btn.disabled = true; btn.textContent = 'Pendente ⏳';
          _toast('Resgate solicitado! Aguardando aprovação 🎉', 'ok');
        } catch(e) { _toast('Erro: '+(e?.message||''), 'err'); }
      });
    });
  } catch(e) { console.error('[shop]', e); }
}

function _loadChildProfile(child) {
  const nameEl = document.querySelector('#profile-hero h2, #profile-hero .font-display');
  if (nameEl) {
    nameEl.innerHTML = child.name +
      ' <i class="fa-solid fa-pen text-neon-cyan text-sm cursor-pointer" id="btn-edit-name"></i>';
  }
  document.getElementById('btn-edit-name')?.addEventListener('click', async () => {
    const newName = prompt('Novo apelido:', child.name);
    if (!newName?.trim() || newName === child.name) return;
    await DB.updateChild(child.id, { name: newName.trim() });
    child.name = newName.trim();
    DB.child.save(child);
    _loadChildProfile(child);
  });
  // Stats
  const statEls = document.querySelectorAll('#stats-grid .font-display.text-2xl, #stats-grid .text-2xl');
  const vals = [child.stars||0, '—', child.total_stars_earned||child.stars||0, 0];
  statEls.forEach((el, i) => { if (vals[i] !== undefined) el.textContent = vals[i]; });
}

async function _editChildName(childId, currentName) {
  const card = document.querySelector(`[data-child-id="${childId}"]`);
  if (!card) return;

  const nameEl  = card.querySelector('.child-name');
  const editBtn = card.querySelector('.btn-edit-name');

  const input = document.createElement('input');
  input.type  = 'text';
  input.value = currentName;
  input.style.cssText = 'background:rgba(11,14,20,0.8);border:1px solid #a855f7;border-radius:8px;' +
    'padding:2px 10px;color:#fff;font-family:"Fredoka One",cursive;font-size:18px;width:150px;outline:none;';

  const okBtn = document.createElement('button');
  okBtn.innerHTML  = '<i class="fa-solid fa-check"></i>';
  okBtn.style.cssText = 'color:#22c55e;margin-left:4px;background:none;border:none;cursor:pointer;font-size:14px;';

  nameEl.replaceWith(input);
  editBtn.replaceWith(okBtn);
  input.focus(); input.select();

  const save = async () => {
    const newName = input.value.trim();
    if (!newName) return;
    try {
      await DB.updateChild(childId, { name: newName });
      _toast('Nome atualizado!', 'ok');
    } catch(e) { _toast('Erro ao salvar nome', 'err'); }
    await _loadChildren();
  };

  okBtn.addEventListener('click', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  save();
    if (e.key === 'Escape') _loadChildren();
  });
}

async function _regenPin(childId) {
  const pin = _generatePin();
  try {
    await DB.updateChild(childId, { pin });
    _toast('Novo PIN: ' + pin, 'ok');
    await _loadChildren();
  } catch(e) { _toast('Erro ao gerar PIN', 'err'); }
}

function _editReward(r) {
  const existing = document.getElementById('tf-edit-reward-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'tf-edit-reward-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9998;' +
    'display:flex;align-items:center;justify-content:center;padding:20px;';

  modal.innerHTML = `
    <div style="background:#13131a;border:1px solid rgba(168,85,247,0.4);border-radius:24px;
                padding:28px;width:100%;max-width:380px;box-shadow:0 0 40px rgba(168,85,247,0.2);">
      <h2 style="color:#fff;font-family:'Fredoka One',sans-serif;font-size:20px;margin:0 0 20px;display:flex;align-items:center;gap:8px;">
        <i class="fa-solid fa-pen" style="color:#a855f7;font-size:16px;"></i> Editar Prêmio
      </h2>

      <label style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        Nome do Prêmio
      </label>
      <input id="tf-edit-name" type="text" value="${r.name.replace(/"/g,'&quot;')}"
        style="width:100%;height:48px;background:#1e1e2e;border:2px solid #374151;border-radius:12px;
               padding:0 16px;color:#fff;font-weight:700;font-size:15px;margin:8px 0 16px;box-sizing:border-box;" />

      <label style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        Custo em Estrelas
      </label>
      <div style="position:relative;margin:8px 0 24px;">
        <i class="fa-solid fa-star" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#facc15;font-size:13px;"></i>
        <input id="tf-edit-cost" type="number" value="${r.cost}"
          style="width:100%;height:48px;background:#1e1e2e;border:2px solid #374151;border-radius:12px;
                 padding:0 16px 0 40px;color:#fff;font-weight:700;font-size:15px;box-sizing:border-box;" />
      </div>

      <div style="display:flex;gap:12px;">
        <button id="tf-edit-cancel"
          style="flex:1;height:48px;border-radius:14px;border:2px solid #374151;
                 background:transparent;color:#9ca3af;font-weight:700;cursor:pointer;font-size:14px;">
          Cancelar
        </button>
        <button id="tf-edit-save"
          style="flex:2;height:48px;border-radius:14px;border:none;
                 background:linear-gradient(90deg,#a855f7,#3b82f6);color:#fff;
                 font-family:'Fredoka One',sans-serif;font-size:16px;cursor:pointer;
                 box-shadow:0 0 20px rgba(168,85,247,0.4);">
          Salvar Alterações
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.getElementById('tf-edit-name').focus();

  document.getElementById('tf-edit-cancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  document.getElementById('tf-edit-save').addEventListener('click', async () => {
    const name = document.getElementById('tf-edit-name').value.trim();
    const cost = parseInt(document.getElementById('tf-edit-cost').value);
    if (!name) return;
    if (!cost || cost < 1) return _toast('Custo inválido', 'err');
    const saveBtn = document.getElementById('tf-edit-save');
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    saveBtn.disabled = true;
    try {
      await DB.updateReward(r.id, { name, cost });
      modal.remove();
      _toast('"' + name + '" atualizado! ✏️', 'ok');
      await _loadRewardsAdmin();
    } catch(e) {
      saveBtn.innerHTML = 'Salvar Alterações';
      saveBtn.disabled = false;
      _toast('Erro: ' + (e?.message || JSON.stringify(e)), 'err');
    }
  });
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

function _bindBackBtn() {
  const btn = document.querySelector('#app-header button:first-child');
  if (btn) btn.addEventListener('click', () => Tarefito.goBack());
}

// Nav responsável — mapeia por texto do span
function _bindBottomNav() {
  const map = { 'Painel':'dashboard', 'Missões':'criarTarefa', 'Filhos':'gerenciarCriancas', 'Prêmios':'gerenciarLoja', 'Validar':'aprovarTarefa' };
  document.querySelectorAll('nav a').forEach(a => {
    const label = a.querySelector('span')?.textContent?.trim();
    if (label && map[label]) {
      a.addEventListener('click', e => { e.preventDefault(); Tarefito.navigate(map[label]); });
    }
  });
}

// Nav criança — mapeia por texto do span
function _bindBottomNavChild() {
  const map = { 'Missões':'dashboardCrianca', 'Loja':'lojaCrianca' };
  document.querySelectorAll('nav a').forEach(a => {
    const label = a.querySelector('span')?.textContent?.trim();
    if (!label) return;
    if (label === 'Sair') {
      a.addEventListener('click', e => {
        e.preventDefault();
        auth.signOut().then(() => Tarefito.navigate('login'));
      });
    } else if (map[label]) {
      a.addEventListener('click', e => { e.preventDefault(); Tarefito.navigate(map[label]); });
    }
  });
}

function _onBtnText(text, cb) {
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim().includes(text)) btn.addEventListener('click', cb);
  });
}

function _toast(msg, type) {
  let el = document.getElementById('tf-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tf-toast';
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
      'padding:10px 22px;border-radius:14px;font-weight:700;font-size:13px;' +
      'z-index:99999;box-shadow:0 4px 24px rgba(0,0,0,0.5);color:#fff;' +
      'font-family:Nunito,sans-serif;white-space:nowrap;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = type === 'err' ? '#ef4444' : '#22c55e';
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}
