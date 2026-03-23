-- =============================================
-- TEST SCRIPT CHO CÁC STORED PROCEDURES
-- Data mẫu và các trường hợp cơ bản
-- =============================================
USE HotelDB;
GO

-- 1. GUEST (Khách hàng)
-- Lấy tất cả khách hàng
EXEC sp_GetAllGuests;

-- Tạo khách hàng mới
EXEC sp_CreateGuest 
    @full_name = N'Nguyễn Văn A', 
    @email = N'email@example.com', 
    @phone = N'0901234567', 
    @id_card = N'001099012345', 
    @nationality = N'Vietnam';

-- Tạo một khách hàng khác để test xóa / sửa
EXEC sp_CreateGuest 
    @full_name = N'Trần Thị B', 
    @email = N'tranthib@example.com', 
    @phone = N'0909888777', 
    @id_card = N'079099000111', 
    @nationality = N'Vietnam';

-- Cập nhật khách hàng (Giả sử ID là 13 - có thể tự thay đổi tùy theo DB của bạn)
EXEC sp_UpdateGuest 
    @guest_id = 13, 
    @full_name = N'Trần Thị Bê', 
    @email = N'b.tran@example.com', 
    @phone = N'0909888777', 
    @id_card = N'079099000111', 
    @nationality = N'Vietnam';

-- Xóa khách hàng (Ví dụ Xóa Guest ID 14)
-- EXEC sp_DeleteGuest @guest_id = 14;

-------------------------------------------------
-- 2. ROOM_TYPE (Loại phòng)
-- Lấy tất cả loại phòng
EXEC sp_GetAllRoomTypes;

-- Tạo loại phòng mới
EXEC sp_CreateRoomType 
    @type_name = N'Presidential Suite', 
    @base_price = 10000000.00, 
    @max_capacity = 6, 
    @description = N'Phòng Tổng thống cao cấp nhất với nội thất dát vàng.';

-------------------------------------------------
-- 3. ROOM (Phòng)
-- Lấy danh sách tất cả các phòng
EXEC sp_GetAllRooms;

-- Thêm phòng mới (Ví dụ thêm phòng cho loại phòng ID = 4 vừa tạo)
EXEC sp_CreateRoom 
    @room_number = N'999', 
    @floor = 9, 
    @type_id = 4, 
    @status = N'Clean';

-- Cập nhật thông tin phòng (Giả sử phòng ID = 21)
EXEC sp_UpdateRoom 
    @room_id = 21, 
    @room_number = N'999 VIP', 
    @floor = 9, 
    @type_id = 4;

-- Đổi trạng thái phòng
EXEC sp_UpdateRoomStatus 
    @room_id = 21, 
    @status = N'Maintenance';

-- Xóa phòng
-- EXEC sp_DeleteRoom @room_id = 21;

-------------------------------------------------
-- 4. EMPLOYEE (Nhân viên)
-- Lấy tất cả nhân viên
EXEC sp_GetAllEmployees;

-- Tạo nhân viên mới
EXEC sp_CreateEmployee 
    @full_name = N'Lê Văn Thủ Quỹ', 
    @role = N'Receptionist', 
    @username = N'thuquy.le', 
    @password_hash = N'123456';

-- Cập nhật thông tin nhân viên (Giả sử emp_id = 6)
EXEC sp_UpdateEmployee 
    @emp_id = 6, 
    @full_name = N'Lê Văn Lễ Tân', 
    @role = N'Receptionist', 
    @username = N'letan.le';

-- Reset mật khẩu
EXEC sp_ResetPassword 
    @emp_id = 6, 
    @password_hash = N'newpassword123';

-- Test Login (Sẽ trả về 1 dòng record nếu thành công)
EXEC sp_Login 
    @username = N'letan.le', 
    @password = N'newpassword123';

-- Đổi mật khẩu
EXEC sp_ChangePassword 
    @emp_id = 6, 
    @current_password = N'newpassword123', 
    @new_password = N'securepass456';

-------------------------------------------------
-- 5. SERVICE (Dịch vụ)
EXEC sp_GetAllServices;

-- Thêm dịch vụ
EXEC sp_CreateService 
    @service_name = N'Spa Cao CấpVIP', 
    @unit_price = 1500000.00, 
    @unit = N'Lượt';

-- Cập nhật dịch vụ
EXEC sp_UpdateService 
    @service_id = 11, 
    @service_name = N'Spa Cao Cấp', 
    @unit_price = 1200000.00, 
    @unit = N'Lượt';

-------------------------------------------------
-- 6. BOOKING & CHI TIẾT ĐẶT PHòng
EXEC sp_GetAllBookings;
EXEC sp_GetAllBookingDetails;

-- Đặt phòng mới (Đặt bởi Guest 1, Emp 2)
-- Sẽ trả về booking_id vừa được INSERT
EXEC sp_CreateBooking 
    @guest_id = 1, 
    @emp_id = 2, 
    @checkin = '2026-04-01 14:00:00', 
    @checkout = '2026-04-05 12:00:00', 
    @deposit = 500000;

-- Gắn phòng vào Booking (Giả sử booking vưa tạo là ID 9, Phòng trống gán là 15)
-- Lưu ý: ID phòng phải có trạng thái: "Clean"
EXEC sp_AddBookingDetail 
    @booking_id = 9, 
    @room_id = 15;

-- Xác nhận Booking
EXEC sp_ConfirmBooking @booking_id = 9;

-- Check-in (Giả sử Detail ID vừa tạo là 9)
-- EXEC sp_CheckIn @detail_id = 9;

-- Check-out 
-- EXEC sp_CheckOut @detail_id = 9;

-- Hủy Booking
-- EXEC sp_CancelBooking @booking_id = 9;

-------------------------------------------------
-- 7. SERVICE USAGE (Sử dụng dịch vụ)
EXEC sp_GetAllServiceUsages;

-- Gọi 2 suất Spa Cao Cấp (Service 11) cho BookingDetail số 9
-- EXEC sp_AddServiceUsage 
--     @detail_id = 9, 
--     @service_id = 11, 
--     @quantity = 2;

-------------------------------------------------
-- 8. INVOICE (Hóa đơn)
EXEC sp_GetAllInvoices;

-- Sinh hóa đơn cuối cùng cho Booking 9, Giảm giá 0đ, Thanh toán Thẻ
-- EXEC sp_GenerateInvoice 
--     @booking_id = 9, 
--     @discount = 0.00, 
--     @method = N'Card';
