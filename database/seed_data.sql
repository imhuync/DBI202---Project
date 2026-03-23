-- =============================================
-- HOTEL MANAGEMENT SYSTEM - REALISTIC SAMPLE DATA
-- SQL SERVER COMPATIBLE - V1.1 (ENRICHED)
-- =============================================

USE HotelDB;
GO

-- 1. ROOM_TYPE (Standard to Luxury)
SET IDENTITY_INSERT ROOM_TYPE ON;
INSERT INTO ROOM_TYPE (type_id, type_name, base_price, max_capacity, description)
VALUES 
    (1, N'Standard Single', 450000, 1, N'Phòng tiêu chuẩn 1 giường đơn, WiFi tốc độ cao, TV LED, Minibar, Phù hợp khách công tác.'),
    (2, N'Deluxe Double', 850000, 2, N'Phòng cao cấp 1 giường đôi lớn, Ban công hướng phố, WiFi, TV cáp, Bồn tắm nằm.'),
    (3, N'Executive Twin', 1200000, 2, N'Phòng thương gia với 2 giường đơn, Không gian làm việc riêng, View biển tầng cao.'),
    (4, N'VIP Penthouse', 5500000, 4, N'Căn hộ tầng mái siêu sang, 2 phòng ngủ, Bếp riêng, Jacuzzi, Đặc quyền bữa sáng tại phòng.'),
    (5, N'Grand Family', 1800000, 4, N'Phòng gia đình rộng rãi, 2 giường lớn, Khu vực sofa, WiFi, Phù hợp du lịch gia đình.');
SET IDENTITY_INSERT ROOM_TYPE OFF;

-- 2. ROOM (20 Rooms across 5 Floors)
SET IDENTITY_INSERT ROOM ON;
INSERT INTO ROOM (room_id, room_number, type_id, status, floor)
VALUES 
    (1, N'101', 1, N'Clean', 1), (2, N'102', 1, N'Clean', 1), (3, N'103', 1, N'Occupied', 1), (4, N'104', 2, N'Clean', 1),
    (5, N'201', 2, N'Occupied', 2), (6, N'202', 2, N'Dirty', 2), (7, N'203', 3, N'Clean', 2), (8, N'204', 3, N'Occupied', 2),
    (9, N'301', 2, N'Maintenance', 3), (10, N'302', 3, N'Clean', 3), (11, N'303', 5, N'Occupied', 3), (12, N'304', 5, N'Clean', 3),
    (13, N'401', 3, N'Clean', 4), (14, N'402', 3, N'Clean', 4), (15, N'403', 3, N'Clean', 4), (16, N'404', 5, N'Clean', 4),
    (17, N'501', 4, N'Occupied', 5), (18, N'502', 4, N'Clean', 5), (19, N'105', 1, N'Clean', 1), (20, N'205', 2, N'Clean', 2);
SET IDENTITY_INSERT ROOM OFF;

-- 3. GUEST (Realistic Vietnamese and International Guests)
SET IDENTITY_INSERT GUEST ON;
INSERT INTO GUEST (guest_id, full_name, email, phone, id_card, nationality)
VALUES 
    (1, N'Nguyễn Minh Hoàng', N'hoang.nm@gmail.com', N'0909123456', N'079095001234', N'Vietnam'),
    (2, N'Lê Thị Phương Thảo', N'phuongthao.le@outlook.com', N'0918234567', N'079196005678', N'Vietnam'),
    (3, N'Trần Đại Nghĩa', N'nghia.td@viettel.vn', N'0985345678', N'079201009012', N'Vietnam'),
    (4, N'Phạm Bảo Nam', N'nam.pham@fpt.com', N'0334455667', N'079301012345', N'Vietnam'),
    (5, N'Jennifer Lopez', N'jennifer.l@yahoo.com', N'+14159876543', N'A87654321', N'USA'),
    (6, N'Kenji Yamamoto', N'yamamoto.k@sony.jp', N'+819011223344', N'J11223344', N'Japan'),
    (7, N'David Beckham', N'david.b@gmail.com', N'+447788990011', N'P00112233', N'UK'),
    (8, N'Vũ Hoàng Anh Kiệt', N'kietpba@gmail.com', N'0987654321', N'030102040302', N'Vietnam'),
    (9, N'Trương Mỹ Lan', N'lan.truong@vtp.vn', N'0944556677', N'079123456789', N'Vietnam'),
    (10, N'Phan Đình Phùng', N'phung.pd@history.vn', N'0123456789', N'001095012341', N'Vietnam'),
    (11, N'Maria Sharapova', N'maria.s@tennis.ru', N'+79001234567', N'R12345678', N'Russia'),
    (12, N'Lý Quí Khánh', N'khanh.lq@fashion.vn', N'0901112233', N'079188002233', N'Vietnam');
SET IDENTITY_INSERT GUEST OFF;

-- 4. EMPLOYEE (Realistic Roles)
SET IDENTITY_INSERT EMPLOYEE ON;
INSERT INTO EMPLOYEE (emp_id, full_name, role, username, password_hash)
VALUES 
    (1, N'Trần Văn Quản Trị', N'Admin', N'admin', N'admin123'),
    (2, N'Lê Thị Tuyết Mai', N'Manager', N'mai.manager', N'pass123'),
    (3, N'Nguyễn Minh Tú', N'Receptionist', N'tu.reception', N'pass123'),
    (4, N'Phạm Hồng Ngọc', N'Receptionist', N'ngoc.reception', N'pass123'),
    (5, N'Lý Tiểu Long', N'Housekeeper', N'long.hk', N'pass123');
