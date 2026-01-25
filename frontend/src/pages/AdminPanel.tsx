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

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, c, comp] = await Promise.all([
        api.request("/admin/api/users"),
        api.request("/admin/api/challenges"),
        api.request("/admin/api/completions"),
      ]);
      setUsers(u || []);
      setChallenges(c || []);
      setCompletions(comp || []);
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

      <div style={styles.nav}>
        {['overview','users','challenges','completions'].map(t => (
          <button key={t} style={styles.navBtn} onClick={() => setTab(t as any)}>{t}</button>
        ))}
      </div>

      <main style={styles.main}>
        {loading && <p>Loading...</p>}

        {tab === "overview" && (
          <section style={styles.section}>
            <h2>Статистика</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>Потребители<br/><strong>{stats.totalUsers}</strong></div>
              <div style={styles.statBox}>Предизвикателства<br/><strong>{stats.totalChallenges}</strong></div>
              <div style={styles.statBox}>Завършени<br/><strong>{stats.totalCompletions}</strong></div>
              <div style={styles.statBox}>Общо XP<br/><strong>{stats.totalXp}</strong></div>
            </div>
          </section>
        )}

        {tab === "users" && (
          <section style={styles.section}>
            <h2>Потребители</h2>
            <input style={styles.search} placeholder="Търсене на потребители" value={search} onChange={e=>setSearch(e.target.value)} />
            <table style={styles.table}><thead><tr><th>Име</th><th>Имейл</th><th>XP</th><th>Роля</th><th>Действия</th></tr></thead><tbody>
              {filteredUsers.map(u=> (
                <tr key={u.id}><td>{u.name}</td><td>{u.mail}</td><td>{u.points}</td><td>{u.is_admin ? "admin" : "user"}</td>
                  <td>
                    <button onClick={()=>setEditingUser(u)}>Променяне</button>
                    <button onClick={()=>toggleBan(u)}>{u.banned ? 'Unban' : 'Ban'}</button>
                    <button onClick={()=>deleteUser(u.id)}>Изтрий</button>
                  </td></tr>
              ))}
            </tbody></table>
          </section>
        )}

        {tab === "challenges" && (
          <section style={styles.section}>
            <h2>Предизвикателства</h2>
            <input style={styles.search} placeholder="Search challenges" value={search} onChange={e=>setSearch(e.target.value)} />
            <button onClick={()=>setEditingChallenge({ title:'', description:'', xp:0, difficulty:'easy', category:'mindfulness' })}>+ Добави предизвикателство</button>
            <table style={styles.table}><thead><tr><th>Заглавие</th><th>XP</th><th>Действия</th></tr></thead><tbody>
              {filteredChallenges.map(c=> (
                <tr key={c.id}><td>{c.title}</td><td>{c.xp}</td>
                  <td>
                    <button onClick={()=>setEditingChallenge(c)}>Промени</button>
                    <button onClick={()=>deleteChallenge(c.id)}>Изтрий</button>
                  </td></tr>
              ))}
            </tbody></table>
          </section>
        )}

        {tab === "completions" && (
          <section style={styles.section}>
            <h2>Завършени Предизвикателства</h2>
            <table style={styles.table}><thead><tr><th>Потребител</th><th>Предизвикателство</th><th>Дата</th></tr></thead><tbody>
              {completions.map(c=> (
                <tr key={c.id}><td>{c.username}</td><td>{c.challenge_title}</td><td>{c.completed_at}</td></tr>
              ))}
            </tbody></table>
          </section>
        )}

        {(editingUser || editingChallenge) && (
          <section style={styles.section}>
            <h3>Редактор</h3>
            {editingUser && (
              <>
                <select value={editingUser.role} onChange={e=>setEditingUser({ ...editingUser, role:e.target.value as any })}>
                  <option value="user">Потребител</option>
                  <option value="admin">Администратор</option>
                </select>
                <button onClick={saveUser}>Запази</button>
              </>
            )}
            {editingChallenge && (
              <>
                <input placeholder="Title" value={editingChallenge.title} onChange={e=>setEditingChallenge({ ...editingChallenge, title:e.target.value })} />
                <textarea placeholder="Description" value={editingChallenge.description} onChange={e=>setEditingChallenge({ ...editingChallenge, description:e.target.value })} />
                <input type="number" value={editingChallenge.xpReward} onChange={e=>setEditingChallenge({ ...editingChallenge, xpReward:Number(e.target.value) })} />
                <button onClick={saveChallenge}>Запази</button>
              </>
            )}
            <button onClick={()=>{setEditingUser(null); setEditingChallenge(null);}}>Отказ</button>
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#ffffffff' },
  header: { background: '#32b879', color: 'white', padding: 20 },
  nav: { background: '#20c96c', display: 'flex', gap: 10, padding: 10 },
  navBtn: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16 },
  main: { padding: 20, color: '#333' },
  section: { background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: 20, color: '#333' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 20, color: '#333' },
  statBox: { background: '#f9f9f9', padding: 20, borderRadius: 8, textAlign: 'center', color: '#333' },
  search: { padding: 8, marginBottom: 10, width: '100%', color: '#000', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 },
  table: { width: '100%', borderCollapse: 'collapse' },
};
