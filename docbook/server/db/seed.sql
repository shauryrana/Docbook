-- MediSlot Sample Seed Data
-- Default password for all seed accounts: password123
-- Bcrypt Hash: $2a$10$ePzd./xL2ef/3RBA0R/jAON.w8LgY47XpMzQgwkHOkFOzudaVLYvS

-- 1. Insert Users (1 Admin, 2 Doctors, 1 Patient)
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Rohan Verma', 'rohan.admin@gmail.com', '$2a$10$ePzd./xL2ef/3RBA0R/jAON.w8LgY47XpMzQgwkHOkFOzudaVLYvS', 'admin'),
(2, 'Dr. Dishti Kaushik', 'dishti7@gmail.com', '$2a$10$ePzd./xL2ef/3RBA0R/jAON.w8LgY47XpMzQgwkHOkFOzudaVLYvS', 'doctor'),
(3, 'Dr. Gunjan Sharma', 'gunjan8@gmail.com', '$2a$10$ePzd./xL2ef/3RBA0R/jAON.w8LgY47XpMzQgwkHOkFOzudaVLYvS', 'doctor'),
(4, 'Rahul Verma', 'rahul.patient@gmail.com', '$2a$10$ePzd./xL2ef/3RBA0R/jAON.w8LgY47XpMzQgwkHOkFOzudaVLYvS', 'patient')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. Insert Doctor Profiles
INSERT INTO doctors (id, user_id, specialization, experience_years) VALUES
(1, 2, 'Cardiology', 12),
(2, 3, 'Dermatology', 8)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for doctors
SELECT setval('doctors_id_seq', (SELECT MAX(id) FROM doctors));

-- 3. Insert Sample Slots for Doctors
-- Using CURRENT_DATE + offsets for fresh presentation slots
INSERT INTO slots (id, doctor_id, slot_date, start_time, end_time, is_booked) VALUES
(1, 1, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '09:30:00', false),
(2, 1, CURRENT_DATE + INTERVAL '1 day', '10:00:00', '10:30:00', false),
(3, 1, CURRENT_DATE + INTERVAL '1 day', '11:00:00', '11:30:00', false),
(4, 1, CURRENT_DATE + INTERVAL '2 days', '14:00:00', '14:30:00', false),
(5, 2, CURRENT_DATE + INTERVAL '1 day', '10:00:00', '10:30:00', false),
(6, 2, CURRENT_DATE + INTERVAL '1 day', '11:30:00', '12:00:00', false),
(7, 2, CURRENT_DATE + INTERVAL '2 days', '15:00:00', '15:30:00', false),
(8, 2, CURRENT_DATE + INTERVAL '2 days', '16:00:00', '16:30:00', false)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for slots
SELECT setval('slots_id_seq', (SELECT MAX(id) FROM slots));
