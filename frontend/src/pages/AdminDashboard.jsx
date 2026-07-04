import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { api, rupiah } from "../api";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([api.listProducts("semua"), api.listMessages()]);
      setProducts(p);
      setMessages(m);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function hapusProduk(id, nama) {
    if (!confirm(`Hapus produk "${nama}"?`)) return;
    await api.deleteProduct(id);
    load();
  }

  async function hapusPesan(id) {
    if (!confirm("Hapus pesan ini?")) return;
    await api.deleteMessage(id);
    load();
  }

  const sewa = products.filter((p) => p.kategori === "sewa").length;
  const buat = products.filter((p) => p.kategori === "pembuatan").length;

  return (
    <AdminLayout>
      <header className="admin__topbar">
        <div>
          <h1>Dashboard</h1>
          <p>Kelola foto &amp; detail produk yang tampil di landing page.</p>
        </div>
        <Link to="/admin/produk/baru" className="btn btn--primary">+ Tambah Produk</Link>
      </header>

      {err && <div className="alert alert--error">{err}</div>}

      <section className="admin__stats">
        <div className="mini-stat"><span className="mini-stat__ic">📦</span><div><strong>{products.length}</strong><small>Total Produk</small></div></div>
        <div className="mini-stat"><span className="mini-stat__ic">👔</span><div><strong>{sewa}</strong><small>Penyewaan</small></div></div>
        <div className="mini-stat"><span className="mini-stat__ic">🧵</span><div><strong>{buat}</strong><small>Pembuatan</small></div></div>
        <div className="mini-stat"><span className="mini-stat__ic">✉️</span><div><strong>{messages.length}</strong><small>Pesan Masuk</small></div></div>
      </section>

      <section className="admin__panel">
        <div className="admin__panel-head"><h2>Daftar Produk</h2></div>
        {loading ? (
          <div className="empty"><div className="spinner"></div><p>Memuat…</p></div>
        ) : products.length === 0 ? (
          <div className="empty"><div className="empty__icon">📦</div><p>Belum ada produk. Klik “Tambah Produk” untuk memulai.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Foto</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.foto ? <img src={p.foto} alt={p.nama} className="thumb" /> : <div className="thumb thumb--empty">🎖️</div>}
                    </td>
                    <td>
                      <strong>{p.nama}</strong>
                      {p.unggulan && <span className="tag tag--star">★ Unggulan</span>}
                    </td>
                    <td><span className={`tag tag--${p.kategori}`}>{p.kategori === "pembuatan" ? "Pembuatan" : "Penyewaan"}</span></td>
                    <td>{rupiah(p.harga)} <small>{p.satuan_harga}</small></td>
                    <td>{p.tersedia ? <span className="tag tag--ok">Tersedia</span> : <span className="tag tag--off">Nonaktif</span>}</td>
                    <td className="actions">
                      <Link to={`/admin/produk/${p.id}`} className="btn btn--xs btn--ghost">Edit</Link>
                      <button className="btn btn--xs btn--danger" onClick={() => hapusProduk(p.id, p.nama)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin__panel">
        <div className="admin__panel-head"><h2>Pesan Masuk</h2></div>
        {messages.length === 0 ? (
          <div className="empty"><div className="empty__icon">✉️</div><p>Belum ada pesan masuk.</p></div>
        ) : (
          <div className="messages">
            {messages.map((m) => (
              <div className="message" key={m.id}>
                <div className="message__avatar">{(m.nama || "?").charAt(0).toUpperCase()}</div>
                <div className="message__body">
                  <div className="message__top">
                    <strong>{m.nama}</strong>
                    <span className="message__date">{new Date(m.dibuat_pada).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="message__contact">
                    {m.email && <span>✉️ {m.email}</span>}
                    {m.telepon && <span>📱 {m.telepon}</span>}
                  </div>
                  <p>{m.isi}</p>
                </div>
                <button className="btn btn--xs btn--danger" onClick={() => hapusPesan(m.id)}>Hapus</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="admin__foot">© {new Date().getFullYear()} Kostum Paskibra — Panel Admin</footer>
    </AdminLayout>
  );
}
