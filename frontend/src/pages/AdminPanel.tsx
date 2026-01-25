import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { color } from "framer-motion";

// ---------------- TYPES ----------------
type AdminUser = {
  id?: string;
  name: string;
  mail: string;
  points: number;
  level: number;
  is_admin: boolean;
  banned?: boolean;
};



type AdminChallenge = {
  id?: string;
  title: string;
  description: string;
  xp: number;
  difficulty: string;
  category: string;
};

type Completion = {
  id: string;
  username: string;
  challange_title: string;
  completed_at: string;
};

export default function AdminPanel() {
  const [tab, setTab] = useState<"overview" | "users" | "challenges" | "completions">("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<AdminChallenge | null>(null);

  // ---------------- FETCH ----------------
  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    console.log("Completions state updated:", completions);
  }, [completions]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, c, comp] = await Promise.all([
        api.request("/admin/api/users"),
        api.request("/admin/api/challenges"),
        api.request("/admin/api/completions"),
      ]);
      console.log("Users from API:", u);
      console.log("Challenges from API:", c);
      console.log("Completions from API:", comp);
      console.log("Completions is array:", Array.isArray(comp));
      
      // Handle different response formats
      let completionArray = Array.isArray(comp) ? comp : (comp?.data || comp?.completions || []);
      console.log("Processed completions:", completionArray);
      
      setUsers(Array.isArray(u) ? u : (u?.data || u?.users || []));
      setChallenges(Array.isArray(c) ? c : (c?.data || c?.challenges || []));
      setCompletions(Array.isArray(completionArray) ? completionArray : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- STATS ----------------
  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalChallenges: challenges.length,
    totalCompletions: completions.length,
    totalXp: users.reduce((a, u) => a + (u.xp || 0), 0),
  }), [users, challenges, completions]);

  // ---------------- FILTERS ----------------
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.mail.toLowerCase().includes(search.toLowerCase())
  );

  const filteredChallenges = challenges.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------- CRUD USERS ----------------
  const saveUser = async () => {
    if (!editingUser) return;
    const method = editingUser.id ? "PUT" : "POST";
    const url = editingUser.id ? `/admin/api/users/${editingUser.id}` : "/admin/api/users";
    await api.request(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingUser),
    });
    setEditingUser(null);
    fetchAll();
  };

  const deleteUser = async (id?: string) => {
    if (!id || !confirm("Delete user?")) return;
    await api.request(`/admin/api/users/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const toggleBan = async (user: AdminUser) => {
    await api.request(`/admin/api/users/${user.id}/ban`, { method: "POST" });
    fetchAll();
  };

  // ---------------- CRUD CHALLENGES ----------------
  const saveChallenge = async () => {
  if (!editingChallenge) return;
    const method = editingChallenge.id ? "PUT" : "POST";
    const url = editingChallenge.id
    ? `/admin/api/challenges/${editingChallenge.id}`
    : "/admin/api/challenges";
    await api.request(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingChallenge),
    });
    setEditingChallenge(null);
    fetchAll();
  };

  const deleteChallenge = async (id?: string) => {
    if (!id || !confirm("Delete challenge?")) return;
    await api.request(`/admin/api/challenges/${id}`, { method: "DELETE" });
    fetchAll();
  };

  // ---------------- UI ----------------
  return (
    <div style={styles.container}>
      <header style={styles.header}><h1>Администрация</h1></header>

      <nav style={styles.nav}>
        {['overview','users','challenges','completions'].map(t => {
          const labels: Record<string, string> = { overview: 'Преглед', users: 'Потребители', challenges: 'Предизвикателства', completions: 'Завършени' };
          return <button key={t} style={{...styles.navBtn, ...(tab === t ? styles.navBtnActive : {})}} onClick={() => setTab(t as any)}>{labels[t]}</button>;
        })}
      </nav>

      <main style={styles.main}>
        {loading && <div style={styles.loading}>Зареждане...</div>}

        {tab === "overview" && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Статистика на системата</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statBox}><div style={styles.statLabel}>Потребители</div><div style={styles.statValue}>{stats.totalUsers}</div></div>
              <div style={styles.statBox}><div style={styles.statLabel}>Предизвикателства</div><div style={styles.statValue}>{stats.totalChallenges}</div></div>
              <div style={styles.statBox}><div style={styles.statLabel}>Завършени</div><div style={styles.statValue}>{stats.totalCompletions}</div></div>
              <div style={styles.statBox}><div style={styles.statLabel}>Общо XP</div><div style={styles.statValue}>{stats.totalXp}</div></div>
            </div>
          </section>
        )}

        {tab === "users" && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Управление на потребители</h2>
            <input style={styles.search} placeholder="Търсете по име или имейл..." value={search} onChange={e=>setSearch(e.target.value)} />
            <div style={styles.tableWrapper}>
              <table style={styles.table}><thead><tr style={styles.tableHeader}><th style={styles.tableCell}>Име</th><th style={styles.tableCell}>Имейл</th><th style={styles.tableCell}>XP</th><th style={styles.tableCell}>Роля</th><th style={styles.tableCell}>Действия</th></tr></thead><tbody>
                {filteredUsers.map(u=> (
                  <tr key={u.id} style={styles.tableRow}><td style={styles.tableCell}>{u.name}</td><td style={styles.tableCell}>{u.mail}</td><td style={styles.tableCell}><strong>{u.points}</strong></td><td style={styles.tableCell}>{u.is_admin ? 'Администратор' : 'Потребител'}</td>
                    <td style={styles.tableCell}>
                      <button onClick={()=>setEditingUser(u)} style={styles.actionBtn}>Промени</button>
                      <button onClick={()=>toggleBan(u)} style={{...styles.actionBtn, background: u.banned ? '#ff6b6b' : '#ffa500'}}>{u.banned ? 'Разблокирай' : 'Блокирай'}</button>
                      <button onClick={()=>deleteUser(u.id)} style={{...styles.actionBtn, background: '#dc3545'}}>Изтрий</button>
                    </td></tr>
                ))}
              </tbody></table>
            </div>
          </section>
        )}

        {tab === "challenges" && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Управление на предизвикателства</h2>
            <div style={{display: 'flex', gap: 10, marginBottom: 15}}>
              <input style={{...styles.search, marginBottom: 0, flex: 1}} placeholder="Търсете предизвикателства..." value={search} onChange={e=>setSearch(e.target.value)} />
              <button onClick={()=>setEditingChallenge({ title:'', description:'', xp:0, difficulty:'easy', category:'mindfulness' })} style={styles.addBtn}>Добави</button>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}><thead><tr style={styles.tableHeader}><th style={styles.tableCell}>Заглавие</th><th style={styles.tableCell}>XP</th><th style={styles.tableCell}>Действия</th></tr></thead><tbody>
                {filteredChallenges.map(c=> (
                  <tr key={c.id} style={styles.tableRow}><td style={styles.tableCell}><strong>{c.title}</strong></td><td style={styles.tableCell}>{c.xp}</td>
                    <td style={styles.tableCell}>
                      <button onClick={()=>setEditingChallenge(c)} style={styles.actionBtn}>Промени</button>
                      <button onClick={()=>deleteChallenge(c.id)} style={{...styles.actionBtn, background: '#dc3545'}}>Изтрий</button>
                    </td></tr>
                ))}
              </tbody></table>
            </div>
          </section>
        )}

        {tab === "completions" && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Завършени предизвикателства</h2>
            <div style={styles.tableWrapper}>
              <table style={styles.table}><thead><tr style={styles.tableHeader}><th style={styles.tableCell}>Потребител</th><th style={styles.tableCell}>Предизвикателство</th><th style={styles.tableCell}>Дата</th></tr></thead><tbody>
                {completions.map(c=> (
                  <tr key={c.id} style={styles.tableRow}><td style={styles.tableCell}><strong>{c.username}</strong></td><td style={styles.tableCell}>{c.challange_title}</td><td style={styles.tableCell}>{new Date(c.completed_at).toLocaleDateString('bg-BG')}</td></tr>
                ))}
              </tbody></table>
            </div>
          </section>
        )}

        {(editingUser || editingChallenge) && (
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Редактор</h3>
            {editingUser && (
              <div style={styles.editorForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Роля на потребител:</label>
                  <select value={editingUser.is_admin ? 'admin' : 'user'} onChange={e=>setEditingUser({ ...editingUser, is_admin: e.target.value === 'admin' })} style={styles.select}>
                    <option value="user">Потребител</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <div style={styles.buttonGroup}>
                  <button onClick={saveUser} style={styles.saveBtn}>Запази</button>
                  <button onClick={()=>setEditingUser(null)} style={styles.cancelBtn}>Отказ</button>
                </div>
              </div>
            )}
            {editingChallenge && (
              <div style={styles.editorForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Заглавие:</label>
                  <input placeholder="Име на предизвикателство..." value={editingChallenge.title} onChange={e=>setEditingChallenge({ ...editingChallenge, title:e.target.value })} style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Описание:</label>
                  <textarea placeholder="Описание..." value={editingChallenge.description} onChange={e=>setEditingChallenge({ ...editingChallenge, description:e.target.value })} style={styles.textarea} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>XP награда:</label>
                  <input type="number" value={editingChallenge.xp} onChange={e=>setEditingChallenge({ ...editingChallenge, xp:Number(e.target.value) })} style={styles.input} />
                </div>
                <div style={styles.buttonGroup}>
                  <button onClick={saveChallenge} style={styles.saveBtn}>Запази</button>
                  <button onClick={()=>setEditingChallenge(null)} style={styles.cancelBtn}>Отказ</button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f5f5f5' },
  header: { background: '#32b879', color: 'white', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  nav: { background: '#20c96c', display: 'flex', gap: '12px', padding: '12px', flexWrap: 'wrap', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  navBtn: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '8px 14px', borderRadius: '6px', transition: 'all 0.3s ease' },
  navBtnActive: { background: 'rgba(255,255,255,0.3)', borderRadius: '6px' },
  main: { padding: '24px', color: '#333', maxWidth: '1200px', margin: '0 auto' },
  section: { background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px', color: '#333' },
  sectionTitle: { fontSize: '20px', fontWeight: 'bold', color: '#333', marginTop: 0, marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #32b879' },
  loading: { padding: '40px', textAlign: 'center', fontSize: '16px', color: '#666' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', color: '#333' },
  statBox: { background: 'linear-gradient(135deg, #f0f9f6, #e8f5e9)', padding: '24px', borderRadius: '10px', textAlign: 'center', color: '#333', border: '1px solid #d0f0e8', boxShadow: '0 2px 4px rgba(50,184,121,0.1)' },
  statLabel: { fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#32b879' },
  search: { padding: '10px 12px', marginBottom: '16px', width: '100%', color: '#000', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
  tableWrapper: { overflowX: 'auto', borderRadius: '8px', border: '1px solid #e0e0e0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  tableHeader: { background: '#32b879', color: 'white' },
  tableCell: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' },
  tableRow: { background: 'white', transition: 'background 0.2s ease' },
  actionBtn: { padding: '6px 10px', margin: '2px', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: '#32b879', color: 'white', fontWeight: '600', transition: 'all 0.2s ease' },
  addBtn: { padding: '10px 14px', background: '#32b879', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' },
  editorForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '600', fontSize: '14px', color: '#333' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' },
  textarea: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', background: 'white', color: '#000' },
  buttonGroup: { display: 'flex', gap: '12px', justifyContent: 'flex-start' },
  saveBtn: { padding: '10px 16px', background: '#32b879', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  cancelBtn: { padding: '10px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
};
