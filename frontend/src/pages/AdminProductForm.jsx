import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { api } from "../api";

const KOSONG = {
  nama: "",
  kategori: "sewa",
  deskripsi: "",
  harga: "",
  satuan_harga: "/ hari",
  ukuran: "",
  foto: "",
  unggulan: false,
  tersedia: true,
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(KOSONG);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api
      .getProduct(id)
      .then((p) => setForm({ ...p, harga: String(p.harga) }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await api.upload(file);
      set("foto", res.foto);
    } catch (e) {
      setError("Gagal upload: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.nama.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      harga: parseInt(String(form.harga).replace(/[^0-9]/g, ""), 10) || 0,
    };
    try {
      if (isEdit) await api.updateProduct(id, payload);
      else await api.createProduct(payload);
      navigate("/admin");
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="empty"><div className="spinner"></div><p>Memuat…</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <header className="admin__topbar">
        <div>
          <h1>{isEdit ? "Edit Produk" : "Tambah Produk"}</h1>
          <p>Lengkapi detail dan unggah foto yang akan tampil di landing page.</p>
        </div>
        <Link to="/admin" className="btn btn--ghost">← Kembali</Link>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="admin__panel product-form" onSubmit={submit}>
        <div className="product-form__grid">
          <div className="product-form__main">
            <label>
              Nama Produk *
              <input type="text" required value={form.nama} placeholder="Contoh: Kostum Paskibra Lengkap - Putih"
                onChange={(e) => set("nama", e.target.value)} />
            </label>

            <label>
              Deskripsi
              <textarea rows="5" value={form.deskripsi} placeholder="Jelaskan bahan, kelengkapan, kondisi, dll."
                onChange={(e) => set("deskripsi", e.target.value)}></textarea>
            </label>

            <div className="form-grid">
              <label>
                Kategori *
                <select value={form.kategori} onChange={(e) => set("kategori", e.target.value)}>
                  <option value="sewa">Penyewaan</option>
                  <option value="pembuatan">Pembuatan / Jahit</option>
                </select>
              </label>
              <label>
                Ukuran
                <input type="text" value={form.ukuran} placeholder="S, M, L, XL / Custom"
                  onChange={(e) => set("ukuran", e.target.value)} />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Harga (Rp) *
                <input type="text" inputMode="numeric" value={form.harga} placeholder="75000"
                  onChange={(e) => set("harga", e.target.value)} />
              </label>
              <label>
                Satuan Harga
                <input type="text" value={form.satuan_harga} placeholder="/ hari, / set, / unit"
                  onChange={(e) => set("satuan_harga", e.target.value)} />
              </label>
            </div>

            <div className="switches">
              <label className="switch">
                <input type="checkbox" checked={form.tersedia} onChange={(e) => set("tersedia", e.target.checked)} />
                <span>Tersedia untuk dipesan</span>
              </label>
              <label className="switch">
                <input type="checkbox" checked={form.unggulan} onChange={(e) => set("unggulan", e.target.checked)} />
                <span>Tandai sebagai Unggulan</span>
              </label>
            </div>
          </div>

          <div className="product-form__media">
            <span className="uploader__label">Foto Produk</span>
            <div className="uploader__preview">
              {form.foto ? (
                <img src={form.foto} alt="Pratinjau" />
              ) : (
                <div className="uploader__placeholder">📷<span>Belum ada foto</span></div>
              )}
            </div>
            <label className="btn btn--outline btn--block" style={{ cursor: "pointer" }}>
              {uploading ? "Mengunggah…" : "Pilih Foto"}
              <input type="file" accept="image/*" hidden disabled={uploading}
                onChange={(e) => handleUpload(e.target.files?.[0])} />
            </label>
            <small className="uploader__hint">JPG, PNG, WEBP, atau GIF. Maks 15MB.</small>
          </div>
        </div>

        <div className="product-form__foot">
          <Link to="/admin" className="btn btn--ghost">Batal</Link>
          <button type="submit" className="btn btn--primary" disabled={saving || uploading}>
            {saving ? "Menyimpan…" : "💾 Simpan Produk"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