SET IDENTITY_INSERT EMPLOYEE OFF;

-- 5. SERVICE (Expanded List)
SET IDENTITY_INSERT SERVICE ON;
INSERT INTO SERVICE (service_id, service_name, unit_price, unit)
VALUES 
    (1, N'Giặt ủi - Tiêu chuẩn', 45000, N'Kg'),
    (2, N'Giặt hấp - Cao cấp', 120000, N'Cái'),
    (3, N'Minibar - Heineken', 45000, N'Lon'),
    (4, N'Minibar - Coca Cola', 25000, N'Lon'),
    (5, N'Minibar - Snack Pringles', 65000, N'Hộp'),
    (6, N'Bữa sáng Buffet', 250000, N'Suất'),
    (7, N'Spa - Massage Toàn thân', 450000, N'Giờ'),
    (8, N'Xe đưa đón Sân bay', 350000, N'Lượt'),
    (9, N'Thuê xe máy tự lái', 180000, N'Ngày'),
    (10, N'City Tour nửa ngày', 600000, N'Khách');
SET IDENTITY_INSERT SERVICE OFF;

-- 6. BOOKING (Mixed Statuses)
SET IDENTITY_INSERT BOOKING ON;
INSERT INTO BOOKING (booking_id, guest_id, emp_id, booking_date, expected_checkin, expected_checkout, status, total_deposit)
VALUES 
    (1, 1, 3, '2026-03-10', '2026-03-15', '2026-03-17', N'Completed', 500000),
    (2, 2, 3, '2026-03-12', '2026-03-18', '2026-03-20', N'Completed', 1000000),
    (3, 3, 4, '2026-03-20', '2026-03-22', '2026-03-25', N'Confirmed', 0),
    (4, 5, 4, '2026-03-21', '2026-03-23', '2026-03-28', N'Confirmed', 2000000),
    (5, 6, 3, '2026-03-15', '2026-03-16', '2026-03-18', N'Completed', 0),
    (6, 8, 4, '2026-03-22', '2026-03-23', '2026-03-24', N'Pending', 0),
    (7, 11, 3, '2026-03-18', '2026-03-19', '2026-03-21', N'Completed', 500000),
    (8, 12, 4, '2026-03-22', '2026-03-25', '2026-03-27', N'Confirmed', 0);
SET IDENTITY_INSERT BOOKING OFF;

-- 7. BOOKING_DETAIL
SET IDENTITY_INSERT BOOKING_DETAIL ON;
INSERT INTO BOOKING_DETAIL (detail_id, booking_id, room_id, actual_checkin, actual_checkout, price_at_booking)
VALUES 
    (1, 1, 3, '2026-03-15 14:05', '2026-03-17 11:30', 450000),
    (2, 2, 5, '2026-03-18 13:50', '2026-03-20 12:00', 850000),
    (3, 3, 8, '2026-03-22 14:20', NULL, 1200000),
    (4, 4, 17, '2026-03-23 14:00', NULL, 5500000),
    (5, 5, 11, '2026-03-16 14:10', '2026-03-18 11:50', 1800000),
    (6, 6, 4, NULL, NULL, 850000),
    (7, 7, 6, '2026-03-19 14:30', '2026-03-21 11:45', 850000),
    (8, 8, 10, NULL, NULL, 1200000);
SET IDENTITY_INSERT BOOKING_DETAIL OFF;

-- 8. SERVICE_USAGE
SET IDENTITY_INSERT SERVICE_USAGE ON;
INSERT INTO SERVICE_USAGE (usage_id, booking_detail_id, service_id, quantity, used_at, total_price)
VALUES 
    (1, 1, 6, 1, '2026-03-16 07:30', 250000),
    (2, 1, 4, 2, '2026-03-16 20:00', 50000),
    (3, 2, 8, 1, '2026-03-20 12:15', 350000),
    (4, 4, 7, 2, '2026-03-23 16:00', 900000),
    (5, 4, 1, 3, '2026-03-23 09:00', 135000),
    (6, 7, 3, 4, '2026-03-20 21:00', 180000);
SET IDENTITY_INSERT SERVICE_USAGE OFF;

-- 9. INVOICE (Matching Completed Bookings)
SET IDENTITY_INSERT INVOICE ON;
INSERT INTO INVOICE (invoice_id, booking_id, room_charge, service_charge, tax_amount, discount_amount, final_amount, payment_date, payment_method)
VALUES 
    (1, 1, 900000, 300000, 120000, 50000, 1270000, '2026-03-17 11:30', N'Cash'),
    (2, 2, 1700000, 350000, 205000, 0, 2255000, '2026-03-20 12:00', N'Card'),
    (3, 5, 3600000, 0, 360000, 100000, 3860000, '2026-03-18 11:50', N'Transfer'),
    (4, 7, 1700000, 180000, 188000, 0, 2068000, '2026-03-21 11:45', N'E-Wallet');
SET IDENTITY_INSERT INVOICE OFF;
