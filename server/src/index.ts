import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { poolPromise, mssql } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

type SqlParam = { name: string; type: any; value: any };

const isMissingStoredProcedureError = (err: unknown): boolean =>
    (err as any)?.number === 2812;

const executeQuery = async (
    query: string,
    params: SqlParam[] = []
) => {
    const request = (await poolPromise).request();
    params.forEach(param => request.input(param.name, param.type, param.value));
    const result = await request.query(query);
    return result.recordset;
};

const executeQueryResult = async (
    query: string,
    params: SqlParam[] = []
) => {
    const request = (await poolPromise).request();
    params.forEach(param => request.input(param.name, param.type, param.value));
    return request.query(query);
};

const executeProcedure = async (
    procedure: string,
    params: SqlParam[] = []
) => {
    const request = (await poolPromise).request();
    params.forEach(param => request.input(param.name, param.type, param.value));
    return request.execute(procedure);
};

const createTransactionRequest = (
    transaction: any,
    params: SqlParam[] = []
) => {
    const request = new mssql.Request(transaction);
    params.forEach(param => request.input(param.name, param.type, param.value));
    return request;
};

const executeProcedureOrQuery = async (
    procedure: string,
    fallbackQuery: string,
    params: { name: string; type: any; value: any }[] = []
) => {
    try {
        const request = (await poolPromise).request();
        params.forEach(param => request.input(param.name, param.type, param.value));
        const result = await request.execute(procedure);
        return result.recordset;
    } catch (err) {
        if ((err as any).number === 2812) {
            return executeQuery(fallbackQuery, params);
        }
        throw err;
    }
};

/* ── Basic CRUD Endpoints (Using Stored Procedures) ── */

