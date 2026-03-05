-- =============================================
-- HOTEL MANAGEMENT SYSTEM - SAMPLE DATA
-- SQL SERVER COMPATIBLE
-- =============================================

-- =============================================
-- 1. ROOM_TYPE
-- =============================================
SET IDENTITY_INSERT ROOM_TYPE ON;
INSERT INTO ROOM_TYPE
    (type_id, type_name, base_price, max_capacity, description)
VALUES
    (1, N'Single', 500000, 1, N'Phòng đơn, 1 giường đơn, WiFi, TV, minibar'),
    (2, N'Double', 800000, 2, N'Phòng đôi, 1 giường lớn, WiFi, TV, minibar, ban công'),
    (3, N'Twin', 850000, 2, N'Phòng 2 giường đơn, WiFi, TV, minibar'),
    (4, N'VIP Suite', 2000000, 4, N'Phòng VIP, phòng khách riêng, jacuzzi, view thành phố'),
    (5, N'Family', 1200000, 4, N'Phòng gia đình, 2 giường lớn, khu vui chơi trẻ em');
SET IDENTITY_INSERT ROOM_TYPE OFF;

-- =============================================
-- 2. ROOM
-- =============================================
SET IDENTITY_INSERT ROOM ON;
INSERT INTO ROOM
    (room_id, room_number, type_id, status, floor)
VALUES
    (1, N'101', 1, N'Clean', 1),
    (2, N'102', 1, N'Occupied', 1),
    (3, N'103', 2, N'Clean', 1),
    (4, N'104', 3, N'Clean', 1),
    (5, N'201', 2, N'Clean', 2),
    (6, N'202', 2, N'Dirty', 2),
    (7, N'203', 3, N'Clean', 2),
    (8, N'204', 5, N'Occupied', 2),
    (9, N'301', 4, N'Clean', 3),
    (10, N'302', 4, N'Maintenance', 3),
    (11, N'303', 5, N'Clean', 3),
    (12, N'304', 1, N'Clean', 3);
SET IDENTITY_INSERT ROOM OFF;

-- =============================================
-- 3. GUEST
-- =============================================
SET IDENTITY_INSERT GUEST ON;
INSERT INTO GUEST
    (guest_id, full_name, email, phone, id_card, nationality)
VALUES
    (1, N'Nguyễn Văn An', N'an.nguyen@email.com', N'0901234567', N'001099012345', N'Vietnam'),
    (2, N'Trần Thị Bình', N'binh.tran@email.com', N'0912345678', N'001099012346', N'Vietnam'),
    (3, N'Lê Hoàng Cường', N'cuong.le@email.com', N'0923456789', N'001099012347', N'Vietnam'),
    (4, N'Phạm Minh Đức', N'duc.pham@email.com', N'0934567890', N'001099012348', N'Vietnam'),
    (5, N'John Smith', N'john.smith@email.com', N'+1234567890', N'P12345678', N'USA'),
    (6, N'Tanaka Yuki', N'yuki.tanaka@email.com', N'+8190123456', N'J98765432', N'Japan'),
    (7, N'Võ Thị Hạnh', N'hanh.vo@email.com', N'0945678901', N'001099012349', N'Vietnam'),
    (8, N'Park Min Young', N'minyoung@email.com', N'+8210987654', N'K55667788', N'Korea');
SET IDENTITY_INSERT GUEST OFF;

-- =============================================
-- 4. EMPLOYEE
-- =============================================
SET IDENTITY_INSERT EMPLOYEE ON;
INSERT INTO EMPLOYEE
    (emp_id, full_name, role, username, password_hash)
VALUES
    (1, N'Hoàng Quản Lý', N'Manager', N'manager01', N'hash_password_01'),
    (2, N'Nguyễn Lễ Tân A', N'Receptionist', N'receptionist01', N'hash_password_02'),
    (3, N'Trần Lễ Tân B', N'Receptionist', N'receptionist02', N'hash_password_03'),
    (4, N'Lê Văn Phục Vụ', N'Housekeeper', N'housekeeper01', N'hash_password_04');
SET IDENTITY_INSERT EMPLOYEE OFF;

-- =============================================
-- 5. BOOKING
-- =============================================
SET IDENTITY_INSERT BOOKING ON;
INSERT INTO BOOKING
    (booking_id, guest_id, emp_id, booking_date, expected_checkin, expected_checkout, status, total_deposit)
