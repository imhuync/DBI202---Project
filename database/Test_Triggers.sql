USE HotelDB;
GO

-- TEST 1: trg_UpdateRoomStatus_CheckIn
PRINT '--- Testing trg_UpdateRoomStatus_CheckIn ---';

-- Ensure room 101 is 'Clean' initially (or whatever it is)
UPDATE ROOM SET status = 'Clean' WHERE room_number = '101';
SELECT room_number, status AS InitialStatus FROM ROOM WHERE room_number = '101';

-- Update actual_checkin for a booking detail involving room 101
-- Find a sample detail_id for room 101
DECLARE @detail_id INT;
SELECT TOP 1 @detail_id = detail_id FROM BOOKING_DETAIL bd 
JOIN ROOM r ON bd.room_id = r.room_id 
WHERE r.room_number = '101';

IF @detail_id IS NOT NULL
BEGIN
    UPDATE BOOKING_DETAIL SET actual_checkin = GETDATE() WHERE detail_id = @detail_id;
    SELECT room_number, status AS StatusAfterCheckIn FROM ROOM WHERE room_number = '101';
END
ELSE
    PRINT 'No booking detail found for Room 101 to test check-in.';
GO

-- TEST 2: trg_UpdateRoomStatus_CheckOut
PRINT '--- Testing trg_UpdateRoomStatus_CheckOut ---';

DECLARE @detail_id INT;
SELECT TOP 1 @detail_id = detail_id FROM BOOKING_DETAIL bd 
JOIN ROOM r ON bd.room_id = r.room_id 
WHERE r.room_number = '101' AND actual_checkin IS NOT NULL;

IF @detail_id IS NOT NULL
BEGIN
    UPDATE BOOKING_DETAIL SET actual_checkout = GETDATE() WHERE detail_id = @detail_id;
    SELECT room_number, status AS StatusAfterCheckOut FROM ROOM WHERE room_number = '101';
END
ELSE
    PRINT 'No checked-in booking detail found for Room 101 to test check-out.';
GO

-- TEST 3: trg_CalculateServiceUsageTotal
PRINT '--- Testing trg_CalculateServiceUsageTotal ---';

-- Insert a service usage and see if total_price is auto-calculated
DECLARE @bd_id INT;
SELECT TOP 1 @bd_id = detail_id FROM BOOKING_DETAIL;
DECLARE @s_id INT;
SELECT TOP 1 @s_id = service_id FROM SERVICE;

IF @bd_id IS NOT NULL AND @s_id IS NOT NULL
BEGIN
    INSERT INTO SERVICE_USAGE (booking_detail_id, service_id, quantity, used_at, total_price)
    VALUES (@bd_id, @s_id, 3, GETDATE(), 0); -- Sending 0 to see if it updates
    
    SELECT TOP 1 quantity, total_price, (SELECT unit_price FROM SERVICE WHERE service_id = @s_id) AS UnitPrice
    FROM SERVICE_USAGE ORDER BY usage_id DESC;
END
GO
