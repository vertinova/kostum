package main

import (
	"log"
	"net/http"
	"os"
	"strings"
)

func main() {
	// ---- Konfigurasi (default = Laragon MySQL) ----
	addr := getenv("ADDR", ":8080")
	// Default kosong => path foto relatif (mis. /uploads/x.jpg), di-proxy
	// oleh Vite saat dev & same-origin saat produksi. Set absolut bila perlu.
	baseURL := getenv("BASE_URL", "")
	uploadDir := getenv("UPLOAD_DIR", "uploads")

	dbUser := getenv("DB_USER", "root")
	dbPass := getenv("DB_PASS", "") // Laragon default: tanpa password
	dbHost := getenv("DB_HOST", "127.0.0.1")
	dbPort := getenv("DB_PORT", "3306")
	dbName := getenv("DB_NAME", "kostum_paskibra")

	adminUser := getenv("ADMIN_USER", "admin")
	adminPass := getenv("ADMIN_PASS", "admin123")

	corsOrigin := getenv("CORS_ORIGIN", "*")

	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Fatalf("gagal membuat folder upload: %v", err)
	}

	store, err := NewStore(dbUser, dbPass, dbHost, dbPort, dbName)
	if err != nil {
		log.Fatalf("gagal koneksi database: %v", err)
	}
	defer store.Close()

	srv := NewServer(store, uploadDir, baseURL, adminUser, adminPass)

	mux := http.NewServeMux()

	// Static: file foto yang diunggah
	mux.Handle("GET /uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))

	// Health check
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Auth
	mux.HandleFunc("POST /api/auth/login", srv.handleLogin)
	mux.HandleFunc("POST /api/auth/logout", srv.requireAuth(srv.handleLogout))
	mux.HandleFunc("GET /api/auth/me", srv.requireAuth(srv.handleMe))

	// Produk (publik: list & detail)
	mux.HandleFunc("GET /api/products", srv.handleListProducts)
	mux.HandleFunc("GET /api/products/{id}", srv.handleGetProduct)
	// Produk (admin)
	mux.HandleFunc("POST /api/products", srv.requireAuth(srv.handleCreateProduct))
	mux.HandleFunc("PUT /api/products/{id}", srv.requireAuth(srv.handleUpdateProduct))
	mux.HandleFunc("DELETE /api/products/{id}", srv.requireAuth(srv.handleDeleteProduct))

	// Upload foto (admin)
	mux.HandleFunc("POST /api/upload", srv.requireAuth(srv.handleUpload))

	// Pesan
	mux.HandleFunc("POST /api/messages", srv.handleCreateMessage)               // publik (form kontak)
	mux.HandleFunc("GET /api/messages", srv.requireAuth(srv.handleListMessages)) // admin
	mux.HandleFunc("DELETE /api/messages/{id}", srv.requireAuth(srv.handleDeleteMessage))

	handler := cors(corsOrigin)(logRequest(mux))

	log.Printf("=====================================================")
	log.Printf(" Backend Kostum Paskibra (REST API + MySQL)")
	log.Printf(" API      : http://localhost%s/api", addr)
	log.Printf(" Uploads  : http://localhost%s/uploads", addr)
	log.Printf(" DB       : %s@%s:%s/%s", dbUser, dbHost, dbPort, dbName)
	log.Printf(" Admin    : %s / %s", adminUser, adminPass)
	log.Printf("=====================================================")

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// cors mengizinkan permintaan lintas-origin dari frontend Vite.
func cors(origin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "86400")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func logRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/uploads/") {
			log.Printf("%s %s", r.Method, r.URL.Path)
		}
		next.ServeHTTP(w, r)
	})
}
