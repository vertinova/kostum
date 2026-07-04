package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/go-sql-driver/mysql"
)

// Store membungkus koneksi database MySQL.
type Store struct {
	db *sql.DB
}

// NewStore membuat database bila belum ada, membuka koneksi, menjalankan
// migrasi tabel, dan mengisi data contoh bila kosong.
func NewStore(user, pass, host, port, dbname string) (*Store, error) {
	// 1) Koneksi ke server (tanpa nama db) untuk CREATE DATABASE.
	rootCfg := mysql.NewConfig()
	rootCfg.User = user
	rootCfg.Passwd = pass
	rootCfg.Net = "tcp"
	rootCfg.Addr = host + ":" + port
	rootCfg.ParseTime = true

	root, err := sql.Open("mysql", rootCfg.FormatDSN())
	if err != nil {
		return nil, err
	}
	if err := root.Ping(); err != nil {
		root.Close()
		return nil, fmt.Errorf("tidak bisa terhubung ke MySQL (%s): %w", rootCfg.Addr, err)
	}
	if _, err := root.Exec("CREATE DATABASE IF NOT EXISTS `" + dbname + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"); err != nil {
		root.Close()
		return nil, fmt.Errorf("gagal membuat database: %w", err)
	}
	root.Close()

	// 2) Koneksi ke database yang dituju.
	cfg := rootCfg
	cfg.DBName = dbname
	db, err := sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		return nil, err
	}
	db.SetConnMaxLifetime(3 * time.Minute)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	if err := db.Ping(); err != nil {
		return nil, err
	}

	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		return nil, err
	}
	if err := s.seedIfEmpty(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS products (
			id            BIGINT AUTO_INCREMENT PRIMARY KEY,
			nama          VARCHAR(200) NOT NULL,
			kategori      VARCHAR(20)  NOT NULL DEFAULT 'sewa',
			deskripsi     TEXT,
			harga         BIGINT       NOT NULL DEFAULT 0,
			satuan_harga  VARCHAR(50)  DEFAULT '',
			ukuran        VARCHAR(100) DEFAULT '',
			foto          VARCHAR(300) DEFAULT '',
			unggulan      BOOLEAN      NOT NULL DEFAULT FALSE,
			tersedia      BOOLEAN      NOT NULL DEFAULT TRUE,
			dibuat_pada   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
		`CREATE TABLE IF NOT EXISTS messages (
			id           BIGINT AUTO_INCREMENT PRIMARY KEY,
			nama         VARCHAR(150) NOT NULL,
			email        VARCHAR(150) DEFAULT '',
			telepon      VARCHAR(50)  DEFAULT '',
			isi          TEXT NOT NULL,
			dibuat_pada  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
	}
	for _, q := range stmts {
		if _, err := s.db.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) seedIfEmpty() error {
	var n int
	if err := s.db.QueryRow("SELECT COUNT(*) FROM products").Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	log.Println("Mengisi data contoh produk...")
	samples := []Product{
		{Nama: "Kostum Paskibra Lengkap - Putih", Kategori: KategoriSewa, Deskripsi: "Set lengkap seragam PDU paskibra warna putih: baju, celana/rok, topi, sarung tangan, dan atribut. Bahan drill premium, jahitan rapi.", Harga: 75000, SatuanHarga: "/ hari", Ukuran: "S, M, L, XL", Unggulan: true, Tersedia: true},
		{Nama: "Jahit Kostum Paskibra Custom", Kategori: KategoriPembuatan, Deskripsi: "Pembuatan kostum paskibra sesuai ukuran badan dan desain sekolah. Konsultasi bahan, bordir logo, dan finishing profesional.", Harga: 350000, SatuanHarga: "/ set", Ukuran: "Custom", Unggulan: true, Tersedia: true},
		{Nama: "Selempang & Atribut Pengibar", Kategori: KategoriSewa, Deskripsi: "Selempang, kopel rim, dan atribut kelengkapan pasukan pengibar bendera. Kondisi terawat dan bersih.", Harga: 25000, SatuanHarga: "/ hari", Ukuran: "All size", Tersedia: true},
		{Nama: "Sepatu PDL Paskibra", Kategori: KategoriSewa, Deskripsi: "Sepatu PDL hitam mengkilap untuk kelengkapan pasukan. Tersedia berbagai ukuran.", Harga: 30000, SatuanHarga: "/ hari", Ukuran: "37 - 44", Tersedia: true},
	}
	for _, p := range samples {
		if _, err := s.CreateProduct(&p); err != nil {
			return err
		}
	}
	return nil
}

// ---------- Product queries ----------

func (s *Store) ListProducts(kategori string) ([]Product, error) {
	q := "SELECT id, nama, kategori, deskripsi, harga, satuan_harga, ukuran, foto, unggulan, tersedia, dibuat_pada FROM products"
	args := []any{}
	if kategori == KategoriSewa || kategori == KategoriPembuatan {
		q += " WHERE kategori = ?"
		args = append(args, kategori)
	}
	q += " ORDER BY dibuat_pada DESC, id DESC"

	rows, err := s.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []Product{}
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Nama, &p.Kategori, &p.Deskripsi, &p.Harga, &p.SatuanHarga, &p.Ukuran, &p.Foto, &p.Unggulan, &p.Tersedia, &p.DibuatPada); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) GetProduct(id int64) (*Product, error) {
	var p Product
	err := s.db.QueryRow(
		"SELECT id, nama, kategori, deskripsi, harga, satuan_harga, ukuran, foto, unggulan, tersedia, dibuat_pada FROM products WHERE id = ?", id,
	).Scan(&p.ID, &p.Nama, &p.Kategori, &p.Deskripsi, &p.Harga, &p.SatuanHarga, &p.Ukuran, &p.Foto, &p.Unggulan, &p.Tersedia, &p.DibuatPada)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) CreateProduct(p *Product) (int64, error) {
	res, err := s.db.Exec(
		`INSERT INTO products (nama, kategori, deskripsi, harga, satuan_harga, ukuran, foto, unggulan, tersedia)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		p.Nama, p.Kategori, p.Deskripsi, p.Harga, p.SatuanHarga, p.Ukuran, p.Foto, p.Unggulan, p.Tersedia,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) UpdateProduct(p *Product) error {
	_, err := s.db.Exec(
		`UPDATE products SET nama=?, kategori=?, deskripsi=?, harga=?, satuan_harga=?, ukuran=?, foto=?, unggulan=?, tersedia=? WHERE id=?`,
		p.Nama, p.Kategori, p.Deskripsi, p.Harga, p.SatuanHarga, p.Ukuran, p.Foto, p.Unggulan, p.Tersedia, p.ID,
	)
	return err
}

func (s *Store) DeleteProduct(id int64) error {
	_, err := s.db.Exec("DELETE FROM products WHERE id = ?", id)
	return err
}

// ---------- Message queries ----------

func (s *Store) ListMessages() ([]Message, error) {
	rows, err := s.db.Query("SELECT id, nama, email, telepon, isi, dibuat_pada FROM messages ORDER BY dibuat_pada DESC, id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Message{}
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.Nama, &m.Email, &m.Telepon, &m.Isi, &m.DibuatPada); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) CreateMessage(m *Message) (int64, error) {
	res, err := s.db.Exec(
		"INSERT INTO messages (nama, email, telepon, isi) VALUES (?, ?, ?, ?)",
		m.Nama, m.Email, m.Telepon, m.Isi,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) DeleteMessage(id int64) error {
	_, err := s.db.Exec("DELETE FROM messages WHERE id = ?", id)
	return err
}
