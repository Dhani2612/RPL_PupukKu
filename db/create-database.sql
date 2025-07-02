-- DATABASE : SQL

-- Create database for Pupuk Ku system
CREATE DATABASE IF NOT EXISTS pupuk_ku;
USE pupuk_ku;

-- Create Distributor table
CREATE TABLE IF NOT EXISTS distributor (
    id_distributor INT PRIMARY KEY AUTO_INCREMENT,
    nama VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Pelanggan (Customer) table
CREATE TABLE IF NOT EXISTS pelanggan (
    nik VARCHAR(16) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    kelompok_tani VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    alamat TEXT,
    tanggal_lahir DATE,
    status_verifikasi BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Jatah_Pupuk (Fertilizer Quota) table
CREATE TABLE IF NOT EXISTS jatah_pupuk (
    id_jatah INT PRIMARY KEY AUTO_INCREMENT,
    nik VARCHAR(16),
    urea DECIMAL(10,2) DEFAULT 0,
    phonska DECIMAL(10,2) DEFAULT 0,
    organik DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nik) REFERENCES pelanggan(nik) ON DELETE CASCADE
);

-- Create Distribusi_Pupuk (Fertilizer Distribution) table
CREATE TABLE IF NOT EXISTS distribusi_pupuk (
    id_transaksi INT PRIMARY KEY AUTO_INCREMENT,
    tanggal DATE NOT NULL,
    jenis_pupuk ENUM('Urea', 'Phonska', 'Organik') NOT NULL,
    jumlah DECIMAL(10,2) NOT NULL,
    status_acc ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    nik VARCHAR(16),
    id_distributor INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nik) REFERENCES pelanggan(nik) ON DELETE CASCADE,
    FOREIGN KEY (id_distributor) REFERENCES distributor(id_distributor) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_pelanggan_nama ON pelanggan(nama);
CREATE INDEX idx_distribusi_tanggal ON distribusi_pupuk(tanggal);
CREATE INDEX idx_distribusi_status ON distribusi_pupuk(status_acc);
CREATE INDEX idx_jatah_nik ON jatah_pupuk(nik);
