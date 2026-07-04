package main

import "time"

// Kategori produk
const (
	KategoriSewa      = "sewa"
	KategoriPembuatan = "pembuatan"
)

// Product merepresentasikan satu kostum paskibra (sewa atau pembuatan).
type Product struct {
	ID          int64     `json:"id"`
	Nama        string    `json:"nama"`
	Kategori    string    `json:"kategori"`
	Deskripsi   string    `json:"deskripsi"`
	Harga       int64     `json:"harga"`
	SatuanHarga string    `json:"satuan_harga"`
	Ukuran      string    `json:"ukuran"`
	Foto        string    `json:"foto"`
	Unggulan    bool      `json:"unggulan"`
	Tersedia    bool      `json:"tersedia"`
	DibuatPada  time.Time `json:"dibuat_pada"`
}

// Message adalah pesan/kontak masuk dari calon penyewa.
type Message struct {
	ID         int64     `json:"id"`
	Nama       string    `json:"nama"`
	Email      string    `json:"email"`
	Telepon    string    `json:"telepon"`
	Isi        string    `json:"isi"`
	DibuatPada time.Time `json:"dibuat_pada"`
}
