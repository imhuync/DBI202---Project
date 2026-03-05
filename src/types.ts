/* =============================================
   Type definitions for Hotel Management System
   ============================================= */

export interface RoomType {
    type_id: number;
    type_name: string;
    base_price: number;
    max_capacity: number;
    description: string;
}

export interface Room {
    room_id: number;
    room_number: string;
    type_id: number;
    status: 'Clean' | 'Occupied' | 'Dirty' | 'Maintenance';
    floor: number;
}

export interface Guest {
    guest_id: number;
    full_name: string;
    email: string;
    phone: string;
    id_card: string;
    nationality: string;
}

export interface Employee {
    emp_id: number;
    full_name: string;
    role: 'Receptionist' | 'Manager' | 'Housekeeper' | 'Admin';
    username: string;
    password_hash: string;
}

export interface Booking {
    booking_id: number;
    guest_id: number;
    emp_id: number;
    booking_date: string;
    expected_checkin: string;
    expected_checkout: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    total_deposit: number;
}

export interface BookingDetail {
    detail_id: number;
    booking_id: number;
    room_id: number;
    actual_checkin: string | null;
    actual_checkout: string | null;
    price_at_booking: number;
}

export interface Service {
    service_id: number;
    service_name: string;
    unit_price: number;
    unit: string;
}

export interface ServiceUsage {
    usage_id: number;
    booking_detail_id: number;
    service_id: number;
    quantity: number;
    used_at: string;
    total_price: number;
}

export interface Invoice {
    invoice_id: number;
    booking_id: number;
    room_charge: number;
    service_charge: number;
    tax_amount: number;
    discount_amount: number;
    final_amount: number;
    payment_date: string;
    payment_method: 'Cash' | 'Card' | 'Transfer' | 'E-Wallet';
}

export interface Database {
    roomTypes: RoomType[];
    rooms: Room[];
    guests: Guest[];
    employees: Employee[];
    bookings: Booking[];
    bookingDetails: BookingDetail[];
    services: Service[];
    serviceUsages: ServiceUsage[];
    invoices: Invoice[];
}

export type PageName = 'login' | 'dashboard' | 'guests' | 'rooms' | 'bookings' | 'services' | 'invoices' | 'employees';

export interface PageConfig {
    title: string;
    render: () => string;
}
