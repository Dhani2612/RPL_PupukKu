-- DATABASE : SQL

-- Seed data for Pupuk Ku system
USE pupuk_ku;

-- Insert sample distributors
INSERT INTO distributor (nama, username, password) VALUES
('Administrator Utama', 'admin', 'admin123'), -- password: admin123
('Distributor Wilayah A', 'dist_a', 'admin123'), -- password: admin123
('Distributor Wilayah B', 'dist_b', 'admin123'); -- password: admin123

-- Insert sample customers (pelanggan)
INSERT INTO pelanggan (nik, nama, kelompok_tani, password, alamat, tanggal_lahir, status_verifikasi) VALUES
('1111223344556668', 'Siti Aminah', 'Tani Makmur', 'tani123', 'Jl. Sawah Indah No. 12', '1985-03-15', TRUE), -- password: tani123
('1111223344556669', 'Budi Santoso', 'Tani Sejahtera', 'tani123', 'Jl. Padi Emas No. 8', '1990-07-22', FALSE), -- password: tani123
('1111223344556670', 'Rina Wati', 'Tani Maju', 'tani123', 'Jl. Subur Makmur No. 5', '1988-12-08', TRUE), -- password: tani123
('1111223344556671', 'Ahmad Fauzi', 'Tani Berkah', 'tani123', 'Jl. Hijau Daun No. 20', '1992-09-03', TRUE), -- password: tani123
('1111223344556672', 'Dewi Sari', 'Tani Makmur', 'tani123', 'Jl. Bunga Raya No. 15', '1987-06-17', FALSE), -- password: tani123
('1111223344556673', 'Hendra Wijaya', 'Tani Sejahtera', 'tani123', 'Jl. Melati Putih No. 3', '1989-11-25', TRUE), -- password: tani123
('1111223344556674', 'Maya Indah', 'Tani Maju', 'tani123', 'Jl. Mawar Merah No. 7', '1991-04-12', TRUE), -- password: tani123
('1111223344556675', 'Joko Susilo', 'Tani Berkah', 'tani123', 'Jl. Kenanga No. 18', '1986-08-30', FALSE); -- password: tani123

-- Insert fertilizer quotas for customers
INSERT INTO jatah_pupuk (nik, urea, phonska, organik) VALUES
('1111223344556668', 50.00, 25.00, 30.00),
('1111223344556669', 40.00, 20.00, 25.00),
('1111223344556670', 60.00, 30.00, 35.00),
('1111223344556671', 45.00, 22.00, 28.00),
('1111223344556672', 35.00, 18.00, 22.00),
('1111223344556673', 55.00, 28.00, 32.00),
('1111223344556674', 35.00, 18.00, 22.00),
('1111223344556675', 50.00, 25.00, 30.00);

-- Insert sample distribution transactions
INSERT INTO distribusi_pupuk (tanggal, jenis_pupuk, jumlah, status_acc, nik, id_distributor) VALUES
('2024-01-15', 'Urea', 15.00, 'approved', '1111223344556668', 1),
('2024-01-14', 'Phonska', 10.00, 'approved', '1111223344556669', 1),
('2024-01-13', 'Organik', 12.00, 'approved', '1111223344556670', 1),
('2024-01-12', 'Urea', 20.00, 'approved', '1111223344556671', 1),
('2024-01-16', 'Phonska', 7.00, 'pending', '1111223344556668', 1),
('2024-01-15', 'Organik', 8.00, 'approved', '1111223344556674', 1),
('2024-01-14', 'Urea', 12.00, 'approved', '1111223344556673', 1);
