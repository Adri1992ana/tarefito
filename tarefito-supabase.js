/**
 * ============================================================
 *  TAREFITO — Integração Supabase
 *  Arquivo: tarefito-supabase.js
 * ============================================================
 */

const SUPABASE_URL  = 'https://txtnpmvunmivupkhndzy.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dG5wbXZ1bm1pdnVwa2huZHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzA1NTYsImV4cCI6MjA5NDIwNjU1Nn0.tyl3u_4d1-bPMZx0OBu5WiD6jPpCuV48o9ajxPST-Qk';

// ─── Cliente REST ─────────────────────────────────────────────
const db = {
  _headers() {
    const s = DB.session.get();
    return {
      'apikey':        SUPABASE_ANON,
      'Authorization': 'Bearer ' + (s?.access_token || SUPABASE_ANON),
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    };
  },
  async _req(method, path, body, params) {
    const url = SUPABASE_URL + '/rest/v1/' + path + (params ? '?' + params : '');
    const res = await fetch(url, {
      method,
      headers: this._headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) { console.error('[db]', method, path, res.status, data); throw data; }
    return data;
  },
  get:    (t, p)    => db._req('GET',    t, null, p),
  post:   (t, b)    => db._req('POST',   t, b),
  patch:  (t, b, p) => db._req('PATCH',  t, b, p),
  delete: (t, p)    => db._req('DELETE', t, null, p),
};

// ─── Auth ──────────────────────────────────────────────────────
const auth = {
  _url: SUPABASE_URL + '/auth/v1',
  _h:   { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },

  async signIn(email, password) {
    const res  = await fetch(this._url + '/token?grant_type=password', {
      method: 'POST', headers: this._h,
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Erro de login');
    DB.session.save(data);
    return data;
  },

  async signOut() {
    const s = DB.session.get();
    if (s?.access_token) {
      await fetch(this._url + '/logout', {
        method: 'POST',
        headers: { ...this._h, 'Authorization': 'Bearer ' + s.access_token },
      }).catch(() => {});
    }
    sessionStorage.clear();
  },
};

// ─── Storage de sessão ────────────────────────────────────────
const DB = {
  session: {
    save(d) { try { sessionStorage.setItem('tf_session', JSON.stringify(d)); } catch(_){} },
    get()   { try { return JSON.parse(sessionStorage.getItem('tf_session')); } catch(_){ return null; } },
    clear() { sessionStorage.removeItem('tf_session'); },
  },
  family: {
    save(d) { try { sessionStorage.setItem('tf_family', JSON.stringify(d)); } catch(_){} },
    get()   { try { return JSON.parse(sessionStorage.getItem('tf_family')); } catch(_){ return null; } },
    clear() { sessionStorage.removeItem('tf_family'); },
  },
  child: {
    save(d) { try { sessionStorage.setItem('tf_child', JSON.stringify(d)); } catch(_){} },
    get()   { try { return JSON.parse(sessionStorage.getItem('tf_child')); } catch(_){ return null; } },
    clear() { sessionStorage.removeItem('tf_child'); },
  },
  mission: {
    save(d) { try { sessionStorage.setItem('tf_mission', JSON.stringify(d)); } catch(_){} },
    get()   { try { return JSON.parse(sessionStorage.getItem('tf_mission')); } catch(_){ return null; } },
    clear() { sessionStorage.removeItem('tf_mission'); },
  },

  // ── Família ──
  async getOrCreateFamily(userId, name) {
    // Busca por owner_id ou responsible_id
    let rows = await db.get('families', 'owner_id=eq.' + userId + '&select=*');
    if (!rows?.length) rows = await db.get('families', 'responsible_id=eq.' + userId + '&select=*');
    if (rows && rows.length > 0) { this.family.save(rows[0]); return rows[0]; }
    // Gera code único baseado no userId
    const code = 'FAM-' + userId.substring(0, 6).toUpperCase();
    const res = await db.post('families', {
      owner_id: userId,
      responsible_id: userId,
      name: 'Família de ' + name,
      code: code,
    });
    const fam = Array.isArray(res) ? res[0] : res;
    this.family.save(fam);
    return fam;
  },

  // ── Members ──
  async getChildren(familyId) {
    return db.get('members', 'family_id=eq.' + familyId + '&role=eq.child&select=*&order=name.asc');
  },
  async createChild(familyId, name, pin, weeklyGoal) {
    return db.post('members', { family_id: familyId, name, pin, role: 'child', stars: 0, weekly_goal: weeklyGoal || 50 });
  },
  async updateChild(memberId, updates) {
    return db.patch('members', updates, 'id=eq.' + memberId);
  },

  // ── Tasks ──
  async getTasks(parentId, childId) {
    let p = 'parent_id=eq.' + parentId + '&select=*&order=created_at.desc';
    if (childId) p += '&child_id=eq.' + childId;
    return db.get('tasks', p);
  },
  async createTask(parentId, data) {
    return db.post('tasks', Object.assign({ parent_id: parentId, done: false }, data));
  },
  async updateTaskStatus(taskId, status) {
    return db.patch('tasks', { done: status === 'approved' }, 'id=eq.' + taskId);
  },
  async getPendingApproval(parentId) {
    return db.get('tasks', 'parent_id=eq.' + parentId + '&done=eq.false&select=*');
  },

  // ── Rewards ──
  async getRewards(familyId) {
    return db.get('rewards', 'family_id=eq.' + familyId + '&select=*&order=cost.asc');
  },
  async createReward(familyId, data) {
    return db.post('rewards', Object.assign({ family_id: familyId }, data));
  },
  async deleteReward(rewardId) {
    return db.delete('rewards', 'id=eq.' + rewardId);
  },

  // ── Redemptions ──
  async requestRedemption(memberId, rewardId, starCost) {
    return db.post('redemptions', { member_id: memberId, reward_id: rewardId, star_cost: starCost, status: 'pending' });
  },
};

// ─── Guard de auth ─────────────────────────────────────────────
function requireAuth() {
  if (!DB.session.get()?.access_token) {
    window.location.href = 'login_copy.html';
    return false;
  }
  return true;
}

console.log('[Tarefito] Supabase OK ✅');
