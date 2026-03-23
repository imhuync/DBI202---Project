-- =============================================
-- HOTEL MANAGEMENT SYSTEM - PROCEDURES & VIEWS
-- BASIC SQL (SQL SERVER COMPATIBLE)
-- =============================================

USE HotelDB;
GO

-- =============================================
-- DROP all procedures first (clean slate)
-- =============================================
DROP PROCEDURE IF EXISTS sp_GetAllRoomTypes;
DROP PROCEDURE IF EXISTS sp_CreateRoomType;
DROP PROCEDURE IF EXISTS sp_GetAllRooms;
DROP PROCEDURE IF EXISTS sp_CreateRoom;
DROP PROCEDURE IF EXISTS sp_UpdateRoom;
DROP PROCEDURE IF EXISTS sp_UpdateRoomStatus;
DROP PROCEDURE IF EXISTS sp_DeleteRoom;
DROP PROCEDURE IF EXISTS sp_GetAllGuests;
DROP PROCEDURE IF EXISTS sp_CreateGuest;
DROP PROCEDURE IF EXISTS sp_UpdateGuest;
DROP PROCEDURE IF EXISTS sp_DeleteGuest;
DROP PROCEDURE IF EXISTS sp_GetAllEmployees;
DROP PROCEDURE IF EXISTS sp_CreateEmployee;
DROP PROCEDURE IF EXISTS sp_UpdateEmployee;
DROP PROCEDURE IF EXISTS sp_DeleteEmployee;
DROP PROCEDURE IF EXISTS sp_ResetPassword;
DROP PROCEDURE IF EXISTS sp_Login;
DROP PROCEDURE IF EXISTS sp_ChangePassword;
DROP PROCEDURE IF EXISTS sp_GetAllServices;
DROP PROCEDURE IF EXISTS sp_CreateService;
DROP PROCEDURE IF EXISTS sp_UpdateService;
DROP PROCEDURE IF EXISTS sp_DeleteService;
DROP PROCEDURE IF EXISTS sp_GetAllBookings;
DROP PROCEDURE IF EXISTS sp_GetAllBookingDetails;
DROP PROCEDURE IF EXISTS sp_CreateBooking;
DROP PROCEDURE IF EXISTS sp_AddBookingDetail;
DROP PROCEDURE IF EXISTS sp_CancelBooking;
DROP PROCEDURE IF EXISTS sp_ConfirmBooking;
DROP PROCEDURE IF EXISTS sp_CheckIn;
DROP PROCEDURE IF EXISTS sp_CheckOut;
DROP PROCEDURE IF EXISTS sp_GetAllServiceUsages;
DROP PROCEDURE IF EXISTS sp_AddServiceUsage;
DROP PROCEDURE IF EXISTS sp_GetAllInvoices;
DROP PROCEDURE IF EXISTS sp_GenerateInvoice;
DROP VIEW IF EXISTS vw_RoomStatus;
DROP VIEW IF EXISTS vw_ActiveBookings;
GO

-- =============================================
-- 1. ROOM_TYPE Operations
-- =============================================
CREATE PROCEDURE sp_GetAllRoomTypes
AS
BEGIN
    SELECT * FROM ROOM_TYPE;
END;
GO

CREATE PROCEDURE sp_CreateRoomType
    @type_name      NVARCHAR(50),
    @base_price     DECIMAL(12,2),
    @max_capacity   INT,
    @description    NVARCHAR(500)
AS
BEGIN
    INSERT INTO ROOM_TYPE (type_name, base_price, max_capacity, description)
    VALUES (@type_name, @base_price, @max_capacity, @description);
END;
GO

-- =============================================
-- 2. ROOM Operations
-- =============================================
CREATE PROCEDURE sp_GetAllRooms
AS
BEGIN
    SELECT r.*, rt.type_name, rt.base_price
    FROM ROOM r
    JOIN ROOM_TYPE rt ON r.type_id = rt.type_id;
END;
GO

CREATE PROCEDURE sp_CreateRoom
    @room_number    NVARCHAR(10),
    @floor          INT,
    @type_id        INT,
    @status         NVARCHAR(20)
