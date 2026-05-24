/**
 * ============================================================
 *  TAREFITO — Navegação + Lógica de telas
 *  Requer: tarefito-supabase.js carregado antes
 * ============================================================
 */

const Tarefito = {
  pages: {
    login:             'login_copy.html',
    cadastro:          'tela0cadastro.html',
    gerenciarCriancas: 'tela2gerenciarcriancas.html',
    dashboard:         'tela3dashboard.html',
    criarTarefa:       'tela4criartarefa.html',
    aprovarTarefa:     'tela5aprovartarefa.html',
    gerenciarLoja:     'tela6gerenciarloja.html',
    dashboardCrianca:  'tela7dashboardvisaocrianca.html',
    realizandoTarefa:  'tela8realizandotarefa.html',
    lojaCrianca:       'tela9lojavisaocrianca.html',
    perfilCrianca:     'tela10perfilcrianca.html',
  },
  navigate(key) {
    const p = this.pages[key];
    if (p) window.location.href = p;
    else console.warn('[Nav] página desconhecida:', key);
  },
  goBack() { history.back(); },
};

// Atalhos globais usados inline nos HTMLs
function goBack()             { Tarefito.goBack(); }
function goToLogin()          { auth.signOut().then(() => Tarefito.navigate('login')); }
function goToDashboard()      { Tarefito.navigate('gerenciarCriancas'); }
function navigateToCadastro() { Tarefito.navigate('cadastro'); }

