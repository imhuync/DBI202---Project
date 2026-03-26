USE HotelDB;
GO

-- 1. Trigger to update Room Status to 'Occupied' when guest checks in
CREATE OR ALTER TRIGGER trg_UpdateRoomStatus_CheckIn
ON BOOKING_DETAIL
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if actual_checkin was updated from NULL to a value
    IF UPDATE(actual_checkin)
    BEGIN
        UPDATE R
        SET R.status = 'Occupied'
        FROM ROOM R
        JOIN inserted i ON R.room_id = i.room_id
        JOIN deleted d ON i.detail_id = d.detail_id
        WHERE i.actual_checkin IS NOT NULL 
          AND d.actual_checkin IS NULL;
    END
END;
GO

-- 2. Trigger to update Room Status to 'Dirty' when guest checks out
CREATE OR ALTER TRIGGER trg_UpdateRoomStatus_CheckOut
ON BOOKING_DETAIL
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if actual_checkout was updated from NULL to a value
    IF UPDATE(actual_checkout)
    BEGIN
        UPDATE R
        SET R.status = 'Dirty'
        FROM ROOM R
        JOIN inserted i ON R.room_id = i.room_id
        JOIN deleted d ON i.detail_id = d.detail_id
        WHERE i.actual_checkout IS NOT NULL 
          AND d.actual_checkout IS NULL;
    END
END;
GO

-- 3. Trigger to auto-calculate Service Usage Total Price
-- This ensures total_price is always quantity * unit_price
CREATE OR ALTER TRIGGER trg_CalculateServiceUsageTotal
ON SERVICE_USAGE
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Avoid infinite recursion check
    IF (SELECT COUNT(*) FROM inserted) > 0
    BEGIN
        UPDATE SU
        SET SU.total_price = SU.quantity * S.unit_price
        FROM SERVICE_USAGE SU
        JOIN SERVICE S ON SU.service_id = S.service_id
        JOIN inserted i ON SU.usage_id = i.usage_id;
    END
END;
GO

-- 4. Trigger to validate Booking Dates (Optional but good for integrity)
CREATE OR ALTER TRIGGER trg_ValidateBookingDates
ON BOOKING
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM inserted i 
        WHERE i.expected_checkout <= i.expected_checkin
    )
    BEGIN
        RAISERROR ('Expected checkout must be after expected checkin.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO
