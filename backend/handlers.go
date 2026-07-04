package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Server memegang dependensi handler REST API.
type Server struct {
	store     *Store
	uploadDir string
	baseURL   string // untuk membentuk URL foto absolut, mis. http://localhost:8080

	adminUser string
	adminPass string

	sessMu   sync.RWMutex
	sessions map[string]time.Time
}

func NewServer(store *Store, uploadDir, baseURL, adminUser, adminPass string) *Server {
	return &Server{
		store:     store,
		uploadDir: uploadDir,
		baseURL:   baseURL,
		adminUser: adminUser,
		adminPass: adminPass,
		sessions:  make(map[string]time.Time),
	}
}

// ---------- Helpers ----------

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func randToken() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// fotoURL menambahkan baseURL bila foto berupa path relatif.
func (s *Server) fotoURL(foto string) string {
	if foto == "" || strings.HasPrefix(foto, "http") {
		return foto
	}
	return s.baseURL + foto
}

func (s *Server) withFotoURL(p Product) Product {
	p.Foto = s.fotoURL(p.Foto)
	return p
}

// ---------- Auth ----------

func (s *Server) newSession() string {
	token := randToken()
	s.sessMu.Lock()
	s.sessions[token] = time.Now().Add(12 * time.Hour)
	s.sessMu.Unlock()
	return token
}

func (s *Server) validToken(token string) bool {
	s.sessMu.RLock()
	exp, ok := s.sessions[token]
	s.sessMu.RUnlock()
	return ok && time.Now().Before(exp)
}

func (s *Server) bearer(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	return ""
}

// requireAuth adalah middleware yang memvalidasi token bearer.
func (s *Server) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.validToken(s.bearer(r)) {
			writeErr(w, http.StatusUnauthorized, "Sesi tidak valid atau kadaluarsa. Silakan login kembali.")
			return
		}
		next(w, r)
	}
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, http.StatusBadRequest, "Body tidak valid")
		return
	}
	if body.Username != s.adminUser || body.Password != s.adminPass {
		writeErr(w, http.StatusUnauthorized, "Username atau password salah")
		return
	}
	token := s.newSession()
	writeJSON(w, http.StatusOK, map[string]any{
		"token": token,
		"user":  map[string]string{"username": s.adminUser},
	})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	token := s.bearer(r)
	s.sessMu.Lock()
	delete(s.sessions, token)
	s.sessMu.Unlock()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"username": s.adminUser})
}

// ---------- Products ----------

func (s *Server) handleListProducts(w http.ResponseWriter, r *http.Request) {
	kategori := r.URL.Query().Get("kategori")
	list, err := s.store.ListProducts(kategori)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	for i := range list {
		list[i].Foto = s.fotoURL(list[i].Foto)
	}
	writeJSON(w, http.StatusOK, list)
}

func (s *Server) handleGetProduct(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "ID tidak valid")
		return
	}
	p, err := s.store.GetProduct(id)
	if err == sql.ErrNoRows {
		writeErr(w, http.StatusNotFound, "Produk tidak ditemukan")
		return
	} else if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, s.withFotoURL(*p))
}

// productPayload dipakai untuk create/update via JSON.
type productPayload struct {
	Nama        string `json:"nama"`
	Kategori    string `json:"kategori"`
	Deskripsi   string `json:"deskripsi"`
	Harga       int64  `json:"harga"`
	SatuanHarga string `json:"satuan_harga"`
	Ukuran      string `json:"ukuran"`
	Foto        string `json:"foto"`
	Unggulan    bool   `json:"unggulan"`
	Tersedia    bool   `json:"tersedia"`
}

func normalizeKategori(k string) string {
	if k == KategoriPembuatan {
		return KategoriPembuatan
	}
	return KategoriSewa
}

// stripBase membuang baseURL agar yang tersimpan di DB tetap path relatif.
func (s *Server) stripBase(foto string) string {
	return strings.TrimPrefix(foto, s.baseURL)
}