// ─── Inicialização por página ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';
  console.log('[Nav] página:', page);

  switch (page) {

    // ══════════════════════════════════════════════════════
    //  LOGIN
    // ══════════════════════════════════════════════════════
    case 'login_copy.html': {
      const btn = document.getElementById('cta-btn');
      if (!btn) break;

      btn.addEventListener('click', async () => {
        const isChild = btn.style.background?.includes('22c55e') ||
                        btn.style.borderBottomColor === '#14532d';

        if (isChild) {
          const pin = document.querySelector('.input-gaming-green')?.value?.trim();
          if (!pin) return _showError('Digite o código secreto!');
          try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            const members = await db.get('members', 'pin=eq.' + pin + '&role=eq.child&select=*');
            if (!members?.length) {
              btn.innerHTML = 'INICIAR MISSÃO <i class="fa-solid fa-rocket"></i>';
              return _showError('Código secreto inválido!');
            }
            // Carregar família da criança
            const fam = await db.get('families', 'id=eq.' + members[0].family_id + '&select=*');
            if (fam?.[0]) DB.family.save(fam[0]);
            DB.child.save(members[0]);
            Tarefito.navigate('dashboardCrianca');
          } catch (e) {
            console.error(e);
            btn.innerHTML = 'INICIAR MISSÃO <i class="fa-solid fa-rocket"></i>';
            _showError('Erro ao conectar. Tente novamente.');
          }

        } else {
          const email = document.querySelector('#email-input-group input')?.value?.trim();
          const pass  = document.querySelector('#password-input-group input')?.value?.trim();
          if (!email || !pass) return _showError('Preencha email e senha!');
          try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            const session = await auth.signIn(email, pass);
            const user    = session.user;
            const name    = user.user_metadata?.full_name || 'Responsável';
            await DB.getOrCreateFamily(user.id, name);
            Tarefito.navigate('gerenciarCriancas');
          } catch (e) {
            console.error(e);
            btn.innerHTML = 'INICIAR MISSÃO <i class="fa-solid fa-rocket"></i>';
            _showError(e.message || 'Email ou senha incorretos.');
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

    // ══════════════════════════════════════════════════════
    //  GERENCIAR CRIANÇAS
    // ══════════════════════════════════════════════════════
    case 'tela2gerenciarcriancas.html': {
      if (!requireAuth()) break;
      _loadChildren();
      _onBtn('ACESSAR PAINEL', () => Tarefito.navigate('dashboard'));
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ══════════════════════════════════════════════════════
    //  DASHBOARD RESPONSÁVEL
    // ══════════════════════════════════════════════════════
    case 'tela3dashboard.html': {
      if (!requireAuth()) break;
      _loadDashboard();
      _onBtn('Criar Missão',   () => Tarefito.navigate('criarTarefa'));
      _onBtn('Aprovar',        () => Tarefito.navigate('aprovarTarefa'));
      _onBtn('Recompensas',    () => Tarefito.navigate('gerenciarLoja'));
      _onBtn('Trocar Criança', () => Tarefito.navigate('gerenciarCriancas'));
      _onBtn('Ver Todos',      () => Tarefito.navigate('aprovarTarefa'));
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ══════════════════════════════════════════════════════
    //  CRIAR TAREFA
    // ══════════════════════════════════════════════════════
    case 'tela4criartarefa.html': {
      if (!requireAuth()) break;
      _loadChildSelectors();
      _onBtn('Publicar Missão', _submitTask);
      _onBtn('Cancelar', () => Tarefito.navigate('dashboard'));
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ══════════════════════════════════════════════════════
    //  APROVAR TAREFA
    // ══════════════════════════════════════════════════════
    case 'tela5aprovartarefa.html': {
      if (!requireAuth()) break;
      _loadPendingTasks();
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ══════════════════════════════════════════════════════
    //  GERENCIAR LOJA
    // ══════════════════════════════════════════════════════
    case 'tela6gerenciarloja.html': {
      if (!requireAuth()) break;
      _loadRewardsAdmin();
      _onBtn('Adicionar à Loja', _submitReward);
      _bindBackBtn();
      _bindBottomNav();
      break;
    }

    // ══════════════════════════════════════════════════════
    //  DASHBOARD CRIANÇA
    // ══════════════════════════════════════════════════════
    case 'tela7dashboardvisaocrianca.html': {
      const child = DB.child.get();
      if (!child) { Tarefito.navigate('login'); break; }
      _loadChildDashboard(child);
      _onBtn('Ir à', () => Tarefito.navigate('lojaCrianca'));
      _bindBottomNavChild();
      break;
    }

    // ══════════════════════════════════════════════════════
    //  REALIZANDO TAREFA
    // ══════════════════════════════════════════════════════
    case 'tela8realizandotarefa.html': {
      const child = DB.child.get();
      if (!child) { Tarefito.navigate('login'); break; }
      _loadMissionDetail();
      _onBtn('Finalizar Missão', _submitMissionDone);
      _bindBackBtn();
      _bindBottomNavChild();
      break;
    }

    // ══════════════════════════════════════════════════════
    //  LOJA CRIANÇA
    // ══════════════════════════════════════════════════════
    case 'tela9lojavisaocrianca.html': {
      const child = DB.child.get();
      if (!child) { Tarefito.navigate('login'); break; }
      _loadShop(child);
      _bindBackBtn();
      _bindBottomNavChild();
      break;
    }

    // ══════════════════════════════════════════════════════
    //  PERFIL CRIANÇA
    // ══════════════════════════════════════════════════════
    case 'tela10perfilcrianca.html': {
      const child = DB.child.get();
      if (!child) { Tarefito.navigate('login'); break; }
      _loadChildProfile(child);
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
  const family = DB.family.get();
  if (!family) return;

  const list = document.getElementById('children-list');
  if (!list) return;

  try {
    const children = await DB.getChildren(family.id);

    // Remove cards mockados
    list.querySelectorAll('.glass-panel, [class*="rounded-\\[24px\\]"]').forEach(el => el.remove());
    // Remove botão mockado de novo explorador
    list.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Novo Explorador')) b.remove(); });

    if (!children?.length) {
      list.innerHTML = `<p style="color:#9ca3af;text-align:center;padding:24px;font-weight:700;">
        Nenhum explorador ainda. Adicione o primeiro!</p>`;
    } else {
      list.innerHTML = children.map(c => _childCardHTML(c)).join('');
      // Bind: ver criança
      list.querySelectorAll('.btn-ver-child').forEach(btn => {
        btn.addEventListener('click', () => {
          DB.child.save(JSON.parse(btn.dataset.child));
          Tarefito.navigate('dashboardCrianca');
        });
      });
    }

    // Adiciona botão de novo explorador
    const addBtn = document.createElement('button');
    addBtn.className = 'w-full h-20 rounded-[24px] border-2 border-dashed border-gray-700 ' +
      'bg-dark-surface/30 flex items-center justify-center gap-3 text-gray-400 ' +
      'hover:text-neon-purple hover:border-neon-purple transition-all';
    addBtn.innerHTML = '<i class="fa-solid fa-plus text-xl"></i><span class="font-display text-lg">Novo Explorador</span>';
    addBtn.addEventListener('click', _showAddChildForm);
    list.appendChild(addBtn);

  } catch(e) { console.error('[loadChildren]', e); }
}

function _childCardHTML(c) {
  const safeChild = JSON.stringify(c).replace(/'/g, '&#39;');
  return `
    <div class="glass-panel rounded-[24px] p-5 border border-gray-700 relative overflow-hidden mb-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-green-900 to-teal-900
               border-2 border-neon-green shadow-neon-green flex items-center justify-center
               text-2xl font-bold text-white">
            ${c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 class="font-display text-lg text-white">${c.name}</h3>
            <span class="text-xs text-gray-400 font-bold">
              <i class="fa-solid fa-star text-yellow-400 text-[10px] mr-1"></i>${c.stars || 0} estrelas
            </span>
          </div>
        </div>
        <button class="btn-ver-child w-8 h-8 rounded-lg bg-dark-surface border border-gray-700
                text-gray-400 flex items-center justify-center"
                data-child='${safeChild}'>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2 text-gray-400">
          <i class="fa-solid fa-${c.pin ? 'lock' : 'unlock'}"></i>
          <span>PIN: ${c.pin ? '****' : 'Não configurado'}</span>
        </div>
        <span class="text-gray-400">Meta: <b class="text-white">${c.weekly_goal || 50}⭐/sem</b></span>
      </div>
    </div>`;
}

function _showAddChildForm() {
  const name = prompt('Nome do explorador:');
  if (!name?.trim()) return;
  const pin  = prompt('Código secreto para login (ex: STAR123):');
  if (!pin?.trim()) return;
  const goalStr = prompt('Meta semanal de estrelas (padrão: 50):') || '50';
  const goal = parseInt(goalStr) || 50;

  const family = DB.family.get();
  if (!family) return alert('Sessão expirada. Faça login novamente.');

  DB.createChild(family.id, name.trim(), pin.trim(), goal)
    .then(() => _loadChildren())
    .catch(e => alert('Erro ao criar explorador: ' + (e?.message || JSON.stringify(e))));
}

async function _loadDashboard() {
  const family = DB.family.get();
  if (!family) return;
  try {
    const [children, pending] = await Promise.all([
      DB.getChildren(family.id),
      DB.getPendingApproval(family.id),
    ]);
    const totalStars = (children || []).reduce((s, c) => s + (c.stars || 0), 0);
    // Atualiza números nos cards de stats
    const bigNums = document.querySelectorAll('.font-display.text-3xl');
    if (bigNums[0]) bigNums[0].textContent = totalStars;
    if (bigNums[1]) bigNums[1].textContent = pending?.length || 0;
    // Badge
    document.querySelectorAll('.rounded-full.bg-neon-pink').forEach(el => {
      if (el.textContent.trim().length <= 2) el.textContent = pending?.length || 0;
    });
  } catch(e) { console.error('[dashboard]', e); }
}

async function _loadChildSelectors() {
  const family = DB.family.get();
  if (!family) return;
  const children = await DB.getChildren(family.id).catch(() => []);
  const container = document.querySelector('.flex.gap-3.overflow-x-auto');
  if (!container || !children?.length) return;

  container.innerHTML = children.map(c => `
    <label class="relative cursor-pointer shrink-0">
      <input type="checkbox" name="assigned_child" value="${c.id}"
             class="peer sr-only radio-gaming" />
      <div class="w-16 h-20 rounded-xl border-2 border-gray-700 bg-dark-surface flex flex-col
           items-center justify-center gap-2 transition-all peer-checked:border-neon-blue
           peer-checked:bg-neon-blue/10">
        <div class="w-10 h-10 rounded-full bg-dark-bg border border-gray-600 flex items-center
             justify-center font-bold text-white text-lg">${c.name.charAt(0)}</div>
        <span class="text-[10px] font-bold text-white">${c.name}</span>
      </div>
    </label>`).join('') + `
    <label class="relative cursor-pointer shrink-0">
      <input type="checkbox" name="assigned_child" value="all" class="peer sr-only" />
      <div class="w-16 h-20 rounded-xl border-2 border-gray-700 bg-dark-surface flex flex-col
           items-center justify-center gap-2 transition-all peer-checked:border-neon-blue">
        <div class="w-10 h-10 rounded-full border border-gray-600 bg-dark-bg flex items-center justify-center">
          <i class="fa-solid fa-users text-gray-400"></i>
        </div>
        <span class="text-[10px] font-bold text-white">Todos</span>
      </div>
    </label>`;
}

async function _submitTask() {
  const family = DB.family.get();
  if (!family) return;

  const title = document.querySelector('input[placeholder*="Arrumar"]')?.value?.trim() ||
                document.querySelector('input[type="text"]')?.value?.trim();
  if (!title) return alert('Digite o título da missão!');

  const desc   = document.querySelector('textarea')?.value?.trim();
  const stars  = parseInt(document.querySelector('input[type="range"]')?.value || '15');
  const repeat = document.querySelector('select')?.value || 'none';
  const checked = [...document.querySelectorAll('[name="assigned_child"]:checked')];
  const allSelected = checked.some(c => c.value === 'all');

  let targets = checked.map(c => c.value).filter(v => v !== 'all');
  if (allSelected) {
    const ch = await DB.getChildren(family.id);
    targets = ch.map(c => c.id);
  }
  if (!targets.length) return alert('Selecione pelo menos uma criança!');

  try {
    await Promise.all(targets.map(memberId =>
      DB.createTask(family.id, {
        title, description: desc || '',
        assigned_to: memberId,
        stars_reward: stars,
        repeat_type: repeat,
      })
    ));
    alert('Missão publicada! 🚀');
    Tarefito.navigate('dashboard');
  } catch(e) { alert('Erro: ' + (e?.message || JSON.stringify(e))); }
}

async function _loadPendingTasks() {
  const family = DB.family.get();
  if (!family) return;
  const queue = document.getElementById('approval-queue');
  if (!queue) return;

  try {
    const tasks = await DB.getPendingApproval(family.id);

    // Limpa cards mockados
    queue.querySelectorAll('.glass-panel').forEach(el => el.remove());

    if (!tasks?.length) {
      queue.innerHTML = `<div class="glass-panel rounded-[24px] p-8 border border-gray-700 text-center">
        <i class="fa-solid fa-check-double text-neon-green text-3xl mb-3 block"></i>
        <p class="text-white font-bold font-display">Tudo em dia! Nenhuma missão pendente.</p>
      </div>`;
      return;
    }

    // Atualiza contador
    document.querySelectorAll('.font-display.text-2xl').forEach((el, i) => {
      if (i === 0) el.textContent = tasks.length;
    });

    tasks.forEach(t => {
      const div = document.createElement('div');
      div.className = 'glass-panel rounded-[24px] p-5 border border-neon-purple/30 flex flex-col gap-4 mb-4';
      div.dataset.taskId = t.id;
      div.dataset.stars  = t.stars_reward;
      div.dataset.memberId = t.assigned_to || (t.members?.id || '');
      div.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <span class="font-display text-base text-white">${t.title}</span><br>
            <span class="text-xs text-gray-400">${t.members?.name || 'Criança'}</span>
          </div>
          <div class="flex items-center gap-1 bg-dark-bg/80 px-2 py-1 rounded-lg border border-yellow-400/30">
            <span class="text-xs font-display text-yellow-400">${t.stars_reward}</span>
            <i class="fa-solid fa-star text-yellow-400 text-[10px]"></i>
          </div>
        </div>
        ${t.evidence_note ? `<div class="bg-dark-surface rounded-xl p-4 border border-gray-700">
          <p class="text-sm text-gray-300 font-bold italic">"${t.evidence_note}"</p></div>` : ''}
        <div class="flex gap-3">
          <button class="btn-aprovar btn-gaming flex-1 h-12 rounded-xl bg-gradient-to-r
            from-neon-green to-emerald-600 text-white font-display text-sm border-b-4
            border-emerald-900 flex items-center justify-center gap-2 shadow-neon-green">
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
          if (t.assigned_to) {
            const rows = await db.get('members', 'id=eq.' + t.assigned_to + '&select=stars');
            const cur  = rows?.[0]?.stars || 0;
            await DB.updateChild(t.assigned_to, { stars: cur + t.stars_reward });
          }
          div.remove();
          _showSuccess('+' + t.stars_reward + '⭐ creditados!');
        } catch(e) { alert('Erro ao aprovar: ' + JSON.stringify(e)); }
      });

      div.querySelector('.btn-rejeitar').addEventListener('click', async () => {
        const feedback = prompt('O que precisa ser ajustado?');
        if (feedback === null) return;
        try {
          await DB.updateTaskStatus(t.id, 'rejected');
          if (feedback && t.assigned_to) {
            await db.post('feedbacks', { task_id: t.id, to_id: t.assigned_to, message: feedback }).catch(() => {});
          }
          div.remove();
        } catch(e) { alert('Erro: ' + JSON.stringify(e)); }
      });

      queue.appendChild(div);
    });

  } catch(e) { console.error('[pendingTasks]', e); }
}

async function _loadRewardsAdmin() {
  const family = DB.family.get();
  if (!family) return;
  const section = document.getElementById('active-rewards-list');
  if (!section) return;

  try {
    const rewards = await DB.getRewards(family.id);
    // Remove items mockados
    section.querySelectorAll('.glass-panel, .rounded-2xl').forEach(el => el.remove());
    if (!rewards?.length) return;

    rewards.forEach(r => {
      const div = document.createElement('div');
      div.className = 'glass-panel rounded-2xl p-3 border border-neon-purple/30 flex items-center gap-3 relative overflow-hidden mb-3';
      div.innerHTML = `
        <div class="absolute left-0 top-0 w-1 h-full bg-neon-purple"></div>
        <div class="w-14 h-14 rounded-xl bg-dark-bg border border-neon-purple/50 flex items-center justify-center">
          <i class="fa-solid fa-gift text-neon-purple text-xl"></i>
        </div>
        <div class="flex flex-col flex-1">
          <span class="font-display text-sm text-white">${r.name}</span>
          <span class="text-[10px] text-gray-400">${r.type || 'Digital'} · Estoque: ${r.stock ?? '∞'}</span>
        </div>
        <div class="flex flex-col items-end gap-1">
          <div class="flex items-center gap-1 bg-dark-bg/80 px-2 py-1 rounded-lg border border-yellow-400/30">
            <span class="text-xs font-display text-yellow-400">${r.cost}</span>
            <i class="fa-solid fa-star text-yellow-400 text-[10px]"></i>
          </div>
          <button class="btn-del text-gray-500 hover:text-neon-pink" data-id="${r.id}">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>`;
      div.querySelector('.btn-del').addEventListener('click', async () => {
        if (!confirm('Remover este prêmio?')) return;
        await DB.deleteReward(r.id);
        div.remove();
      });
      section.appendChild(div);
    });
  } catch(e) { console.error('[rewardsAdmin]', e); }
}

async function _submitReward() {
  const family = DB.family.get();
  if (!family) return;

  const name  = document.querySelector('input[placeholder*="Videogame"], input[placeholder*="Prêmio"]')?.value?.trim();
  const cost  = parseInt(document.querySelector('input[placeholder="50"]')?.value);
  const stock = document.querySelector('input[placeholder="∞"]')?.value || null;
  const type  = document.querySelector('[name="reward_type"]:checked')
                        ?.closest('label')?.querySelector('span')?.textContent?.trim() || 'Digital';
  const rarity = document.querySelector('[name="rarity"]:checked')
                         ?.closest('label')?.querySelector('span')?.textContent?.trim() || 'Comum';

  if (!name) return alert('Digite o nome do prêmio!');
  if (!cost || cost < 1) return alert('Defina o custo em estrelas!');

  try {
    await DB.createReward(family.id, { name, cost, stock: stock ? parseInt(stock) : null, type, rarity });
    _showSuccess('Prêmio adicionado à loja! 🎁');
    // Limpa campos
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(i => i.value = '');
    await _loadRewardsAdmin();
  } catch(e) { alert('Erro: ' + (e?.message || JSON.stringify(e))); }
}

async function _loadChildDashboard(child) {
  // Nome
  const header = document.querySelector('h1.font-display');
  if (header) header.textContent = child.name + "'s Space";

  // Saldo de estrelas
  document.querySelectorAll('.font-display.text-5xl, .text-5xl').forEach(el => {
    el.textContent = child.stars || 0;
  });

  // Missões do dia
  const family = DB.family.get();
  if (!family) return;

  try {
    const tasks = await DB.getTasks(family.id, child.id);
    const pending = (tasks || []).filter(t => t.status === 'pending');

    const carousel = document.querySelector('#active-missions .flex.gap-4, #active-missions .overflow-x-auto');
    if (carousel && pending.length) {
      carousel.innerHTML = pending.map(t => `
        <div class="snap-center shrink-0 w-[240px] glass-panel rounded-[24px] p-4 border
             border-neon-blue/40 flex flex-col gap-3 relative overflow-hidden">
          <div class="flex justify-between items-start">
            <div class="w-12 h-12 rounded-xl bg-dark-bg border border-neon-blue/50 flex items-center justify-center">
              <i class="fa-solid fa-list-check text-neon-blue text-lg"></i>
            </div>
            <div class="flex items-center gap-1 bg-dark-bg/80 px-2 py-1 rounded-lg border border-yellow-400/30">
              <span class="text-xs font-display text-yellow-400">+${t.stars_reward}</span>
              <i class="fa-solid fa-star text-yellow-400 text-[10px]"></i>
            </div>
          </div>
          <div>
            <span class="font-display text-base text-white">${t.title}</span>
            ${t.description ? `<p class="text-[10px] text-gray-400 mt-1">${t.description}</p>` : ''}
          </div>
          <div class="flex justify-end">
            <button class="btn-iniciar btn-gaming px-4 py-2 rounded-xl bg-gradient-to-r
              from-neon-blue to-cyan-600 text-white font-display text-xs shadow-neon-blue
              border-b-2 border-blue-900" data-task='${JSON.stringify(t).replace(/'/g,"&#39;")}'>
              Iniciar
            </button>
          </div>
        </div>`).join('');

      carousel.querySelectorAll('.btn-iniciar').forEach(btn => {
        btn.addEventListener('click', () => {
          const task = JSON.parse(btn.dataset.task);
          DB.mission.save(task);
          DB.updateTaskStatus(task.id, 'in_progress').catch(() => {});
          Tarefito.navigate('realizandoTarefa');
        });
      });
    } else if (carousel && !pending.length) {
      carousel.innerHTML = `<div class="text-center py-8 w-full">
        <i class="fa-solid fa-trophy text-yellow-400 text-3xl mb-2 block"></i>
        <p class="text-white font-bold font-display">Todas as missões concluídas!</p>
      </div>`;
    }
  } catch(e) { console.error('[childDashboard]', e); }
}

function _loadMissionDetail() {
  const mission = DB.mission.get();
  if (!mission) return;

  // Título
  document.querySelectorAll('h2.font-display').forEach(el => {
    if (el.textContent.length > 3) el.textContent = mission.title;
  });
  // Estrelas
  document.querySelectorAll('.font-display.text-xl').forEach(el => {
    if (el.textContent.includes('+')) el.textContent = '+' + mission.stars_reward;
  });
  // Descrição
  if (mission.description) {
    const p = document.querySelector('#mission-description p, .text-sm.text-gray-300');
    if (p) p.textContent = mission.description;
  }
}

async function _submitMissionDone() {
  const mission = DB.mission.get();
  const child   = DB.child.get();
  if (!mission || !child) return alert('Erro: sessão expirada.');

  const note = document.querySelector('textarea')?.value?.trim();

  try {
    await DB.updateTaskStatus(mission.id, 'submitted');
    if (note) {
      await db.patch('tasks', { evidence_note: note }, 'id=eq.' + mission.id);
    }
    DB.mission.clear();
    _showSuccess('Missão enviada para aprovação! ⭐');
    setTimeout(() => Tarefito.navigate('dashboardCrianca'), 1500);
  } catch(e) { alert('Erro: ' + (e?.message || JSON.stringify(e))); }
}

async function _loadShop(child) {
  // Saldo
  document.querySelectorAll('.font-display.text-4xl').forEach(el => {
    el.textContent = child.stars || 0;
  });

  const family = DB.family.get();
  if (!family) return;

  try {
    const rewards = await DB.getRewards(family.id);
    const grid = document.querySelector('#reward-catalog .grid, .grid.grid-cols-2');
    if (!grid || !rewards?.length) return;

    grid.innerHTML = rewards.map(r => {
      const can = (child.stars || 0) >= r.cost;
      const rc  = { Comum: 'neon-green', Raro: 'neon-blue', Épico: 'neon-purple', Lendário: 'neon-cyan' }[r.rarity] || 'neon-green';
      return `
        <div class="glass-panel rounded-[20px] p-3 border border-${rc}/30 flex flex-col gap-3 relative overflow-hidden">
          <div class="w-full h-24 rounded-xl bg-dark-surface border border-gray-700 flex items-center justify-center">
            <i class="fa-solid fa-gift text-${rc} text-3xl"></i>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[9px] font-bold text-${rc} uppercase">${r.rarity || 'Comum'}</span>
            <h3 class="font-display text-sm text-white truncate">${r.name}</h3>
            <div class="flex items-center gap-1">
              <i class="fa-solid fa-star text-yellow-400 text-xs"></i>
              <span class="font-display text-sm text-yellow-400">${r.cost}</span>
            </div>
          </div>
          <button class="btn-resgatar w-full py-2 rounded-lg text-[10px] font-bold uppercase
            ${can ? 'bg-dark-surface border border-' + rc + '/50 text-' + rc : 'bg-dark-surface border border-gray-600 text-gray-400 cursor-not-allowed'}"
            data-reward-id="${r.id}" data-reward-name="${r.name}" data-cost="${r.cost}"
            ${can ? '' : 'disabled'}>
            ${can ? 'Resgatar' : 'Faltam ' + (r.cost - child.stars) + '⭐'}
          </button>
        </div>`;
    }).join('');

    grid.querySelectorAll('.btn-resgatar:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Resgatar "' + btn.dataset.rewardName + '" por ' + btn.dataset.cost + ' estrelas?')) return;
        try {
          await DB.requestRedemption(child.id, btn.dataset.rewardId, parseInt(btn.dataset.cost));
          btn.disabled = true;
          btn.textContent = 'Pendente ⏳';
          btn.className = btn.className.replace('cursor-pointer', '');
          _showSuccess('Resgate solicitado! Aguardando aprovação 🎉');
        } catch(e) { alert('Erro: ' + (e?.message || JSON.stringify(e))); }
      });
    });
  } catch(e) { console.error('[shop]', e); }
}

function _loadChildProfile(child) {
  // Nome
  document.querySelectorAll('h2.font-display').forEach(el => {
    if (el.textContent.length < 30) {
      el.innerHTML = child.name + ' <i class="fa-solid fa-pen text-neon-cyan text-sm cursor-pointer" id="btn-edit-name"></i>';
    }
  });
  document.getElementById('btn-edit-name')?.addEventListener('click', async () => {
    const newName = prompt('Novo apelido:', child.name);
    if (newName?.trim() && newName !== child.name) {
      await DB.updateChild(child.id, { name: newName.trim() });
      child.name = newName.trim();
      DB.child.save(child);
      _loadChildProfile(child);
    }
  });

  // Stats
  const stats = [child.stars || 0, '—', child.total_stars_earned || child.stars || 0, 0];
  document.querySelectorAll('.font-display.text-2xl').forEach((el, i) => {
    if (stats[i] !== undefined) el.textContent = stats[i];
  });
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

function _bindBackBtn() {
  const btn = document.querySelector('header button:first-child, header button');
  if (btn) btn.addEventListener('click', () => Tarefito.goBack());
}

function _bindBottomNav() {
  const map = [
    { icon: 'fa-chart-pie',    key: 'dashboard' },
    { icon: 'fa-list-check',   key: 'criarTarefa' },
    { icon: 'fa-users',        key: 'gerenciarCriancas' },
    { icon: 'fa-gift',         key: 'gerenciarLoja' },
    { icon: 'fa-check-double', key: 'aprovarTarefa' },
  ];
  document.querySelectorAll('nav a').forEach(a => {
    const icon = a.querySelector('i');
    if (!icon) return;
    const match = map.find(m => icon.className.includes(m.icon));
    if (match) a.addEventListener('click', e => { e.preventDefault(); Tarefito.navigate(match.key); });
  });
}

function _bindBottomNavChild() {
  const map = [
    { icon: 'fa-gamepad',       key: 'dashboardCrianca' },
    { icon: 'fa-list-check',    key: 'dashboardCrianca' },
    { icon: 'fa-user-astronaut',key: 'perfilCrianca' },
    { icon: 'fa-gift',          key: 'lojaCrianca' },
  ];
  document.querySelectorAll('nav a').forEach(a => {
    const icon = a.querySelector('i');
    if (!icon) return;
    const match = map.find(m => icon.className.includes(m.icon));
    if (match) a.addEventListener('click', e => { e.preventDefault(); Tarefito.navigate(match.key); });
  });
}

function _onBtn(text, cb) {
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim().includes(text)) btn.addEventListener('click', cb);
  });
}

function _showError(msg) {
  _toast(msg, '#ef4444');
}
function _showSuccess(msg) {
  _toast(msg, '#22c55e');
}
function _toast(msg, color) {
  let el = document.getElementById('tf-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tf-toast';
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
      'padding:10px 20px;border-radius:12px;font-weight:700;font-size:13px;' +
      'z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.5);color:#fff;' +
      'font-family:Nunito,sans-serif;white-space:nowrap;transition:opacity 0.3s;';
    document.body.appendChild(el);
  }
  el.textContent   = msg;
  el.style.background = color;
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}
