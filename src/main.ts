/* =============================================
   main.ts — SPA Router & Global Utilities
   ============================================= */
import './style.css';
import type { PageName } from './types';

/* ── Page module imports ── */
import { renderDashboard, initDashboard } from './pages/dashboard';
import { renderGuests, initGuestsEvents } from './pages/guests';
import { renderRooms, initRoomsEvents } from './pages/rooms';
import { renderBookings, initBookingsEvents } from './pages/bookings';
import { renderServices, initServicesEvents } from './pages/services';
import { renderInvoices, initInvoicesEvents } from './pages/invoices';
import { renderEmployees, initEmployeesEvents } from './pages/employees';
import { renderLoginPage, initLoginPage } from './pages/login';

/* ── Page registry ── */
const pages: Record<PageName, { title: string; render: () => string; init?: () => void }> = {
    login: { title: 'Đăng nhập', render: renderLoginPage, init: initLoginPage },
    dashboard: { title: 'Dashboard', render: renderDashboard, init: initDashboard },
    guests: { title: 'Khách hàng', render: renderGuests, init: initGuestsEvents },
    rooms: { title: 'Quản lý phòng', render: renderRooms, init: initRoomsEvents },
    bookings: { title: 'Đặt phòng', render: renderBookings, init: initBookingsEvents },
    services: { title: 'Dịch vụ', render: renderServices, init: initServicesEvents },
    invoices: { title: 'Hóa đơn', render: renderInvoices, init: initInvoicesEvents },
    employees: { title: 'Nhân viên', render: renderEmployees, init: initEmployeesEvents },
};

/* ── DOM references ── */
const $container = () => document.getElementById('pageContainer')!;
const $title = () => document.getElementById('pageTitle')!;
const $sidebar = () => document.getElementById('sidebar')!;

import { closeModal, navigateTo, initTheme, toggleTheme, toggleNotifications, getCurrentUser, checkPermission, logout, showToast } from './ui';


function handleRoute(): void {
    const hash = (window.location.hash.slice(1) || 'dashboard') as PageName;
    const user = getCurrentUser();

    // 1. Auth Guard
    if (!user && hash !== 'login') {
        navigateTo('login');
        return;
    }

    if (user && hash === 'login') {
        navigateTo('dashboard');
        return;
    }

    // 2. Permission Guard
    if (user && !checkPermission(hash)) {
        navigateTo('dashboard');
        return;
    }

    const page = pages[hash] || pages.dashboard;

    // 3. UI State (Show/Hide elements)
    const isLoginPage = hash === 'login';
    $sidebar().classList.toggle('hidden', isLoginPage);
    document.querySelector('.top-bar')?.classList.toggle('hidden', isLoginPage);
    document.body.classList.toggle('auth-layout', isLoginPage);

    if (user) {
        updateSidebarForRole(user.role);
        updateUserCard(user);
    }

    $title().textContent = page.title;
    $container().innerHTML = page.render();
    page.init?.();

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        const navPage = (item as HTMLElement).dataset.page;
        item.classList.toggle('active', navPage === hash);
    });

    // Close mobile sidebar and backdrop
    $sidebar().classList.remove('open');
    document.getElementById('sidebarBackdrop')?.classList.remove('active');
}


function updateSidebarForRole(_role: string): void {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const page = item.getAttribute('data-page') as PageName;
        const hasAccess = checkPermission(page);
        (item as HTMLElement).classList.toggle('hidden', !hasAccess);
    });
}

function updateUserCard(user: any): void {
    const roleLabel: Record<string, string> = {
        Admin: 'Admin',
        Manager: 'Quản lý',
        Receptionist: 'Lễ tân',
        Housekeeper: 'Phục vụ',
    };
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    const userAvatar = document.querySelector('.user-avatar');

    if (userName) userName.textContent = user.full_name;
    if (userRole) userRole.textContent = roleLabel[user.role] || user.role;
    if (userAvatar) {
        userAvatar.textContent = user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    }
}

import { initSearch } from './search';

/* ── Initialization ── */
document.addEventListener('DOMContentLoaded', () => {
    // Theme initialization
    initTheme();

    // Route handling
    window.addEventListener('hashchange', handleRoute);

    // Fetch data before first render
    import('./data').then((dataModule) => {
        dataModule.fetchDB().then(() => {
            handleRoute();
            initSearch();
            if (dataModule.lastFetchError) {
                showToast('Không tải được dữ liệu từ API. Kiểm tra backend và SQL Server.', 'warning');
            }
        });
    });

    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

    // Notifications toggle
    document.getElementById('notificationBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotifications();
    });

    // Logout trigger
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bạn có muốn đăng xuất?')) {
            logout();
        }
    });

    // Modal overlay click to close
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Mobile menu toggle
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        $sidebar().classList.toggle('open');
        document.getElementById('sidebarBackdrop')?.classList.toggle('active');
    });

    // Close sidebar when clicking backdrop
    document.getElementById('sidebarBackdrop')?.addEventListener('click', () => {
        $sidebar().classList.remove('open');
        document.getElementById('sidebarBackdrop')?.classList.remove('active');
    });
});
