import type { Database, Room, Guest, Employee, Service, RoomType } from './types';
import { apiFetch } from './api';

export let DB: Database = {
    roomTypes: [],
    rooms: [],
    guests: [],
    employees: [],
    bookings: [],
    bookingDetails: [],
    services: [],
    serviceUsages: [],
    invoices: [],
};

export async function fetchDB(): Promise<void> {
    try {
        const [
            roomTypes, rooms, guests, employees, bookings,
            bookingDetails, services, serviceUsages, invoices
        ] = await Promise.all([
            apiFetch<RoomType[]>('/room-types'),
            apiFetch<Room[]>('/rooms'),
            apiFetch<Guest[]>('/guests'),
            apiFetch<Employee[]>('/employees'),
            apiFetch<any[]>('/bookings'),
            apiFetch<any[]>('/booking-details'),
            apiFetch<Service[]>('/services'),
            apiFetch<any[]>('/service-usages'),
            apiFetch<any[]>('/invoices'),
        ]);

        DB.roomTypes = roomTypes;
        DB.rooms = rooms;
        DB.guests = guests;
        DB.employees = employees;
        DB.bookings = bookings;
        DB.bookingDetails = bookingDetails;
        DB.services = services;
        DB.serviceUsages = serviceUsages;
        DB.invoices = invoices;
    } catch (error) {
        console.error('Failed to fetch data from API:', error);
    }
}

/* ── Helper Functions ── */

export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export function formatDate(str: string | null): string {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(str: string | null): string {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
}

export function getRoomType(room: Room): RoomType {
    return DB.roomTypes.find(t => t.type_id === room.type_id)!;
}

export function getGuest(id: number): Guest {
    return DB.guests.find(g => g.guest_id === id)!;
}

export function getEmployee(id: number): Employee {
    return DB.employees.find(e => e.emp_id === id)!;
}

export function getRoom(id: number): Room {
    return DB.rooms.find(r => r.room_id === id)!;
}

export function getService(id: number): Service {
    return DB.services.find(s => s.service_id === id)!;
}