app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await executeProcedureOrQuery(
            'sp_GetAllRooms',
            `SELECT r.*, rt.type_name, rt.base_price
             FROM ROOM r
             JOIN ROOM_TYPE rt ON r.type_id = rt.type_id`
        );
        res.json(rooms);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.get('/api/room-types', async (req, res) => {
    try {
        const roomTypes = await executeProcedureOrQuery(
            'sp_GetAllRoomTypes',
            'SELECT * FROM ROOM_TYPE'
        );
        res.json(roomTypes);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.post('/api/room-types', async (req, res) => {
    const { type_name, base_price, max_capacity, description } = req.body;
    const params: SqlParam[] = [
        { name: 'type_name', type: mssql.NVarChar(50), value: type_name },
        { name: 'base_price', type: mssql.Decimal(12, 2), value: base_price },
        { name: 'max_capacity', type: mssql.Int, value: max_capacity },
        { name: 'description', type: mssql.NVarChar(500), value: description }
    ];
    try {
        try {
            await executeProcedure('sp_CreateRoomType', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `INSERT INTO ROOM_TYPE (type_name, base_price, max_capacity, description)
                 VALUES (@type_name, @base_price, @max_capacity, @description)`,
                params
            );
        }
        res.status(201).json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.get('/api/guests', async (req, res) => {
    try {
        const guests = await executeProcedureOrQuery(
            'sp_GetAllGuests',
            'SELECT * FROM GUEST'
        );
        res.json(guests);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.get('/api/employees', async (req, res) => {
    try {
        const employees = await executeProcedureOrQuery(
            'sp_GetAllEmployees',
            'SELECT emp_id, full_name, role, username FROM EMPLOYEE'
        );
        res.json(employees);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await executeProcedureOrQuery(
            'sp_GetAllBookings',
            'SELECT * FROM BOOKING'
        );
        res.json(bookings);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.get('/api/booking-details', async (req, res) => {
    try {
        const details = await executeProcedureOrQuery(
            'sp_GetAllBookingDetails',
            'SELECT * FROM BOOKING_DETAIL'
        );
        res.json(details);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.get('/api/services', async (req, res) => {
    try {
        const services = await executeProcedureOrQuery(
            'sp_GetAllServices',
            'SELECT * FROM SERVICE'
        );
        res.json(services);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.get('/api/service-usages', async (req, res) => {
    try {
        const usages = await executeProcedureOrQuery(
            'sp_GetAllServiceUsages',
            'SELECT * FROM SERVICE_USAGE'
        );
        res.json(usages);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.get('/api/invoices', async (req, res) => {
    try {
        const invoices = await executeProcedureOrQuery(
            'sp_GetAllInvoices',
            'SELECT * FROM INVOICE'
        );
        res.json(invoices);
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

/* ── Business Logic (Calling Stored Procedures) ── */

// Create Booking
app.post('/api/bookings', async (req, res) => {
    const { guest_id, emp_id, expected_checkin, expected_checkout, total_deposit, rooms } = req.body;
    const roomIds = Array.isArray(rooms)
        ? [...new Set(rooms.map((roomId: unknown) => Number(roomId)).filter(roomId => Number.isInteger(roomId) && roomId > 0))]
        : [];

    if (roomIds.length === 0) {
        return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 phòng.' });
    }

    try {
        const pool = await poolPromise;
        const transaction = new mssql.Transaction(pool);
        await transaction.begin();

        try {
            const bookingParams: SqlParam[] = [
                { name: 'guest_id', type: mssql.Int, value: guest_id },
                { name: 'emp_id', type: mssql.Int, value: emp_id },
                { name: 'checkin', type: mssql.DateTime, value: expected_checkin },
                { name: 'checkout', type: mssql.DateTime, value: expected_checkout },
                { name: 'deposit', type: mssql.Decimal(12, 2), value: total_deposit }
            ];

            let bookingResult;
            try {
                bookingResult = await createTransactionRequest(transaction, bookingParams)
                    .execute('sp_CreateBooking');
            } catch (err) {
                if (!isMissingStoredProcedureError(err)) throw err;
                bookingResult = await createTransactionRequest(transaction, bookingParams)
                    .query(`
                        INSERT INTO BOOKING (guest_id, emp_id, booking_date, expected_checkin, expected_checkout, status, total_deposit)
                        OUTPUT INSERTED.booking_id
                        VALUES (@guest_id, @emp_id, GETDATE(), @checkin, @checkout, N'Pending', @deposit)
                    `);
            }

            const bookingId = bookingResult.recordset[0]?.booking_id;
            if (!bookingId) {
                throw new Error('Không thể tạo booking mới.');
            }

            for (const roomId of roomIds) {
                const detailResult = await new mssql.Request(transaction)
                    .input('booking_id', mssql.Int, bookingId)
                    .input('room_id', mssql.Int, roomId)
                    .query(`
                        INSERT INTO BOOKING_DETAIL (booking_id, room_id, price_at_booking)
                        SELECT @booking_id, r.room_id, rt.base_price
                        FROM ROOM r
                        JOIN ROOM_TYPE rt ON r.type_id = rt.type_id
                        WHERE r.room_id = @room_id
                          AND r.status = N'Clean'
                    `);

                if ((detailResult.rowsAffected[0] ?? 0) === 0) {
                    throw Object.assign(
                        new Error('Phòng không tồn tại hoặc hiện không sẵn sàng để đặt.'),
                        { statusCode: 409 }
                    );
                }
            }

            await transaction.commit();
            res.status(201).json({ booking_id: bookingId });
        } catch (err) {
            await transaction.rollback();

            if ((err as any).statusCode === 409) {
                return res.status(409).json({ error: (err as any).message });
            }

            throw err;
        }
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Check-In
app.post('/api/check-in', async (req, res) => {
    const { detail_id } = req.body;
    try {
        try {
            await executeProcedure('sp_CheckIn', [
                { name: 'detail_id', type: mssql.Int, value: detail_id }
            ]);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;

            const pool = await poolPromise;
            const transaction = new mssql.Transaction(pool);
            await transaction.begin();

            try {
                await createTransactionRequest(transaction, [
                    { name: 'detail_id', type: mssql.Int, value: detail_id }
                ]).query('UPDATE BOOKING_DETAIL SET actual_checkin = GETDATE() WHERE detail_id = @detail_id');

                const roomResult = await createTransactionRequest(transaction, [
                    { name: 'detail_id', type: mssql.Int, value: detail_id }
                ]).query('SELECT room_id, booking_id FROM BOOKING_DETAIL WHERE detail_id = @detail_id');

                const { room_id, booking_id } = roomResult.recordset[0] || {};
                await createTransactionRequest(transaction, [
                    { name: 'room_id', type: mssql.Int, value: room_id }
                ]).query("UPDATE ROOM SET status = N'Occupied' WHERE room_id = @room_id");

                await createTransactionRequest(transaction, [
                    { name: 'booking_id', type: mssql.Int, value: booking_id }
                ]).query("UPDATE BOOKING SET status = N'Confirmed' WHERE booking_id = @booking_id AND status = N'Pending'");

                await transaction.commit();
            } catch (fallbackErr) {
                await transaction.rollback();
                throw fallbackErr;
            }
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Check-Out
app.post('/api/check-out', async (req, res) => {
    const { detail_id } = req.body;
    try {
        try {
            await executeProcedure('sp_CheckOut', [
                { name: 'detail_id', type: mssql.Int, value: detail_id }
            ]);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;

            const pool = await poolPromise;
            const transaction = new mssql.Transaction(pool);
            await transaction.begin();

            try {
                await createTransactionRequest(transaction, [
                    { name: 'detail_id', type: mssql.Int, value: detail_id }
                ]).query('UPDATE BOOKING_DETAIL SET actual_checkout = GETDATE() WHERE detail_id = @detail_id');

                const roomResult = await createTransactionRequest(transaction, [
                    { name: 'detail_id', type: mssql.Int, value: detail_id }
                ]).query('SELECT room_id FROM BOOKING_DETAIL WHERE detail_id = @detail_id');

                const room_id = roomResult.recordset[0]?.room_id;
                await createTransactionRequest(transaction, [
                    { name: 'room_id', type: mssql.Int, value: room_id }
                ]).query("UPDATE ROOM SET status = N'Dirty' WHERE room_id = @room_id");

                await transaction.commit();
            } catch (fallbackErr) {
                await transaction.rollback();
                throw fallbackErr;
            }
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Add Service Usage
app.post('/api/service-usages', async (req, res) => {
    const { booking_detail_id, service_id, quantity } = req.body;
    const params: SqlParam[] = [
        { name: 'detail_id', type: mssql.Int, value: booking_detail_id },
        { name: 'service_id', type: mssql.Int, value: service_id },
        { name: 'quantity', type: mssql.Int, value: quantity }
    ];
    try {
        try {
            await executeProcedure('sp_AddServiceUsage', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `INSERT INTO SERVICE_USAGE (booking_detail_id, service_id, quantity, used_at, total_price)
                 SELECT @detail_id, @service_id, @quantity, GETDATE(), @quantity * unit_price
                 FROM SERVICE WHERE service_id = @service_id`,
                params
            );
        }
        res.status(201).json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Generate Invoice
app.post('/api/generate-invoice', async (req, res) => {
    const { booking_id, discount, payment_method } = req.body;
    try {
        let finalAmount = 0;

        try {
            const result = await executeProcedure('sp_GenerateInvoice', [
                { name: 'booking_id', type: mssql.Int, value: booking_id },
                { name: 'discount', type: mssql.Decimal(12, 2), value: discount },
                { name: 'method', type: mssql.NVarChar(30), value: payment_method }
            ]);
            finalAmount = result.recordset[0]?.finalAmount ?? 0;
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;

            const pool = await poolPromise;
            const transaction = new mssql.Transaction(pool);
            await transaction.begin();

            try {
                const bookingParam: SqlParam = { name: 'booking_id', type: mssql.Int, value: booking_id };
                await createTransactionRequest(transaction, [bookingParam]).query('DELETE FROM INVOICE WHERE booking_id = @booking_id');

                const roomChargeResult = await createTransactionRequest(transaction, [bookingParam])
                    .query('SELECT COALESCE(SUM(price_at_booking), 0) as total FROM BOOKING_DETAIL WHERE booking_id = @booking_id');
                const roomCharge = roomChargeResult.recordset[0]?.total ?? 0;

                const serviceChargeResult = await createTransactionRequest(transaction, [bookingParam]).query(`
                    SELECT COALESCE(SUM(total_price), 0) as total
                    FROM SERVICE_USAGE su
                    JOIN BOOKING_DETAIL bd ON su.booking_detail_id = bd.detail_id
                    WHERE bd.booking_id = @booking_id
                `);
                const serviceCharge = serviceChargeResult.recordset[0]?.total ?? 0;

                const tax = (roomCharge + serviceCharge) * 0.1;
                finalAmount = (roomCharge + serviceCharge) + tax - (discount || 0);

                await createTransactionRequest(transaction, [
                    bookingParam,
                    { name: 'room_charge', type: mssql.Decimal(12, 2), value: roomCharge },
                    { name: 'service_charge', type: mssql.Decimal(12, 2), value: serviceCharge },
                    { name: 'tax_amount', type: mssql.Decimal(12, 2), value: tax },
                    { name: 'discount_amount', type: mssql.Decimal(12, 2), value: discount || 0 },
                    { name: 'final_amount', type: mssql.Decimal(12, 2), value: finalAmount },
                    { name: 'payment_method', type: mssql.NVarChar(30), value: payment_method }
                ]).query(`
                    INSERT INTO INVOICE (booking_id, room_charge, service_charge, tax_amount, discount_amount, final_amount, payment_date, payment_method)
                    VALUES (@booking_id, @room_charge, @service_charge, @tax_amount, @discount_amount, @final_amount, GETDATE(), @payment_method)
                `);

                await createTransactionRequest(transaction, [bookingParam])
                    .query("UPDATE BOOKING SET status = N'Completed' WHERE booking_id = @booking_id");

                await transaction.commit();
            } catch (fallbackErr) {
                await transaction.rollback();
                throw fallbackErr;
            }
        }

        res.json({ success: true, finalAmount });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Update Room Status
app.post('/api/rooms/update-status', async (req, res) => {
    const { room_id, status } = req.body;
    const params: SqlParam[] = [
        { name: 'room_id', type: mssql.Int, value: room_id },
        { name: 'status', type: mssql.NVarChar(20), value: status }
    ];
    try {
        try {
            await executeProcedure('sp_UpdateRoomStatus', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult('UPDATE ROOM SET status = @status WHERE room_id = @room_id', params);
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Create Room
app.post('/api/rooms', async (req, res) => {
    const { room_number, floor, type_id, status } = req.body;
    const params: SqlParam[] = [
        { name: 'room_number', type: mssql.NVarChar(10), value: room_number },
        { name: 'floor', type: mssql.Int, value: floor },
        { name: 'type_id', type: mssql.Int, value: type_id },
        { name: 'status', type: mssql.NVarChar(20), value: status || 'Clean' }
    ];
    try {
        try {
            await executeProcedure('sp_CreateRoom', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `INSERT INTO ROOM (room_number, floor, type_id, status)
                 VALUES (@room_number, @floor, @type_id, @status)`,
                params
            );
        }
        res.status(201).json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Update Room
app.post('/api/rooms/update', async (req, res) => {
    const { room_id, room_number, floor, type_id } = req.body;
    const params: SqlParam[] = [
        { name: 'room_id', type: mssql.Int, value: room_id },
        { name: 'room_number', type: mssql.NVarChar(10), value: room_number },
        { name: 'floor', type: mssql.Int, value: floor },
        { name: 'type_id', type: mssql.Int, value: type_id }
    ];
    try {
        try {
            await executeProcedure('sp_UpdateRoom', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `UPDATE ROOM
                 SET room_number = @room_number, floor = @floor, type_id = @type_id
                 WHERE room_id = @room_id`,
                params
            );
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Delete Room
app.delete('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const roomId = parseInt(id!);
    try {
        try {
            await executeProcedure('sp_DeleteRoom', [
                { name: 'room_id', type: mssql.Int, value: roomId }
            ]);
        } catch (err) {
            if ((err as any).number === 50001) {
                return res.status(409).json({ error: (err as any).message });
            }
            if (!isMissingStoredProcedureError(err)) throw err;

            const details = await executeQuery(
                'SELECT COUNT(*) as count FROM BOOKING_DETAIL WHERE room_id = @id',
                [{ name: 'id', type: mssql.Int, value: roomId }]
            );
            if (details[0]?.count > 0) {
                return res.status(409).json({ error: 'Phòng này đã từng có khách đặt hoặc đang ở, không thể xóa để đảm bảo toàn vẹn dữ liệu.' });
            }

            await executeQueryResult('DELETE FROM ROOM WHERE room_id = @id', [
                { name: 'id', type: mssql.Int, value: roomId }
            ]);
        }
        res.json({ success: true });
    } catch (err) { 
        res.status(500).send(err); 
    }
});

// Update Guest
app.post('/api/guests/update', async (req, res) => {
    const { guest_id, full_name, email, phone, id_card, nationality } = req.body;
    const params: SqlParam[] = [
        { name: 'guest_id', type: mssql.Int, value: guest_id },
        { name: 'full_name', type: mssql.NVarChar(100), value: full_name },
        { name: 'email', type: mssql.NVarChar(100), value: email },
        { name: 'phone', type: mssql.NVarChar(20), value: phone },
        { name: 'id_card', type: mssql.NVarChar(20), value: id_card },
        { name: 'nationality', type: mssql.NVarChar(50), value: nationality }
    ];
    try {
        try {
            await executeProcedure('sp_UpdateGuest', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `UPDATE GUEST
                 SET full_name = @full_name, email = @email, phone = @phone, id_card = @id_card, nationality = @nationality
                 WHERE guest_id = @guest_id`,
                params
            );
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Create Guest
app.post('/api/guests', async (req, res) => {
    const { full_name, email, phone, id_card, nationality } = req.body;
    const params: SqlParam[] = [
        { name: 'full_name', type: mssql.NVarChar(100), value: full_name },
        { name: 'email', type: mssql.NVarChar(100), value: email },
        { name: 'phone', type: mssql.NVarChar(20), value: phone },
        { name: 'id_card', type: mssql.NVarChar(20), value: id_card },
        { name: 'nationality', type: mssql.NVarChar(50), value: nationality || 'Vietnam' }
    ];
    try {
        try {
            await executeProcedure('sp_CreateGuest', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `INSERT INTO GUEST (full_name, email, phone, id_card, nationality)
                 VALUES (@full_name, @email, @phone, @id_card, @nationality)`,
                params
            );
        }
        res.status(201).json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Update Employee
app.post('/api/employees/update', async (req, res) => {
    const { emp_id, full_name, role, username } = req.body;
    const params: SqlParam[] = [
        { name: 'emp_id', type: mssql.Int, value: emp_id },
        { name: 'full_name', type: mssql.NVarChar(100), value: full_name },
        { name: 'role', type: mssql.NVarChar(50), value: role },
        { name: 'username', type: mssql.NVarChar(50), value: username }
    ];
    try {
        try {
            await executeProcedure('sp_UpdateEmployee', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `UPDATE EMPLOYEE
                 SET full_name = @full_name, role = @role, username = @username
                 WHERE emp_id = @emp_id`,
                params
            );
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Create Employee
app.post('/api/employees', async (req, res) => {
    const { full_name, role, username, password_hash } = req.body;
    const params: SqlParam[] = [
        { name: 'full_name', type: mssql.NVarChar(100), value: full_name },
        { name: 'role', type: mssql.NVarChar(30), value: role },
        { name: 'username', type: mssql.NVarChar(50), value: username },
        { name: 'password_hash', type: mssql.NVarChar(256), value: password_hash || '***' }
    ];
    try {
        try {
            await executeProcedure('sp_CreateEmployee', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `INSERT INTO EMPLOYEE (full_name, role, username, password_hash)
                 VALUES (@full_name, @role, @username, @password_hash)`,
                params
            );
        }
        res.status(201).json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Reset Employee Password
app.post('/api/employees/reset-password', async (req, res) => {
    const { emp_id, password_hash } = req.body;
    const params: SqlParam[] = [
        { name: 'emp_id', type: mssql.Int, value: emp_id },
        { name: 'password_hash', type: mssql.NVarChar(256), value: password_hash }
    ];
    try {
        try {
            await executeProcedure('sp_ResetPassword', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                'UPDATE EMPLOYEE SET password_hash = @password_hash WHERE emp_id = @emp_id',
                params
            );
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Delete Employee
app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const empId = parseInt(id!);
    try {
        try {
            await executeProcedure('sp_DeleteEmployee', [
                { name: 'emp_id', type: mssql.Int, value: empId }
            ]);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult('DELETE FROM EMPLOYEE WHERE emp_id = @id', [
                { name: 'id', type: mssql.Int, value: empId }
            ]);
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Update Service
app.post('/api/services/update', async (req, res) => {
    const { service_id, service_name, unit_price, unit } = req.body;
    const params: SqlParam[] = [
        { name: 'service_id', type: mssql.Int, value: service_id },
        { name: 'service_name', type: mssql.NVarChar(100), value: service_name },
        { name: 'unit_price', type: mssql.Decimal(12, 2), value: unit_price },
        { name: 'unit', type: mssql.NVarChar(20), value: unit }
    ];
    try {
        try {
            await executeProcedure('sp_UpdateService', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `UPDATE SERVICE
                 SET service_name = @service_name, unit_price = @unit_price, unit = @unit
                 WHERE service_id = @service_id`,
                params
            );
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Create Service
app.post('/api/services', async (req, res) => {
    const { service_name, unit_price, unit } = req.body;
    const params: SqlParam[] = [
        { name: 'service_name', type: mssql.NVarChar(100), value: service_name },
        { name: 'unit_price', type: mssql.Decimal(12, 2), value: unit_price },
        { name: 'unit', type: mssql.NVarChar(20), value: unit }
    ];
    try {
        try {
            await executeProcedure('sp_CreateService', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                `INSERT INTO SERVICE (service_name, unit_price, unit)
                 VALUES (@service_name, @unit_price, @unit)`,
                params
            );
        }
        res.status(201).json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Delete Service
app.delete('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    const serviceId = parseInt(id!);
    try {
        try {
            await executeProcedure('sp_DeleteService', [
                { name: 'service_id', type: mssql.Int, value: serviceId }
            ]);
        } catch (err) { 
            if ((err as any).number === 50004) {
                return res.status(409).json({ error: (err as any).message });
            }
            if (!isMissingStoredProcedureError(err)) throw err;

            const usages = await executeQuery(
                'SELECT COUNT(*) as count FROM SERVICE_USAGE WHERE service_id = @id',
                [{ name: 'id', type: mssql.Int, value: serviceId }]
            );
            if (usages[0]?.count > 0) {
                return res.status(409).json({ error: 'Dịch vụ này đang được sử dụng trong lịch sử, không thể xóa.' });
            }

            await executeQueryResult('DELETE FROM SERVICE WHERE service_id = @id', [
                { name: 'id', type: mssql.Int, value: serviceId }
            ]);
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Delete Guest
app.delete('/api/guests/:id', async (req, res) => {
    const { id } = req.params;
    const guestId = parseInt(id!);
    try {
        try {
            await executeProcedure('sp_DeleteGuest', [
                { name: 'guest_id', type: mssql.Int, value: guestId }
            ]);
        } catch (err) { 
            if ((err as any).number === 50002) {
                return res.status(409).json({ error: (err as any).message });
            }
            if (!isMissingStoredProcedureError(err)) throw err;

            const bookings = await executeQuery(
                'SELECT COUNT(*) as count FROM BOOKING WHERE guest_id = @id',
                [{ name: 'id', type: mssql.Int, value: guestId }]
            );
            if (bookings[0]?.count > 0) {
                return res.status(409).json({ error: 'Khách hàng này đang có booking, không thể xóa.' });
            }

            await executeQueryResult('DELETE FROM GUEST WHERE guest_id = @id', [
                { name: 'id', type: mssql.Int, value: guestId }
            ]);
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: 'Dữ liệu (CMND/CCCD, Username, Số phòng...) đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!' });
        }
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const params: SqlParam[] = [
            { name: 'username', type: mssql.NVarChar(50), value: username },
            { name: 'password', type: mssql.NVarChar(256), value: password }
        ];

        let users;
        try {
            users = (await executeProcedure('sp_Login', params)).recordset;
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            users = await executeQuery(
                'SELECT * FROM EMPLOYEE WHERE username = @username AND password_hash = @password',
                params
            );
        }

        if (users.length > 0) {
            res.json(users[0]);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err: any) { 
        console.error('API Error:', err); 
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Change Password
app.post('/api/employees/change-password', async (req, res) => {
    const { emp_id, current_password, new_password } = req.body;
    try {
        const params: SqlParam[] = [
            { name: 'emp_id', type: mssql.Int, value: emp_id },
            { name: 'current_password', type: mssql.NVarChar(256), value: current_password },
            { name: 'new_password', type: mssql.NVarChar(256), value: new_password }
        ];

        try {
            await executeProcedure('sp_ChangePassword', params);
        } catch (err) { 
            if ((err as any).number === 50003) {
                return res.status(401).json({ error: (err as any).message });
            }
            if (!isMissingStoredProcedureError(err)) throw err;

            const user = await executeQuery(
                'SELECT * FROM EMPLOYEE WHERE emp_id = @emp_id AND password_hash = @current_password',
                [
                    { name: 'emp_id', type: mssql.Int, value: emp_id },
                    { name: 'current_password', type: mssql.NVarChar(256), value: current_password }
                ]
            );
            if (user.length === 0) {
                return res.status(401).json({ error: 'Current password incorrect' });
            }

            await executeQueryResult(
                'UPDATE EMPLOYEE SET password_hash = @new_password WHERE emp_id = @emp_id',
                [
                    { name: 'emp_id', type: mssql.Int, value: emp_id },
                    { name: 'new_password', type: mssql.NVarChar(256), value: new_password }
                ]
            );
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Cancel Booking
app.post('/api/bookings/cancel', async (req, res) => {
    const { booking_id } = req.body;
    const params: SqlParam[] = [{ name: 'booking_id', type: mssql.Int, value: booking_id }];
    try {
        try {
            await executeProcedure('sp_CancelBooking', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                "UPDATE BOOKING SET status = N'Cancelled' WHERE booking_id = @booking_id AND status IN (N'Pending', N'Confirmed')",
                params
            );
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

// Confirm Booking
app.post('/api/bookings/confirm', async (req, res) => {
    const { booking_id } = req.body;
    const params: SqlParam[] = [{ name: 'booking_id', type: mssql.Int, value: booking_id }];
    try {
        try {
            await executeProcedure('sp_ConfirmBooking', params);
        } catch (err) {
            if (!isMissingStoredProcedureError(err)) throw err;
            await executeQueryResult(
                "UPDATE BOOKING SET status = N'Confirmed' WHERE booking_id = @booking_id AND status = N'Pending'",
                params
            );
        }
        res.json({ success: true });
    } catch (err: any) { 
        console.error('API Error:', err); 
        res.status(500).json({ error: err.message || 'Internal Server Error' }); 
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