AS
BEGIN
    INSERT INTO ROOM (room_number, floor, type_id, status)
    VALUES (@room_number, @floor, @type_id, ISNULL(@status, 'Clean'));
END;
GO

CREATE PROCEDURE sp_UpdateRoom
    @room_id        INT,
    @room_number    NVARCHAR(10),
    @floor          INT,
    @type_id        INT
AS
BEGIN
    UPDATE ROOM
    SET room_number = @room_number, floor = @floor, type_id = @type_id
    WHERE room_id = @room_id;
END;
GO

CREATE PROCEDURE sp_UpdateRoomStatus
    @room_id        INT,
    @status         NVARCHAR(20)
AS
BEGIN
    UPDATE ROOM SET status = @status WHERE room_id = @room_id;
END;
GO

CREATE PROCEDURE sp_DeleteRoom
    @room_id        INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM BOOKING_DETAIL WHERE room_id = @room_id)
        THROW 50001, N'Phòng này đã từng có khách đặt hoặc đang ở, không thể xóa để đảm bảo toàn vẹn dữ liệu.', 1;
    DELETE FROM ROOM WHERE room_id = @room_id;
END;
GO

-- =============================================
-- 3. GUEST Operations
-- =============================================
CREATE PROCEDURE sp_GetAllGuests
AS
BEGIN
    SELECT * FROM GUEST;
END;
GO

CREATE PROCEDURE sp_CreateGuest
    @full_name      NVARCHAR(100),
    @email          NVARCHAR(100),
    @phone          NVARCHAR(20),
    @id_card        NVARCHAR(20),
    @nationality    NVARCHAR(50)
AS
BEGIN
    INSERT INTO GUEST (full_name, email, phone, id_card, nationality)
    VALUES (@full_name, @email, @phone, @id_card, ISNULL(@nationality, N'Vietnam'));
END;
GO

CREATE PROCEDURE sp_UpdateGuest
    @guest_id       INT,
    @full_name      NVARCHAR(100),
    @email          NVARCHAR(100),
    @phone          NVARCHAR(20),
    @id_card        NVARCHAR(20),
    @nationality    NVARCHAR(50)
AS
BEGIN
    UPDATE GUEST
    SET full_name = @full_name, email = @email, phone = @phone,
        id_card = @id_card, nationality = @nationality
    WHERE guest_id = @guest_id;
END;
GO

CREATE PROCEDURE sp_DeleteGuest
    @guest_id       INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM BOOKING WHERE guest_id = @guest_id)
        THROW 50002, N'Khách hàng này đang có booking, không thể xóa.', 1;
    DELETE FROM GUEST WHERE guest_id = @guest_id;
END;
GO

-- =============================================
-- 4. EMPLOYEE Operations
-- =============================================
CREATE PROCEDURE sp_GetAllEmployees
AS
BEGIN
    SELECT emp_id, full_name, role, username FROM EMPLOYEE;
END;
GO

CREATE PROCEDURE sp_CreateEmployee
    @full_name      NVARCHAR(100),
    @role           NVARCHAR(30),
    @username       NVARCHAR(50),
    @password_hash  NVARCHAR(256)
AS
BEGIN
    INSERT INTO EMPLOYEE (full_name, role, username, password_hash)
    VALUES (@full_name, @role, @username, @password_hash);
END;
GO

CREATE PROCEDURE sp_UpdateEmployee
    @emp_id         INT,
    @full_name      NVARCHAR(100),
    @role           NVARCHAR(50),
    @username       NVARCHAR(50)
AS
BEGIN
    UPDATE EMPLOYEE
    SET full_name = @full_name, role = @role, username = @username
    WHERE emp_id = @emp_id;
END;
GO

CREATE PROCEDURE sp_DeleteEmployee
    @emp_id         INT
AS
BEGIN
    DELETE FROM EMPLOYEE WHERE emp_id = @emp_id;
END;
GO

CREATE PROCEDURE sp_ResetPassword
    @emp_id         INT,
    @password_hash  NVARCHAR(256)
