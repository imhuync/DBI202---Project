
-- =============================================
-- HOTEL MANAGEMENT SYSTEM - DATABASE SCHEMA
-- BASIC SQL (SQL SERVER COMPATIBLE)
-- =============================================

-- =============================================
-- 1. ROOM_TYPE - Loai phong
-- =============================================
CREATE TABLE ROOM_TYPE
(
    type_id INT IDENTITY(1,1) PRIMARY KEY,
    type_name NVARCHAR(50) NOT NULL,
    base_price DECIMAL(12,2) NOT NULL CHECK (base_price >= 0),
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    description NVARCHAR(500) NULL
);

-- =============================================
-- 2. ROOM - Phong
-- =============================================
CREATE TABLE ROOM
(
    room_id INT IDENTITY(1,1) PRIMARY KEY,
    room_number NVARCHAR(10) NOT NULL UNIQUE,
    type_id INT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'Clean'
        CHECK (status IN ('Clean', 'Dirty', 'Maintenance', 'Occupied')),
    floor INT NOT NULL CHECK (floor > 0),

    CONSTRAINT FK_ROOM_ROOM_TYPE
        FOREIGN KEY (type_id) REFERENCES ROOM_TYPE(type_id)
);

-- =============================================
-- 3. GUEST - Khach hang
-- =============================================
CREATE TABLE GUEST
(
    guest_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NULL,
    phone NVARCHAR(20) NULL,
    id_card NVARCHAR(20) NOT NULL UNIQUE,
    nationality NVARCHAR(50) NULL DEFAULT 'Vietnam'
);

-- =============================================
-- 4. EMPLOYEE - Nhan vien
-- =============================================
CREATE TABLE EMPLOYEE
(
    emp_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    role NVARCHAR(30) NOT NULL
        CHECK (role IN ('Receptionist', 'Manager', 'Housekeeper', 'Admin')),
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(256) NOT NULL
);

-- =============================================
-- 5. BOOKING - Don dat phong
-- =============================================
CREATE TABLE BOOKING
(
    booking_id INT IDENTITY(1,1) PRIMARY KEY,
    guest_id INT NOT NULL,
    emp_id INT NOT NULL,
    booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_checkin DATETIME NOT NULL,
    expected_checkout DATETIME NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
    total_deposit DECIMAL(12,2) NULL DEFAULT 0,

    CONSTRAINT FK_BOOKING_GUEST
        FOREIGN KEY (guest_id) REFERENCES GUEST(guest_id),
    CONSTRAINT FK_BOOKING_EMPLOYEE
        FOREIGN KEY (emp_id) REFERENCES EMPLOYEE(emp_id),
    CONSTRAINT CK_BOOKING_DATES
        CHECK (expected_checkout > expected_checkin)
);

-- =============================================
-- 6. BOOKING_DETAIL - Chi tiet dat phong
-- =============================================
CREATE TABLE BOOKING_DETAIL
(
    detail_id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT NOT NULL,
    room_id INT NOT NULL,
    actual_checkin DATETIME NULL,
    actual_checkout DATETIME NULL,
    price_at_booking DECIMAL(12,2) NOT NULL CHECK (price_at_booking >= 0),

    CONSTRAINT FK_BD_BOOKING
        FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id),
    CONSTRAINT FK_BD_ROOM
        FOREIGN KEY (room_id) REFERENCES ROOM(room_id)
);

-- =============================================
-- 7. SERVICE - Dich vu
-- =============================================
CREATE TABLE SERVICE
(
    service_id INT IDENTITY(1,1) PRIMARY KEY,
    service_name NVARCHAR(100) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    unit NVARCHAR(30) NOT NULL
);

-- =============================================
-- 8. SERVICE_USAGE - Su dung dich vu
-- =============================================
CREATE TABLE SERVICE_USAGE
(
    usage_id INT IDENTITY(1,1) PRIMARY KEY,
    booking_detail_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),

    CONSTRAINT FK_SU_BOOKING_DETAIL
        FOREIGN KEY (booking_detail_id) REFERENCES BOOKING_DETAIL(detail_id),
    CONSTRAINT FK_SU_SERVICE
        FOREIGN KEY (service_id) REFERENCES SERVICE(service_id)
);

-- =============================================
-- 9. INVOICE - Hoa don
-- =============================================
CREATE TABLE INVOICE
(
    invoice_id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    room_charge DECIMAL(12,2) NOT NULL DEFAULT 0,
    service_charge DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_date DATETIME NULL,
    payment_method NVARCHAR(30) NULL
        CHECK (payment_method IN ('Cash', 'Card', 'Transfer', 'E-Wallet')),

    CONSTRAINT FK_INVOICE_BOOKING
        FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IX_ROOM_type_id ON ROOM(type_id);
CREATE INDEX IX_ROOM_status ON ROOM(status);
CREATE INDEX IX_BOOKING_guest_id ON BOOKING(guest_id);
CREATE INDEX IX_BOOKING_emp_id ON BOOKING(emp_id);
CREATE INDEX IX_BOOKING_status ON BOOKING(status);
CREATE INDEX IX_BD_booking_id ON BOOKING_DETAIL(booking_id);
CREATE INDEX IX_BD_room_id ON BOOKING_DETAIL(room_id);
CREATE INDEX IX_SU_detail_id ON SERVICE_USAGE(booking_detail_id);
CREATE INDEX IX_SU_service_id ON SERVICE_USAGE(service_id);
