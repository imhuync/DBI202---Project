-- =============================================
-- HOTEL MANAGEMENT SYSTEM - PROCEDURES & VIEWS
-- BASIC SQL (SQL SERVER COMPATIBLE)
-- =============================================

-- 1. Create Booking
CREATE OR ALTER PROCEDURE sp_CreateBooking
    @guest_id       INT,
    @emp_id         INT,
    @checkin        DATETIME,
    @checkout       DATETIME,
    @deposit        DECIMAL(12,2)
AS
BEGIN
    INSERT INTO BOOKING (guest_id, emp_id, booking_date, expected_checkin, expected_checkout, status, total_deposit)
    VALUES (@guest_id, @emp_id, GETDATE(), @checkin, @checkout, N'Pending', @deposit);
END;
GO

-- 2. Check-In
CREATE OR ALTER PROCEDURE sp_CheckIn
    @detail_id  INT
AS
BEGIN
    UPDATE BOOKING_DETAIL SET actual_checkin = GETDATE() WHERE detail_id = @detail_id;
    
    UPDATE ROOM SET status = N'Occupied' 
    WHERE room_id = (SELECT room_id FROM BOOKING_DETAIL WHERE detail_id = @detail_id);

    UPDATE BOOKING SET status = N'Confirmed'
    WHERE booking_id = (SELECT booking_id FROM BOOKING_DETAIL WHERE detail_id = @detail_id)
      AND status = N'Pending';
END;
GO

-- 3. Check-Out
CREATE OR ALTER PROCEDURE sp_CheckOut
    @detail_id  INT
AS
BEGIN
    UPDATE BOOKING_DETAIL SET actual_checkout = GETDATE() WHERE detail_id = @detail_id;
    
    UPDATE ROOM SET status = N'Dirty' 
    WHERE room_id = (SELECT room_id FROM BOOKING_DETAIL WHERE detail_id = @detail_id);
END;
GO

-- 4. Add Service Usage
CREATE OR ALTER PROCEDURE sp_AddServiceUsage
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

-- 5. Generate Invoice
CREATE OR ALTER PROCEDURE sp_GenerateInvoice
    @booking_id     INT,
    @discount       DECIMAL(12,2),
    @method         NVARCHAR(30)
AS
BEGIN
    DELETE FROM INVOICE WHERE booking_id = @booking_id;

    INSERT INTO INVOICE (booking_id, room_charge, service_charge, tax_amount, discount_amount, final_amount, payment_date, payment_method)
    SELECT 
        @booking_id,
        (SELECT COALESCE(SUM(price_at_booking), 0) FROM BOOKING_DETAIL WHERE booking_id = @booking_id),
        (SELECT COALESCE(SUM(total_price), 0) FROM SERVICE_USAGE su JOIN BOOKING_DETAIL bd ON su.booking_detail_id = bd.detail_id WHERE bd.booking_id = @booking_id),
        0, -- Tax will be calculated below
        @discount,
        0, -- Final will be calculated below
        GETDATE(),
        @method;

    -- Update with calculations (Simplified logic)
    UPDATE INVOICE 
    SET tax_amount = (room_charge + service_charge) * 0.1,
        final_amount = (room_charge + service_charge) * 1.1 - discount_amount
    WHERE booking_id = @booking_id;

    UPDATE BOOKING SET status = N'Completed' WHERE booking_id = @booking_id;
END;
GO

-- Views for Reporting --

CREATE OR ALTER VIEW vw_RoomStatus AS
SELECT r.room_number, rt.type_name, r.status, r.floor, rt.base_price
FROM ROOM r JOIN ROOM_TYPE rt ON r.type_id = rt.type_id;
GO

CREATE OR ALTER VIEW vw_ActiveBookings AS
SELECT b.booking_id, g.full_name, b.expected_checkin, b.expected_checkout, b.status
FROM BOOKING b JOIN GUEST g ON b.guest_id = g.guest_id
WHERE b.status IN (N'Pending', N'Confirmed');
GO
