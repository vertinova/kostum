// Klien API terpusat untuk berkomunikasi dengan backend Go.
// Token disimpan di localStorage dan dikirim sebagai Bearer.

const TOKEN_KEY = "kostum_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}
export function isAuthed() {
  return !!getToken();
}

async function request(method, path, body, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401) setToken("");
    throw new Error((data && data.error) || `Terjadi kesalahan (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request("POST", "/auth/login", { username, password }),
  logout: () => request("POST", "/auth/logout"),
  me: () => request("GET", "/auth/me"),

  // Produk
  listProducts: (kategori) =>
    request("GET", `/products${kategori && kategori !== "semua" ? `?kategori=${kategori}` : ""}`),
  getProduct: (id) => request("GET", `/products/${id}`),
  createProduct: (p) => request("POST", "/products", p),
  updateProduct: (id, p) => request("PUT", `/products/${id}`, p),
  deleteProduct: (id) => request("DELETE", `/products/${id}`),

  // Upload
  upload: (file) => {
    const fd = new FormData();
    fd.append("foto", file);
    return request("POST", "/upload", fd, true);
  },

  // Pesan
  listMessages: () => request("GET", "/messages"),
  createMessage: (m) => request("POST", "/messages", m),
  deleteMessage: (id) => request("DELETE", `/messages/${id}`),
};

// Util format Rupiah
export function rupiah(v) {
  return "Rp" + Number(v || 0).toLocaleString("id-ID");
}
