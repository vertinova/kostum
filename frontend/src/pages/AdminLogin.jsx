import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api, setToken } from "../api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(username, password);
      setToken(res.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <Link to="/" className="brand brand--center">
          <span className="brand__text">Kostum<strong>Paskibra</strong></span>
          <span className="brand__tag">powered by simpaskor</span>
        </Link>
        <h1>Login Admin</h1>
        <p className="auth__sub">Masuk untuk mengelola produk &amp; foto katalog.</p>
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={submit}>
          <label>
            Username
            <input type="text" required autoFocus value={username} placeholder="admin"
              onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" required value={password} placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>
        <Link to="/" className="auth__back">← Kembali ke beranda</Link>
      </div>
    </div>
  );
}