VALUES
    (1, 1, 2, '2026-03-01 10:00:00', '2026-03-05 14:00:00', '2026-03-07 12:00:00', N'Confirmed', 500000),
    (2, 2, 2, '2026-03-02 09:30:00', '2026-03-04 14:00:00', '2026-03-06 12:00:00', N'Confirmed', 800000),
    (3, 5, 3, '2026-03-01 15:00:00', '2026-03-03 14:00:00', '2026-03-08 12:00:00', N'Confirmed', 2000000),
    (4, 3, 2, '2026-03-03 11:00:00', '2026-03-10 14:00:00', '2026-03-12 12:00:00', N'Pending', 0),
    (5, 6, 3, '2026-02-28 08:00:00', '2026-03-01 14:00:00', '2026-03-03 12:00:00', N'Completed', 1200000),
    (6, 4, 2, '2026-03-04 14:00:00', '2026-03-06 14:00:00', '2026-03-09 12:00:00', N'Pending', 0),
    (7, 7, 3, '2026-02-25 10:00:00', '2026-02-26 14:00:00', '2026-02-28 12:00:00', N'Cancelled', 0);
SET IDENTITY_INSERT BOOKING OFF;

-- =============================================
-- 6. BOOKING_DETAIL
-- =============================================
SET IDENTITY_INSERT BOOKING_DETAIL ON;
INSERT INTO BOOKING_DETAIL
    (detail_id, booking_id, room_id, actual_checkin, actual_checkout, price_at_booking)
VALUES
    (1, 1, 2, '2026-03-05 14:20:00', NULL, 500000),
    (2, 2, 3, '2026-03-04 14:10:00', NULL, 800000),
    (3, 3, 9, '2026-03-03 14:05:00', NULL, 2000000),
    (4, 3, 11, '2026-03-03 14:30:00', NULL, 1200000),
    (5, 4, 1, NULL, NULL, 500000),
    (6, 5, 8, '2026-03-01 14:15:00', '2026-03-03 11:45:00', 1200000),
    (7, 5, 7, '2026-03-01 14:20:00', '2026-03-03 11:50:00', 850000),
    (8, 6, 5, NULL, NULL, 800000),
    (9, 6, 4, NULL, NULL, 850000);
SET IDENTITY_INSERT BOOKING_DETAIL OFF;

-- =============================================
-- 7. SERVICE
-- =============================================
SET IDENTITY_INSERT SERVICE ON;
INSERT INTO SERVICE
    (service_id, service_name, unit_price, unit)
VALUES
    (1, N'Giặt ủi', 50000, N'Kg'),
    (2, N'Minibar - Nước ngọt', 30000, N'Lon'),
    (3, N'Minibar - Bia', 45000, N'Lon'),
    (4, N'Bữa sáng buffet', 150000, N'Người'),
    (5, N'Spa & Massage', 300000, N'Giờ'),
    (6, N'Xe đưa đón sân bay', 250000, N'Lượt'),
    (7, N'Phòng gym', 80000, N'Lần'),
    (8, N'Thuê xe máy', 150000, N'Ngày');
SET IDENTITY_INSERT SERVICE OFF;

-- =============================================
-- 8. SERVICE_USAGE
-- =============================================
SET IDENTITY_INSERT SERVICE_USAGE ON;
INSERT INTO SERVICE_USAGE
    (usage_id, booking_detail_id, service_id, quantity, used_at, total_price)
VALUES
    (1, 1, 4, 1, '2026-03-05 07:00:00', 150000),
    (2, 1, 2, 3, '2026-03-05 20:00:00', 90000),
    (3, 3, 5, 2, '2026-03-04 10:00:00', 600000),
    (4, 3, 6, 1, '2026-03-03 08:00:00', 250000),
    (5, 3, 4, 2, '2026-03-04 07:00:00', 300000),
    (6, 6, 4, 2, '2026-03-02 07:00:00', 300000),
    (7, 6, 1, 3, '2026-03-02 09:00:00', 150000),
    (8, 6, 8, 1, '2026-03-02 08:00:00', 150000),
    (9, 7, 3, 4, '2026-03-01 21:00:00', 180000),
    (10, 7, 7, 2, '2026-03-02 06:00:00', 160000);
SET IDENTITY_INSERT SERVICE_USAGE OFF;

-- =============================================
-- 9. INVOICE
-- =============================================
SET IDENTITY_INSERT INVOICE ON;
INSERT INTO INVOICE
    (invoice_id, booking_id, room_charge, service_charge, tax_amount, discount_amount, final_amount, payment_date, payment_method)
VALUES
    (1, 5, 2050000, 940000, 299000, 100000, 3189000, '2026-03-03 12:00:00', N'Card');
SET IDENTITY_INSERT INVOICE OFF;
