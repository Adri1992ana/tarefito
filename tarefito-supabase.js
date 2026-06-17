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
    let res = await fetch(url, {
      method,
      headers: this._headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      const refreshed = await auth.refreshSession();
      if (refreshed) {
        res = await fetch(url, {
          method,
          headers: this._headers(),
          body: body ? JSON.stringify(body) : undefined,
        });
      } else {
        sessionStorage.clear();
        window.location.href = 'login.html';
        return;
      }
    }
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

  async refreshSession() {
    const s = DB.session.get();
    if (!s?.refresh_token) return false;
    try {
      const res = await fetch(this._url + '/token?grant_type=refresh_token', {
        method: 'POST', headers: this._h,
        body: JSON.stringify({ refresh_token: s.refresh_token }),
      });
      const data = await res.json();
      if (!res.ok) return false;
      DB.session.save(data);
      return true;
    } catch { return false; }
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
    let rows = await db.get('families', 'owner_id=eq.' + userId + '&select=*');
    if (!rows?.length) rows = await db.get('families', 'responsible_id=eq.' + userId + '&select=*');
    if (rows?.length) { this.family.save(rows[0]); return rows[0]; }
    const code = 'FAM-' + userId.substring(0, 6).toUpperCase();
    const trialExpires = new Date();
    trialExpires.setDate(trialExpires.getDate() + 30);
    const res = await db.post('families', {
      owner_id: userId,
      responsible_id: userId,
      name: 'Família de ' + name,
      code,
      trial_expires_at: trialExpires.toISOString(),
    });
    const fam = Array.isArray(res) ? res[0] : res;
    this.family.save(fam);
    return fam;
  },

  // ── Children ──
  async getChildren(parentId) {
    return db.get('members', 'parent_id=eq.' + parentId + '&select=*&order=name.asc');
  },
  async createChild(parentId, name, pin, weeklyGoal) {
    return db.post('members', { parent_id: parentId, name, pin, stars: 0, weekly_goal: weeklyGoal || 50 });
  },
  async updateChild(childId, updates) {
    return db.patch('members', updates, 'id=eq.' + childId);
  },
  async deleteChild(childId) {
    return db.delete('members', 'id=eq.' + childId);
  },

  // ── Tasks ──
  async getTasks(parentId, childId) {
    let p = 'parent_id=eq.' + parentId + '&select=*&order=created_at.desc';
    if (childId) p += '&child_id=eq.' + childId;
    return db.get('tasks', p);
  },
  async createTask(parentId, data) {
    return db.post('tasks', Object.assign({ parent_id: parentId, done: false, status: 'pending' }, data));
  },
  async updateTaskStatus(taskId, status, extra = {}) {
    const updates = { status, ...extra };
    if (status === 'approved') updates.done = true;
    return db.patch('tasks', updates, 'id=eq.' + taskId);
  },
  async getPendingApproval(parentId) {
    return db.get('tasks',
      'parent_id=eq.' + parentId +
      '&status=eq.submitted' +
      '&select=*' +
      '&order=created_at.desc'
    );
  },
  async getApprovedCount(parentId) {
    return db.get('tasks',
      'parent_id=eq.' + parentId +
      '&done=eq.true' +
      '&select=id'
    );
  },

  // ── Rewards ──
  async getRewards(parentId) {
    return db.get('rewards', 'parent_id=eq.' + parentId + '&select=*&order=cost.asc');
  },
  async createReward(parentId, data) {
    return db.post('rewards', Object.assign({ parent_id: parentId }, data));
  },
  async updateReward(rewardId, updates) {
    return db.patch('rewards', updates, 'id=eq.' + rewardId);
  },
  async deleteReward(rewardId) {
    return db.delete('rewards', 'id=eq.' + rewardId);
  },

  // ── Redemptions ──
  async requestRedemption(childId, rewardId, starCost) {
    return db.post('redemptions', { child_id: childId, reward_id: rewardId, star_cost: starCost, status: 'pending' });
  },
  async getRedemptions(childId) {
    return db.get('redemptions',
      'child_id=eq.' + childId +
      '&select=*&order=created_at.desc&limit=10'
    );
  },
  async getPendingRedemptions(childIds) {
    if (!childIds?.length) return [];
    return db.get('redemptions',
      'child_id=in.(' + childIds.join(',') + ')' +
      '&status=eq.pending' +
      '&select=*&order=created_at.desc'
    );
  },
  async updateRedemptionStatus(redemptionId, status) {
    return db.patch('redemptions', { status }, 'id=eq.' + redemptionId);
  },
};

// ─── Guard de auth ─────────────────────────────────────────────
function requireAuth() {
  if (!DB.session.get()?.access_token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}


// ─── Trial ───────────────────────────────────────────────────

function checkTrial(family) {
  if (!family?.trial_expires_at) return { active: false, daysLeft: 0, expiresAt: null };
  const now       = new Date();
  const expiresAt = new Date(family.trial_expires_at);
  const diffMs    = expiresAt - now;
  const daysLeft  = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { active: diffMs > 0, daysLeft: Math.max(0, daysLeft), expiresAt };
}

function guardTrial() {
  const family = DB.family.get();
  const trial  = checkTrial(family);
  if (!trial.active) {
    console.warn('[Tarefito] Trial expirado');
    window.location.href = 'trial-expirado.html';
    return false;
  }
  return true;
}

function requireAuthAndTrial() {
  if (!requireAuth())  return false;
  if (!guardTrial())   return false;
  return true;
}

console.log('[Tarefito] Supabase OK ✅');
