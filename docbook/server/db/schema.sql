-- MediSlot Database Schema
-- Relational Database: PostgreSQL

DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users table (Stores authentication and role information)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors table (Stores doctor profile linked to a user account)
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL CHECK (experience_years >= 0)
);

-- 3. Slots table (Availability slots published by doctors)
CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    CONSTRAINT check_slot_times CHECK (end_time > start_time)
);

-- 4. Appointments table (Booked appointments linking patient, doctor, and slot)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    slot_id INT UNIQUE NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Prescriptions table (Notes & medicine issued by doctor for an appointment)
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    appointment_id INT UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    medicines TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance on foreign keys & filtering
CREATE INDEX idx_slots_doctor_date ON slots(doctor_id, slot_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
