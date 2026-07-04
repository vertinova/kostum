import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, rupiah } from "../api";

const WA = "6285111209133";
const WA_DISPLAY = "0851-1120-9133";
const WA_TEXT = "Halo, saya mau tanya penyewaan kostum paskibra untuk wilayah Cibinong.";
const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text || WA_TEXT)}`;
const waSewa = (nama) => waLink("Halo, saya mau menyewa: " + nama + " (area Cibinong)");

// Alamat & lokasi
const ADDRESS = "Jl. Kp. Citatah Dalam No.04, RT.06/RW.13, Ciriung, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16917";
const GEO = "-6.466391839671521,106.8698518392896";
const MAPS_EMBED = `https://maps.google.com/maps?q=${GEO}&z=16&hl=id&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${GEO}`;

// Wilayah layanan (Cibinong & sekitarnya, Kabupaten Bogor).
const AREAS = [
  "Cibinong", "Sukahati", "Nanggewer", "Pakansari", "Sentul",
  "Citeureup", "Bojonggede", "Sukaraja", "Babakan Madang", "Tajur Halang",
];

/* Ikon WhatsApp (SVG resmi) */
function WaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Landing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [selected, setSelected] = useState(null); // produk yang dibuka detailnya
  const [contact, setContact] = useState({ nama: "", telepon: "", isi: "" });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .listProducts("sewa")
      .then((list) => {
        const sorted = [...list].sort((a, b) => Number(b.unggulan) - Number(a.unggulan));
        setProducts(sorted);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  async function submitContact(e) {
    e.preventDefault();
    if (!contact.nama.trim() || !contact.isi.trim()) {
      setStatus({ ok: false, msg: "Nama dan pesan wajib diisi." });
      return;
    }
    try {
      await api.createMessage(contact);
      setStatus({ ok: true, msg: "✓ Sip! Pesan kamu udah masuk, kami balas segera." });
      setContact({ nama: "", telepon: "", isi: "" });
    } catch (err) {
      setStatus({ ok: false, msg: "✗ " + err.message });
    }
  }

  const closeNav = () => setNavOpen(false);
  const open = (p) => setSelected(p);
  const spotlight = products[0];
  const rest = spotlight ? products.slice(1) : products;

  return (
    <div className={navOpen ? "nav-open" : ""}>
      {/* NAVBAR */}
      <header className="nav nav--dark">
        <div className="container nav__inner">
          <a href="#beranda" className="brand brand--light" onClick={closeNav}>
            <img className="brand__logo" src="/simpaskor.png" alt="Simpaskor" />
            <span className="brand__wrap">
              <span className="brand__text">Kostum<strong>Paskibra</strong></span>
              <span className="brand__tag">powered by simpaskor</span>
            </span>
          </a>
          <button className="nav__toggle" aria-label="Menu" onClick={() => setNavOpen((v) => !v)}>
            <span></span><span></span><span></span>
          </button>
          <nav className="nav__menu">
            <a href="#beranda" onClick={closeNav}>Beranda</a>
            <a href="#produk" onClick={closeNav}>Produk</a>
            <a href="#area" onClick={closeNav}>Area</a>
            <a href="#kontak" onClick={closeNav}>Kontak</a>
            <Link to="/admin" className="nav__lock" onClick={closeNav} aria-label="Login Admin" title="Login Admin">🔒</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero-p" id="beranda">
          <div className="hero-p__bg" aria-hidden="true"></div>
          <div className="container hero-p__inner">
            <div className="hero-p__content">
              <span className="hero-p__badge">📍 Cibinong &amp; Sekitarnya</span>
              <h1 className="hero-p__title">
                Sewa Kostum <span className="hl">Paskibra</span> Anti Ribet! 🔥
              </h1>
              <p className="hero-p__lead">
                Lengkap, rapi, harga bersahabat. Siap pakai buat lomba &amp; upacara. ✨
              </p>
              <div className="hero-p__cta">
                <a href={waLink()} target="_blank" rel="noreferrer" className="btn btn--primary btn--lg"><WaIcon /> Chat Sekarang</a>
                <a href="#produk" className="btn btn--glass btn--lg">Lihat Produk →</a>
              </div>
              <div className="hero-p__trust">
                <span>🚚 Bisa diantar</span>
                <span>📏 Semua ukuran</span>
                <span>⚡ Booking kilat</span>
              </div>
            </div>

            {/* Carousel foto produk (otomatis) */}
            <div className="hero-p__showcase">
              <HeroCarousel items={products} onOpen={open} />
            </div>
          </div>
          <div className="hero-p__wave" aria-hidden="true"></div>
        </section>

        {/* PRODUK */}
        <section className="section section--products" id="produk">
          <div className="container">
            <div className="section__head">
              <span className="eyebrow eyebrow--center">Koleksi Kami</span>
              <h2 className="section__title">Pilih, Chat, Pakai! 🎽</h2>
              <p className="section__sub">Ketuk produk untuk lihat detailnya.</p>
            </div>

            {loading ? (
              <div className="empty"><div className="spinner"></div><p>Memuat produk…</p></div>
            ) : products.length === 0 ? (
              <div className="empty">
                <div className="empty__icon">📭</div>
                <p>Belum ada produk. Chat kami aja langsung, ya!</p>
              </div>
            ) : (
              <>
                {spotlight && <Spotlight p={spotlight} onOpen={open} />}
                <div className="pgrid">
                  {rest.map((p) => <PCard key={p.id} p={p} onOpen={open} />)}
                </div>
              </>
            )}
          </div>
        </section>

        {/* AREA */}
        <section className="section section--alt" id="area">
          <div className="container area">
            <div className="section__head">
              <span className="eyebrow eyebrow--center">Jangkauan Kami</span>
              <h2 className="section__title">Kita Nganter ke Sini 🛵</h2>
              <p className="section__sub">Area Cibinong &amp; sekitarnya:</p>
            </div>
            <div className="area__chips">
              {AREAS.map((a) => <span className="area__chip" key={a}>📍 {a}</span>)}
            </div>
            <p className="area__note">Di luar area? Santai, chat aja dulu — bisa diatur. 😉</p>
          </div>
        </section>

        {/* KONTAK */}
        <section className="section" id="kontak">
          <div className="container contact">
            <div className="contact__info">
              <span className="eyebrow">Hubungi Kami</span>
              <h2 className="section__title">Yuk, Booking! 🙌</h2>
              <p>Paling cepet lewat WhatsApp. Tinggal sebut tanggal &amp; ukuran, langsung kami siapin.</p>
              <a href={waLink()} target="_blank" rel="noreferrer" className="btn btn--primary btn--lg"><WaIcon /> Chat {WA_DISPLAY}</a>
              <ul className="contact__list">
                <li>📍 {ADDRESS}</li>
                <li>🕘 Tiap hari, 08.00 – 20.00 WIB</li>
              </ul>
              <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">🧭 Lihat Rute di Google Maps</a>
            </div>
            <form className="contact__form" onSubmit={submitContact}>
              <h3>Isi di Sini 👇</h3>
              <label>
                Nama
                <input type="text" required value={contact.nama} placeholder="Nama kamu"
                  onChange={(e) => setContact({ ...contact, nama: e.target.value })} />
              </label>
              <label>
                No. WhatsApp
                <input type="text" value={contact.telepon} placeholder="08xxxxxxxxxx"
                  onChange={(e) => setContact({ ...contact, telepon: e.target.value })} />
              </label>
              <label>
                Pesan
                <textarea rows="3" required value={contact.isi}
                  placeholder="Contoh: Mau sewa 17 set buat 17-an 😄"
                  onChange={(e) => setContact({ ...contact, isi: e.target.value })}></textarea>
              </label>
              <button type="submit" className="btn btn--primary btn--block">Kirim Pesan</button>
              {status && <p className={`form-hint ${status.ok ? "ok" : "err"}`}>{status.msg}</p>}
            </form>
          </div>

          {/* Peta lokasi */}
          <div className="container">
            <div className="mapwrap">
              <iframe
                title="Lokasi Kostum Paskibra Cibinong"
                src={MAPS_EMBED}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="mapwrap__pin">📍 Buka di Maps</a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer-s">
        <div className="container footer-s__inner">
          <span className="brand brand--light">
            <img className="brand__logo" src="/simpaskor.png" alt="Simpaskor" />
            <span className="brand__wrap">
              <span className="brand__text">Kostum<strong>Paskibra</strong></span>
              <span className="brand__tag">powered by simpaskor</span>
            </span>
          </span>
          <p>Sewa kostum paskibra area Cibinong &amp; sekitarnya. 🇮🇩</p>
          <p className="footer-s__addr">📍 {ADDRESS}</p>
          <a href={waLink()} target="_blank" rel="noreferrer" className="footer-s__wa"><WaIcon size={16} /> {WA_DISPLAY}</a>
          <p className="footer-s__copy">© {new Date().getFullYear()} Kostum Paskibra.</p>
        </div>
      </footer>

      {/* Tombol mengambang WhatsApp */}
      <a href={waLink()} target="_blank" rel="noreferrer" className="fab" aria-label="Chat WhatsApp"><WaIcon size={28} /></a>

      {/* Modal detail produk */}
      {selected && <ProductModal p={selected} onClose={() => setSelected(null)} WaIcon={WaIcon} />}
    </div>
  );
}

/* ---- Carousel foto produk di hero (otomatis) ---- */
function HeroCarousel({ items, onOpen }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  // Auto-geser tiap 3.5 detik (berhenti saat hover/sentuh).
  useEffect(() => {
    if (n <= 1 || paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 3500);
    return () => clearInterval(t);
  }, [n, paused]);

  // Jaga indeks tetap valid bila jumlah item berubah.
  useEffect(() => {
    if (i >= n && n > 0) setI(0);
  }, [n, i]);

  if (n === 0) {
    return (
      <div className="hcar">
        <div className="hcar__stage">
          <div className="hcar__slide is-active"><div className="hcar__ph">🎖️</div></div>
        </div>
      </div>
    );
  }

  const go = (idx) => setI((idx + n) % n);

  return (
    <div
      className="hcar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="hcar__stage">
        {items.map((p, idx) => (
          <button
            key={p.id}
            className={`hcar__slide ${idx === i ? "is-active" : ""}`}
            onClick={() => onOpen(p)}
            title={p.nama}
            aria-hidden={idx !== i}
            tabIndex={idx === i ? 0 : -1}
          >
            {p.foto ? <img src={p.foto} alt={p.nama} /> : <div className="hcar__ph">🎖️</div>}
            {p.unggulan && <span className="hcar__fire">🔥</span>}
            <div className="hcar__cap">
              <strong>{p.nama}</strong>
              <span>{rupiah(p.harga)} <small>{p.satuan_harga}</small></span>
            </div>
          </button>
        ))}
      </div>

      {n > 1 && (
        <>
          <button className="hcar__nav hcar__nav--prev" onClick={() => go(i - 1)} aria-label="Sebelumnya">‹</button>
          <button className="hcar__nav hcar__nav--next" onClick={() => go(i + 1)} aria-label="Berikutnya">›</button>
          <div className="hcar__dots">
            {items.map((_, idx) => (
              <button
                key={idx}
                className={`hcar__dot ${idx === i ? "is-active" : ""}`}
                onClick={() => setI(idx)}
                aria-label={`Produk ${idx + 1}`}
              ></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---- Produk spotlight (besar) ---- */
function Spotlight({ p, onOpen }) {
  return (
    <article className="spotlight" onClick={() => onOpen(p)}>
      <div className="spotlight__media">
        {p.foto ? <img src={p.foto} alt={p.nama} /> : <div className="spotlight__ph">🎖️</div>}
        <span className="spotlight__ribbon">⭐ Paling Favorit</span>
      </div>
      <div className="spotlight__body">
        <span className="spotlight__kicker">Rekomendasi Utama</span>
        <h3>{p.nama}</h3>
        <p>{p.deskripsi}</p>
        {p.ukuran && <div className="spotlight__meta">Ukuran tersedia: <strong>{p.ukuran}</strong></div>}
        <div className="spotlight__foot">
          <div className="spotlight__price">{rupiah(p.harga)} <small>{p.satuan_harga}</small></div>
          <button className="btn btn--primary btn--lg" onClick={(e) => { e.stopPropagation(); onOpen(p); }}>
            Lihat Detail →
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---- Kartu produk poster (klik = detail) ---- */
function PCard({ p, onOpen }) {
  return (
    <article className={`pcard ${!p.tersedia ? "pcard--off" : ""}`} onClick={() => onOpen(p)}>
      <div className="pcard__media">
        {p.foto ? <img src={p.foto} alt={p.nama} loading="lazy" /> : <div className="pcard__ph">🎖️</div>}
        <div className="pcard__grad"></div>
        {p.unggulan && <span className="pcard__badge">🔥 Laris</span>}
        {!p.tersedia && <span className="pcard__off">Tidak Tersedia</span>}
        <div className="pcard__price">{rupiah(p.harga)} <small>{p.satuan_harga}</small></div>
      </div>
      <div className="pcard__body">
        <h3 className="pcard__title">{p.nama}</h3>
        <p className="pcard__desc">{p.deskripsi}</p>
        <div className="pcard__foot">
          {p.ukuran ? <span className="pcard__size">📏 {p.ukuran}</span> : <span></span>}
          <span className="pcard__detail">Detail →</span>
        </div>
      </div>
    </article>
  );
}

/* ---- Modal detail produk ---- */
function ProductModal({ p, onClose, WaIcon }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__box" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Tutup">✕</button>
        <div className="modal__media">
          {p.foto ? <img src={p.foto} alt={p.nama} /> : <div className="modal__ph">🎖️</div>}
          {p.unggulan && <span className="modal__badge">⭐ Favorit</span>}
        </div>
        <div className="modal__body">
          <span className="modal__cat">Penyewaan Kostum</span>
          <h3 className="modal__title">{p.nama}</h3>
          <div className="modal__price">{rupiah(p.harga)} <small>{p.satuan_harga}</small></div>
          <div className="modal__specs">
            {p.ukuran && <span>📏 Ukuran: <strong>{p.ukuran}</strong></span>}
            <span className={p.tersedia ? "modal__ok" : "modal__no"}>
              {p.tersedia ? "✓ Tersedia" : "✕ Tidak tersedia"}
            </span>
          </div>
          <p className="modal__desc">{p.deskripsi || "Belum ada deskripsi untuk produk ini."}</p>
          <a href={waSewa(p.nama)} target="_blank" rel="noreferrer" className="btn btn--primary btn--lg btn--block modal__cta">
            <WaIcon /> Sewa via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