func (s *Server) handleCreateProduct(w http.ResponseWriter, r *http.Request) {
	var in productPayload
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeErr(w, http.StatusBadRequest, "Body tidak valid")
		return
	}
	if strings.TrimSpace(in.Nama) == "" {
		writeErr(w, http.StatusBadRequest, "Nama produk wajib diisi")
		return
	}
	p := &Product{
		Nama:        strings.TrimSpace(in.Nama),
		Kategori:    normalizeKategori(in.Kategori),
		Deskripsi:   in.Deskripsi,
		Harga:       in.Harga,
		SatuanHarga: in.SatuanHarga,
		Ukuran:      in.Ukuran,
		Foto:        s.stripBase(in.Foto),
		Unggulan:    in.Unggulan,
		Tersedia:    in.Tersedia,
	}
	id, err := s.store.CreateProduct(p)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	p.ID = id
	created, _ := s.store.GetProduct(id)
	writeJSON(w, http.StatusCreated, s.withFotoURL(*created))
}

func (s *Server) handleUpdateProduct(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "ID tidak valid")
		return
	}
	existing, err := s.store.GetProduct(id)
	if err == sql.ErrNoRows {
		writeErr(w, http.StatusNotFound, "Produk tidak ditemukan")
		return
	} else if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	var in productPayload
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeErr(w, http.StatusBadRequest, "Body tidak valid")
		return
	}
	if strings.TrimSpace(in.Nama) == "" {
		writeErr(w, http.StatusBadRequest, "Nama produk wajib diisi")
		return
	}

	newFoto := s.stripBase(in.Foto)
	// Bila foto berubah dan foto lama adalah file upload lokal, hapus file lama.
	if existing.Foto != "" && existing.Foto != newFoto {
		s.deleteFotoFile(existing.Foto)
	}

	existing.Nama = strings.TrimSpace(in.Nama)
	existing.Kategori = normalizeKategori(in.Kategori)
	existing.Deskripsi = in.Deskripsi
	existing.Harga = in.Harga
	existing.SatuanHarga = in.SatuanHarga
	existing.Ukuran = in.Ukuran
	existing.Foto = newFoto
	existing.Unggulan = in.Unggulan
	existing.Tersedia = in.Tersedia

	if err := s.store.UpdateProduct(existing); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, s.withFotoURL(*existing))
}

func (s *Server) handleDeleteProduct(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "ID tidak valid")
		return
	}
	if p, err := s.store.GetProduct(id); err == nil && p.Foto != "" {
		s.deleteFotoFile(p.Foto)
	}
	if err := s.store.DeleteProduct(id); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ---------- Upload ----------

var allowedExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true,
}

func (s *Server) handleUpload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(15 << 20); err != nil {
		writeErr(w, http.StatusBadRequest, "Gagal memproses upload: "+err.Error())
		return
	}
	file, header, err := r.FormFile("foto")
	if err != nil {
		writeErr(w, http.StatusBadRequest, "File 'foto' tidak ditemukan")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExt[ext] {
		writeErr(w, http.StatusBadRequest, "Format tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF")
		return
	}

	name := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), randToken()[:8], ext)
	dst := filepath.Join(s.uploadDir, name)
	out, err := os.Create(dst)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer out.Close()
	if _, err := io.Copy(out, file); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	rel := "/uploads/" + name
	writeJSON(w, http.StatusCreated, map[string]string{
		"foto": rel,
		"url":  s.baseURL + rel,
	})
}

func (s *Server) deleteFotoFile(foto string) {
	name := strings.TrimPrefix(s.stripBase(foto), "/uploads/")
	if name == "" || strings.Contains(name, "..") || strings.HasPrefix(foto, "http") && !strings.HasPrefix(foto, s.baseURL) {
		return
	}
	_ = os.Remove(filepath.Join(s.uploadDir, name))
}

// ---------- Messages ----------

func (s *Server) handleCreateMessage(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Nama    string `json:"nama"`
		Email   string `json:"email"`
		Telepon string `json:"telepon"`
		Isi     string `json:"isi"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeErr(w, http.StatusBadRequest, "Body tidak valid")
		return
	}
	if strings.TrimSpace(in.Nama) == "" || strings.TrimSpace(in.Isi) == "" {
		writeErr(w, http.StatusBadRequest, "Nama dan pesan wajib diisi")
		return
	}
	m := &Message{
		Nama:    strings.TrimSpace(in.Nama),
		Email:   strings.TrimSpace(in.Email),
		Telepon: strings.TrimSpace(in.Telepon),
		Isi:     strings.TrimSpace(in.Isi),
	}
	if _, err := s.store.CreateMessage(m); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (s *Server) handleListMessages(w http.ResponseWriter, r *http.Request) {
	list, err := s.store.ListMessages()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (s *Server) handleDeleteMessage(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "ID tidak valid")
		return
	}
	if err := s.store.DeleteMessage(id); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