AS
BEGIN
    UPDATE EMPLOYEE SET password_hash = @password_hash WHERE emp_id = @emp_id;
END;
GO

CREATE PROCEDURE sp_Login
    @username       NVARCHAR(50),
    @password       NVARCHAR(256)
AS
BEGIN
    SELECT * FROM EMPLOYEE
    WHERE username = @username AND password_hash = @password;
END;
GO

CREATE PROCEDURE sp_ChangePassword
    @emp_id             INT,
    @current_password   NVARCHAR(256),
    @new_password       NVARCHAR(256)
AS
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM EMPLOYEE
        WHERE emp_id = @emp_id AND password_hash = @current_password
    )
        THROW 50003, N'Current password incorrect', 1;
    UPDATE EMPLOYEE SET password_hash = @new_password WHERE emp_id = @emp_id;
END;
GO

-- =============================================
-- 5. SERVICE Operations
-- =============================================
CREATE PROCEDURE sp_GetAllServices
AS
BEGIN
    SELECT * FROM SERVICE;
END;
GO

CREATE PROCEDURE sp_CreateService
    @service_name   NVARCHAR(100),
    @unit_price     DECIMAL(12,2),
    @unit           NVARCHAR(20)
AS
BEGIN
    INSERT INTO SERVICE (service_name, unit_price, unit)
    VALUES (@service_name, @unit_price, @unit);
END;
GO

CREATE PROCEDURE sp_UpdateService
    @service_id     INT,
    @service_name   NVARCHAR(100),
    @unit_price     DECIMAL(12,2),
    @unit           NVARCHAR(20)
AS
BEGIN
    UPDATE SERVICE
    SET service_name = @service_name, unit_price = @unit_price, unit = @unit
    WHERE service_id = @service_id;
END;
GO

CREATE PROCEDURE sp_DeleteService
    @service_id     INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM SERVICE_USAGE WHERE service_id = @service_id)
        THROW 50004, N'Dịch vụ này đang được sử dụng trong lịch sử, không thể xóa.', 1;
    DELETE FROM SERVICE WHERE service_id = @service_id;
END;
GO

-- =============================================
-- 6. BOOKING & Business Logic Operations
-- =============================================
CREATE PROCEDURE sp_GetAllBookings
AS
BEGIN
    SELECT * FROM BOOKING;
END;
GO

CREATE PROCEDURE sp_GetAllBookingDetails
AS
BEGIN
    SELECT * FROM BOOKING_DETAIL;
END;
GO

CREATE PROCEDURE sp_CreateBooking
    @guest_id       INT,
    @emp_id         INT,
    @checkin        DATETIME,
    @checkout       DATETIME,
    @deposit        DECIMAL(12,2)
AS
BEGIN
    INSERT INTO BOOKING (guest_id, emp_id, booking_date, expected_checkin, expected_checkout, status, total_deposit)
    OUTPUT INSERTED.booking_id
    VALUES (@guest_id, @emp_id, GETDATE(), @checkin, @checkout, N'Pending', @deposit);
END;
GO

CREATE PROCEDURE sp_AddBookingDetail
    @booking_id     INT,
    @room_id        INT
AS
BEGIN
    INSERT INTO BOOKING_DETAIL (booking_id, room_id, price_at_booking)
    SELECT @booking_id, r.room_id, rt.base_price
    FROM ROOM r
    JOIN ROOM_TYPE rt ON r.type_id = rt.type_id
    WHERE r.room_id = @room_id
      AND r.status = N'Clean';

    IF @@ROWCOUNT = 0
        THROW 50005, N'Phòng không tồn tại hoặc hiện không sẵn sàng để đặt.', 1;
END;
GO

CREATE PROCEDURE sp_CancelBooking
    @booking_id     INT
AS
BEGIN
    UPDATE BOOKING SET status = N'Cancelled'
    WHERE booking_id = @booking_id AND status IN (N'Pending', N'Confirmed');
END;
GO

CREATE PROCEDURE sp_ConfirmBooking
    @booking_id     INT
