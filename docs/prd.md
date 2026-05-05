# PRODUCT REQUIREMENTS DOCUMENT (PRD)

[cite_start]**Nama Proyek:** TransBandung Smart Monitoring (TBSM) [cite: 28]
[cite_start]**Domain:** Sistem Transportasi Kota [cite: 12, 14]
**Lead Developer:** Fathurrahman Pratama Putra
[cite_start]**Target Rilis:** 4 Mei 2026 (ETS 2 Cloud Computing) [cite: 67]

---

## 1. Ringkasan Eksekutif
[cite_start]Bagi masyarakat yang membutuhkan informasi jadwal transportasi umum dan kemacetan, TransBandung Smart Monitoring (TBSM) adalah aplikasi berbasis web *cloud-native* yang memantau pergerakan transportasi umum secara semi *real-time* [cite: 20] [cite_start]dan menyediakan sistem pelaporan kemacetan atau kecelakaan berbasis masyarakat[cite: 21]. [cite_start]Sistem ini dirancang untuk berjalan secara optimal di infrastruktur AWS menggunakan layanan *container* ECS [cite: 36][cite_start], basis data terisolasi di RDS [cite: 37][cite_start], serta jaringan pengiriman konten melalui CloudFront[cite: 39].

## 2. Tujuan & Sasaran
* [cite_start]**Tujuan Pengguna:** Memberikan kepastian jadwal rute transportasi [cite: 22] [cite_start]dan menyediakan wadah laporan kemacetan/kecelakaan jalan raya yang cepat diakses[cite: 21].
* [cite_start]**Tujuan Teknis (Berdasarkan Evaluasi):** Mengimplementasikan metode keamanan dan rekayasa jaringan menggunakan *service cloud computing* [cite: 8][cite_start], mencapai nilai maksimal pada seluruh komponen evaluasi[cite: 106, 107].

## 3. Target Pengguna
[cite_start]Target pengguna sistem mencakup masyarakat umum dan admin pengelola[cite: 30].

---

## 4. Fitur Utama & Fungsionalitas
[cite_start]Sistem ini wajib memiliki minimal 3 fitur utama [cite: 44] [cite_start]dan minimal 1 fitur *upload* file ke S3[cite: 45]:

### 4.1. Monitoring Transportasi Umum (Fitur Utama 1)
* [cite_start]**Deskripsi:** Menampilkan informasi rute dan jadwal transportasi (seperti bus kota atau angkot) secara semi *real-time*[cite: 20, 22].
* **Acceptance Criteria:** Pengguna dapat melihat daftar rute yang diambil dari basis data.

### 4.2. Sistem Pelaporan Kemacetan Berbasis Masyarakat (Fitur Utama 2)
* [cite_start]**Deskripsi:** Formulir bagi pengguna untuk mengirimkan laporan teks terkait kondisi lalu lintas, kemacetan, atau kecelakaan[cite: 21].
* [cite_start]**Acceptance Criteria:** Semua data laporan wajib tersimpan di RDS[cite: 47].

### 4.3. Integrasi Bukti Laporan (Fitur Utama 3 - Wajib Upload)
* [cite_start]**Deskripsi:** Fitur bagi masyarakat untuk mengunggah foto laporan bukti kejadian[cite: 46].
* [cite_start]**Acceptance Criteria:** * File wajib terunggah dan tersimpan ke Amazon S3[cite: 38].
    * [cite_start]Konten statis wajib diakses melalui CloudFront[cite: 48]. [cite_start]Akses file tidak boleh langsung ke S3[cite: 64].

### 4.4. Dashboard Validasi Admin (Fitur Utama Tambahan)
* **Deskripsi:** Halaman khusus admin untuk melihat rekapan laporan warga dan mengubah status penyelesaian.
* [cite_start]**Acceptance Criteria:** Admin dapat membaca data dari RDS [cite: 37] [cite_start]dan melihat gambar yang dimuat melalui CDN CloudFront[cite: 48].

---

## 5. Spesifikasi Arsitektur & Infrastruktur Cloud
[cite_start]Aplikasi tidak dijalankan langsung di EC2 manual[cite: 60], melainkan menggunakan spesifikasi berikut:

* [cite_start]**VPC & Networking:** Arsitektur menggunakan VPC [cite: 51] [cite_start]yang terbagi menjadi Public Subnet (untuk ECS/Load Balancer) dan Private Subnet (untuk RDS)[cite: 52].
* [cite_start]**Compute (ECS):** Aplikasi dijalankan menggunakan Docker melalui layanan Amazon ECS[cite: 36, 53].
* [cite_start]**Database (RDS):** Menggunakan Amazon RDS yang berjalan di dalam Private Subnet[cite: 37, 54].
* [cite_start]**Storage & CDN (S3 + CloudFront):** Penyimpanan file menggunakan S3 [cite: 55] [cite_start]dengan Amazon CloudFront (CDN) berada di depan S3 [cite: 56] [cite_start]untuk distribusi konten statis[cite: 39].
* [cite_start]**CI/CD Pipeline:** *Source code* disimpan di GitHub[cite: 41]. [cite_start]Proses *deployment* menggunakan GitHub Actions untuk CI/CD *pipeline* ke ECR/ECS[cite: 40, 58]. [cite_start]*Image* Docker wajib disimpan di ECR[cite: 61].

---

## 6. Kriteria Penilaian Maksimal
[cite_start]Sistem wajib dapat diakses *online* saat ETS2[cite: 67]. Berikut target capaian bobot nilai:

| Komponen Penilaian | Target Implementasi untuk Skor Sangat Baik (85-100) | Bobot |
| :--- | :--- | :--- |
| **Deploy Aplikasi** | [cite_start]Aplikasi berjalan stabil dan dapat diakses publik tanpa error[cite: 106]. | [cite_start]10% [cite: 106] |
| **Docker + ECS** | [cite_start]Menggunakan ECS dengan benar, *container* berjalan optimal[cite: 106]. | [cite_start]15% [cite: 106] |
| **ECR Deployment** | [cite_start]*Image* tersimpan di ECR dan digunakan dalam *deployment*[cite: 106]. | [cite_start]5% [cite: 106] |
| **Database RDS** | [cite_start]Database berjalan di *private subnet* dan terhubung dengan aplikasi[cite: 107]. | [cite_start]10% [cite: 107] |
| **Storage S3** | [cite_start]*Upload* file ke S3 berjalan baik dan terintegrasi[cite: 107]. | [cite_start]10% [cite: 107] |
| **CDN CloudFront** | [cite_start]Semua konten statis diakses via CloudFront[cite: 107]. | [cite_start]10% [cite: 107] |
| **CI/CD GitHub** | [cite_start]*Pipeline* otomatis *build & deploy* ke ECS berjalan[cite: 107]. | [cite_start]5% [cite: 107] |
| **Arsitektur Cloud** | [cite_start]Semua komponen sesuai (VPC, subnet, ECS, RDS, S3, CDN)[cite: 107]. [cite_start]Diagram dibuat sendiri, bukan menggunakan AI[cite: 95]. | [cite_start]5% [cite: 107] |