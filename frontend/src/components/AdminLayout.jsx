import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../api";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  async function logout() {
    try {
      await api.logout();
    } catch {
      /* abaikan */
    }
    setToken("");
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin">
      <aside className="admin__side">
        <Link to="/" className="brand brand--light">
          <span className="brand__mark">🎖️</span>
          <span className="brand__text">Kostum<strong>Paskibra</strong></span>
        </Link>
        <nav className="admin__nav">
          <Link to="/admin">📦 Produk</Link>
          <Link to="/admin/produk/baru">➕ Tambah Produk</Link>
          <a href="/" target="_blank" rel="noreferrer">🌐 Lihat Situs</a>
        </nav>
        <button className="admin__logout" onClick={logout}>⎋ Keluar</button>
      </aside>
      <main className="admin__main">{children}</main>
    </div>
  );
}