AS
BEGIN
    UPDATE BOOKING SET status = N'Confirmed'
    WHERE booking_id = @booking_id AND status = N'Pending';
END;
GO

CREATE PROCEDURE sp_CheckIn
    @detail_id  INT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE BOOKING_DETAIL SET actual_checkin = GETDATE() WHERE detail_id = @detail_id;

        DECLARE @room_id INT, @booking_id INT;
        SELECT @room_id = room_id, @booking_id = booking_id
        FROM BOOKING_DETAIL WHERE detail_id = @detail_id;

        UPDATE ROOM SET status = N'Occupied' WHERE room_id = @room_id;

        UPDATE BOOKING SET status = N'Confirmed'
        WHERE booking_id = @booking_id AND status = N'Pending';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE PROCEDURE sp_CheckOut
    @detail_id  INT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE BOOKING_DETAIL SET actual_checkout = GETDATE() WHERE detail_id = @detail_id;

        DECLARE @room_id INT;
        SELECT @room_id = room_id FROM BOOKING_DETAIL WHERE detail_id = @detail_id;

        UPDATE ROOM SET status = N'Dirty' WHERE room_id = @room_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- =============================================
-- 7. SERVICE USAGE Operations
-- =============================================
CREATE PROCEDURE sp_GetAllServiceUsages
AS
BEGIN
    SELECT * FROM SERVICE_USAGE;
END;
GO

CREATE PROCEDURE sp_AddServiceUsage
    @detail_id      INT,
    @service_id     INT,
    @quantity       INT
AS
BEGIN
    INSERT INTO SERVICE_USAGE (booking_detail_id, service_id, quantity, used_at, total_price)
    SELECT @detail_id, @service_id, @quantity, GETDATE(), @quantity * unit_price
    FROM SERVICE WHERE service_id = @service_id;
END;
GO

-- =============================================
-- 8. INVOICE Operations
-- =============================================
CREATE PROCEDURE sp_GetAllInvoices
AS
BEGIN
    SELECT * FROM INVOICE;
END;
GO

CREATE PROCEDURE sp_GenerateInvoice
    @booking_id     INT,
    @discount       DECIMAL(12,2),
    @method         NVARCHAR(30)
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        DELETE FROM INVOICE WHERE booking_id = @booking_id;

        DECLARE @room_charge    DECIMAL(12,2),
                @service_charge DECIMAL(12,2),
                @tax            DECIMAL(12,2),
                @final          DECIMAL(12,2);

        SELECT @room_charge = COALESCE(SUM(price_at_booking), 0)
        FROM BOOKING_DETAIL WHERE booking_id = @booking_id;

        SELECT @service_charge = COALESCE(SUM(su.total_price), 0)
        FROM SERVICE_USAGE su
        JOIN BOOKING_DETAIL bd ON su.booking_detail_id = bd.detail_id
        WHERE bd.booking_id = @booking_id;

        SET @tax   = (@room_charge + @service_charge) * 0.1;
        SET @final = (@room_charge + @service_charge) + @tax - ISNULL(@discount, 0);

        INSERT INTO INVOICE (booking_id, room_charge, service_charge, tax_amount, discount_amount, final_amount, payment_date, payment_method)
        VALUES (@booking_id, @room_charge, @service_charge, @tax, ISNULL(@discount, 0), @final, GETDATE(), @method);

        UPDATE BOOKING SET status = N'Completed' WHERE booking_id = @booking_id;

        SELECT @final AS finalAmount;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- =============================================
-- Views for Reporting
-- =============================================
CREATE VIEW vw_RoomStatus
AS
    SELECT r.room_number, rt.type_name, r.status, r.floor, rt.base_price
    FROM ROOM r
    JOIN ROOM_TYPE rt ON r.type_id = rt.type_id;
GO

CREATE VIEW vw_ActiveBookings
AS
    SELECT b.booking_id, g.full_name, b.expected_checkin, b.expected_checkout, b.status
    FROM BOOKING b
    JOIN GUEST g ON b.guest_id = g.guest_id
    WHERE b.status IN (N'Pending', N'Confirmed');
GO
