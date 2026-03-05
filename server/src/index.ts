import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { poolPromise, mssql } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to execute query
const executeQuery = async (query: string, params: { name: string, type: any, value: any }[] = []) => {
    const pool = await poolPromise;
    const request = pool.request();
    params.forEach(param => {
        request.input(param.name, param.type, param.value);
    });
    const result = await request.query(query);
    return result.recordset;
};

/* ── Basic CRUD Endpoints ── */

app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await executeQuery('SELECT * FROM ROOM');
        res.json(rooms);
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/room-types', async (req, res) => {
    try {
        const types = await executeQuery('SELECT * FROM ROOM_TYPE');
        res.json(types);
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/guests', async (req, res) => {
    try {
        const guests = await executeQuery('SELECT * FROM GUEST');
        res.json(guests);
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/employees', async (req, res) => {
    try {
        const employees = await executeQuery('SELECT * FROM EMPLOYEE');
        res.json(employees);
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await executeQuery('SELECT * FROM BOOKING');
        res.json(bookings);
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/booking-details', async (req, res) => {
    try {
        const details = await executeQuery('SELECT * FROM BOOKING_DETAIL');
        res.json(details);
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/services', async (req, res) => {
    try {
        const services = await executeQuery('SELECT * FROM SERVICE');
        res.json(services);
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/service-usages', async (req, res) => {
    try {
        const usages = await executeQuery('SELECT * FROM SERVICE_USAGE');
        res.json(usages);
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/invoices', async (req, res) => {
    try {
        const invoices = await executeQuery('SELECT * FROM INVOICE');
        res.json(invoices);
    } catch (err) { res.status(500).send(err); }
});

/* ── Business Logic (Formerly Stored Procedures) ── */

// Create Booking
app.post('/api/bookings', async (req, res) => {
    const { guest_id, emp_id, expected_checkin, expected_checkout, total_deposit } = req.body;
    try {
        const query = `
            INSERT INTO BOOKING (guest_id, emp_id, booking_date, expected_checkin, expected_checkout, status, total_deposit)
            OUTPUT INSERTED.booking_id
            VALUES (@guest_id, @emp_id, GETDATE(), @expected_checkin, @expected_checkout, N'Pending', @total_deposit)
        `;
        const result = await executeQuery(query, [
            { name: 'guest_id', type: mssql.Int, value: guest_id },
            { name: 'emp_id', type: mssql.Int, value: emp_id },
            { name: 'expected_checkin', type: mssql.DateTime, value: expected_checkin },
            { name: 'expected_checkout', type: mssql.DateTime, value: expected_checkout },
            { name: 'total_deposit', type: mssql.Decimal(12, 2), value: total_deposit }
        ]);
        res.status(201).json(result[0]);
    } catch (err) { res.status(500).send(err); }
});

// Check-In
app.post('/api/check-in', async (req, res) => {
    const { detail_id } = req.body;
    try {
        const pool = await poolPromise;
        const transaction = new mssql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new mssql.Request(transaction);
            request.input('detail_id', mssql.Int, detail_id);

            // 1. Update actual_checkin
            await request.query('UPDATE BOOKING_DETAIL SET actual_checkin = GETDATE() WHERE detail_id = @detail_id');

            // 2. Clear room_id to update room status
            const roomResult = await request.query('SELECT room_id, booking_id FROM BOOKING_DETAIL WHERE detail_id = @detail_id');
            const { room_id, booking_id } = roomResult.recordset[0];

            // 3. Update Room status
            request.input('room_id', mssql.Int, room_id);
            await request.query("UPDATE ROOM SET status = N'Occupied' WHERE room_id = @room_id");

            // 4. Update Booking status if Pending
            request.input('booking_id', mssql.Int, booking_id);
            await request.query("UPDATE BOOKING SET status = N'Confirmed' WHERE booking_id = @booking_id AND status = N'Pending'");

            await transaction.commit();
            res.json({ success: true });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) { res.status(500).send(err); }
});

// Check-Out
app.post('/api/check-out', async (req, res) => {
    const { detail_id } = req.body;
    try {
        const pool = await poolPromise;
        const transaction = new mssql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new mssql.Request(transaction);
            request.input('detail_id', mssql.Int, detail_id);

            // 1. Update actual_checkout
            await request.query('UPDATE BOOKING_DETAIL SET actual_checkout = GETDATE() WHERE detail_id = @detail_id');

            // 2. Get room_id
            const roomResult = await request.query('SELECT room_id FROM BOOKING_DETAIL WHERE detail_id = @detail_id');
            const room_id = roomResult.recordset[0].room_id;

            // 3. Update Room status to Dirty
            request.input('room_id', mssql.Int, room_id);
            await request.query("UPDATE ROOM SET status = N'Dirty' WHERE room_id = @room_id");

            await transaction.commit();
            res.json({ success: true });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) { res.status(500).send(err); }
});

// Add Service Usage
app.post('/api/service-usages', async (req, res) => {
    const { booking_detail_id, service_id, quantity } = req.body;
    try {
        const query = `
            INSERT INTO SERVICE_USAGE (booking_detail_id, service_id, quantity, used_at, total_price)
            SELECT @booking_detail_id, @service_id, @quantity, GETDATE(), @quantity * unit_price
            FROM SERVICE WHERE service_id = @service_id
        `;
        await executeQuery(query, [
            { name: 'booking_detail_id', type: mssql.Int, value: booking_detail_id },
            { name: 'service_id', type: mssql.Int, value: service_id },
            { name: 'quantity', type: mssql.Int, value: quantity }
        ]);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Generate Invoice
app.post('/api/generate-invoice', async (req, res) => {
    const { booking_id, discount, payment_method } = req.body;
    try {
        const pool = await poolPromise;
        const transaction = new mssql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new mssql.Request(transaction);
            request.input('booking_id', mssql.Int, booking_id);

            // 1. Remove old invoice if exists
            await request.query('DELETE FROM INVOICE WHERE booking_id = @booking_id');

            // 2. Calculate charges
            const roomChargeResult = await request.query('SELECT COALESCE(SUM(price_at_booking), 0) as total FROM BOOKING_DETAIL WHERE booking_id = @booking_id');
            const roomCharge = roomChargeResult.recordset[0].total;

            const svcChargeResult = await request.query(`
                SELECT COALESCE(SUM(total_price), 0) as total 
                FROM SERVICE_USAGE su
                JOIN BOOKING_DETAIL bd ON su.booking_detail_id = bd.detail_id
                WHERE bd.booking_id = @booking_id
            `);
            const serviceCharge = svcChargeResult.recordset[0].total;

            const tax = (roomCharge + serviceCharge) * 0.1;
            const finalAmount = (roomCharge + serviceCharge) + tax - (discount || 0);

            // 3. Insert Invoice
            request.input('room_charge', mssql.Decimal(12, 2), roomCharge);
            request.input('service_charge', mssql.Decimal(12, 2), serviceCharge);
            request.input('tax_amount', mssql.Decimal(12, 2), tax);
            request.input('discount_amount', mssql.Decimal(12, 2), discount || 0);
            request.input('final_amount', mssql.Decimal(12, 2), finalAmount);
            request.input('payment_method', mssql.NVarChar(30), payment_method);

            await request.query(`
                INSERT INTO INVOICE (booking_id, room_charge, service_charge, tax_amount, discount_amount, final_amount, payment_date, payment_method)
                VALUES (@booking_id, @room_charge, @service_charge, @tax_amount, @discount_amount, @final_amount, GETDATE(), @payment_method)
            `);

            // 4. Complete Booking
            await request.query("UPDATE BOOKING SET status = N'Completed' WHERE booking_id = @booking_id");

            await transaction.commit();
            res.json({ success: true, finalAmount });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) { res.status(500).send(err); }
});

// Update Room Status
app.post('/api/rooms/update-status', async (req, res) => {
    const { room_id, status } = req.body;
    try {
        await executeQuery('UPDATE ROOM SET status = @status WHERE room_id = @room_id', [
            { name: 'status', type: mssql.NVarChar(20), value: status },
            { name: 'room_id', type: mssql.Int, value: room_id }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Create Room
app.post('/api/rooms', async (req, res) => {
    const { room_number, floor, type_id, status } = req.body;
    try {
        await executeQuery(`
            INSERT INTO ROOM (room_number, floor, type_id, status)
            VALUES (@room_number, @floor, @type_id, @status)
        `, [
            { name: 'room_number', type: mssql.NVarChar(10), value: room_number },
            { name: 'floor', type: mssql.Int, value: floor },
            { name: 'type_id', type: mssql.Int, value: type_id },
            { name: 'status', type: mssql.NVarChar(20), value: status || 'Clean' }
        ]);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Update Room
app.post('/api/rooms/update', async (req, res) => {
    const { room_id, room_number, floor, type_id } = req.body;
    try {
        await executeQuery(`
            UPDATE ROOM 
            SET room_number = @room_number, floor = @floor, type_id = @type_id
            WHERE room_id = @room_id
        `, [
            { name: 'room_id', type: mssql.Int, value: room_id },
            { name: 'room_number', type: mssql.NVarChar(10), value: room_number },
            { name: 'floor', type: mssql.Int, value: floor },
            { name: 'type_id', type: mssql.Int, value: type_id }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Delete Room
app.delete('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Check if room has any booking details
        const details = await executeQuery(
            'SELECT COUNT(*) as count FROM BOOKING_DETAIL WHERE room_id = @id',
            [{ name: 'id', type: mssql.Int, value: parseInt(id!) }]
        );
        if (details[0].count > 0) {
            return res.status(409).json({ error: 'Phòng này đã từng có khách đặt hoặc đang ở, không thể xóa để đảm bảo toàn vẹn dữ liệu.' });
        }

        await executeQuery('DELETE FROM ROOM WHERE room_id = @id', [
            { name: 'id', type: mssql.Int, value: parseInt(id!) }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Update Guest
app.post('/api/guests/update', async (req, res) => {
    const { guest_id, full_name, email, phone, id_card, nationality } = req.body;
    try {
        await executeQuery(`
            UPDATE GUEST 
            SET full_name = @full_name, email = @email, phone = @phone, id_card = @id_card, nationality = @nationality
            WHERE guest_id = @guest_id
        `, [
            { name: 'guest_id', type: mssql.Int, value: guest_id },
            { name: 'full_name', type: mssql.NVarChar(100), value: full_name },
            { name: 'email', type: mssql.NVarChar(100), value: email },
            { name: 'phone', type: mssql.NVarChar(20), value: phone },
            { name: 'id_card', type: mssql.NVarChar(20), value: id_card },
            { name: 'nationality', type: mssql.NVarChar(50), value: nationality }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Create Guest
app.post('/api/guests', async (req, res) => {
    const { full_name, email, phone, id_card, nationality } = req.body;
    try {
        await executeQuery(`
            INSERT INTO GUEST (full_name, email, phone, id_card, nationality)
            VALUES (@full_name, @email, @phone, @id_card, @nationality)
        `, [
            { name: 'full_name', type: mssql.NVarChar(100), value: full_name },
            { name: 'email', type: mssql.NVarChar(100), value: email },
            { name: 'phone', type: mssql.NVarChar(20), value: phone },
            { name: 'id_card', type: mssql.NVarChar(20), value: id_card },
            { name: 'nationality', type: mssql.NVarChar(50), value: nationality || 'Vietnam' }
        ]);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Update Employee
app.post('/api/employees/update', async (req, res) => {
    const { emp_id, full_name, role, username } = req.body;
    try {
        await executeQuery(`
            UPDATE EMPLOYEE 
            SET full_name = @full_name, role = @role, username = @username
            WHERE emp_id = @emp_id
        `, [
            { name: 'emp_id', type: mssql.Int, value: emp_id },
            { name: 'full_name', type: mssql.NVarChar(100), value: full_name },
            { name: 'role', type: mssql.NVarChar(50), value: role },
            { name: 'username', type: mssql.NVarChar(50), value: username }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Create Employee
app.post('/api/employees', async (req, res) => {
    const { full_name, role, username, password_hash } = req.body;
    try {
        await executeQuery(`
            INSERT INTO EMPLOYEE (full_name, role, username, password_hash)
            VALUES (@full_name, @role, @username, @password_hash)
        `, [
            { name: 'full_name', type: mssql.NVarChar(100), value: full_name },
            { name: 'role', type: mssql.NVarChar(50), value: role },
            { name: 'username', type: mssql.NVarChar(50), value: username },
            { name: 'password_hash', type: mssql.NVarChar(255), value: password_hash || '***' }
        ]);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Reset Employee Password
app.post('/api/employees/reset-password', async (req, res) => {
    const { emp_id, password_hash } = req.body;
    try {
        await executeQuery('UPDATE EMPLOYEE SET password_hash = @password_hash WHERE emp_id = @emp_id', [
            { name: 'emp_id', type: mssql.Int, value: emp_id },
            { name: 'password_hash', type: mssql.NVarChar(255), value: password_hash }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Delete Employee
app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await executeQuery('DELETE FROM EMPLOYEE WHERE emp_id = @id', [
            { name: 'id', type: mssql.Int, value: parseInt(id!) }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Update Service
app.post('/api/services/update', async (req, res) => {
    const { service_id, service_name, unit_price, unit } = req.body;
    try {
        await executeQuery(`
            UPDATE SERVICE 
            SET service_name = @service_name, unit_price = @unit_price, unit = @unit
            WHERE service_id = @service_id
        `, [
            { name: 'service_id', type: mssql.Int, value: service_id },
            { name: 'service_name', type: mssql.NVarChar(100), value: service_name },
            { name: 'unit_price', type: mssql.Decimal(12, 2), value: unit_price },
            { name: 'unit', type: mssql.NVarChar(20), value: unit }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Create Service
app.post('/api/services', async (req, res) => {
    const { service_name, unit_price, unit } = req.body;
    try {
        await executeQuery(`
            INSERT INTO SERVICE (service_name, unit_price, unit)
            VALUES (@service_name, @unit_price, @unit)
        `, [
            { name: 'service_name', type: mssql.NVarChar(100), value: service_name },
            { name: 'unit_price', type: mssql.Decimal(12, 2), value: unit_price },
            { name: 'unit', type: mssql.NVarChar(20), value: unit }
        ]);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Delete Service
app.delete('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Check if service is referenced in any service usage
        const usages = await executeQuery(
            'SELECT COUNT(*) as count FROM SERVICE_USAGE WHERE service_id = @id',
            [{ name: 'id', type: mssql.Int, value: parseInt(id!) }]
        );
        if (usages[0].count > 0) {
            return res.status(409).json({ error: 'Dịch vụ này đang được sử dụng trong lịch sử, không thể xóa.' });
        }

        await executeQuery('DELETE FROM SERVICE WHERE service_id = @id', [
            { name: 'id', type: mssql.Int, value: parseInt(id!) }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Delete Guest
app.delete('/api/guests/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Check if guest has any bookings
        const bookings = await executeQuery(
            'SELECT COUNT(*) as count FROM BOOKING WHERE guest_id = @id',
            [{ name: 'id', type: mssql.Int, value: parseInt(id!) }]
        );
        if (bookings[0].count > 0) {
            return res.status(409).json({ error: 'Khách hàng này đang có booking, không thể xóa.' });
        }

        await executeQuery('DELETE FROM GUEST WHERE guest_id = @id', [
            { name: 'id', type: mssql.Int, value: parseInt(id!) }
        ]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = "SELECT * FROM EMPLOYEE WHERE username = @username AND password_hash = @password";
        const result = await executeQuery(query, [
            { name: 'username', type: mssql.NVarChar(50), value: username },
            { name: 'password', type: mssql.NVarChar(255), value: password }
        ]);

        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) { res.status(500).send(err); }
});

// Change Password
app.post('/api/employees/change-password', async (req, res) => {
    const { emp_id, current_password, new_password } = req.body;
    try {
        const checkQuery = "SELECT * FROM EMPLOYEE WHERE emp_id = @emp_id AND password_hash = @current_password";
        const user = await executeQuery(checkQuery, [
            { name: 'emp_id', type: mssql.Int, value: emp_id },
            { name: 'current_password', type: mssql.NVarChar(255), value: current_password }
        ]);

        if (user.length === 0) {
            return res.status(401).json({ error: 'Current password incorrect' });
        }

        const updateQuery = "UPDATE EMPLOYEE SET password_hash = @new_password WHERE emp_id = @emp_id";
        await executeQuery(updateQuery, [
            { name: 'emp_id', type: mssql.Int, value: emp_id },
            { name: 'new_password', type: mssql.NVarChar(255), value: new_password }
        ]);

        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});


// Cancel Booking
app.post('/api/bookings/cancel', async (req, res) => {
    const { booking_id } = req.body;
    try {
        await executeQuery(
            "UPDATE BOOKING SET status = N'Cancelled' WHERE booking_id = @booking_id AND status IN (N'Pending', N'Confirmed')",
            [{ name: 'booking_id', type: mssql.Int, value: booking_id }]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Confirm Booking
app.post('/api/bookings/confirm', async (req, res) => {
    const { booking_id } = req.body;
    try {
        await executeQuery(
            "UPDATE BOOKING SET status = N'Confirmed' WHERE booking_id = @booking_id AND status = N'Pending'",
            [{ name: 'booking_id', type: mssql.Int, value: booking_id }]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
