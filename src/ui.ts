/* =============================================
   ui.ts — Shared UI Utilities
   ============================================= */
import type { PageName, Employee } from './types';
import { DB, formatDateTime } from './data';
import { apiPost } from './api';

/* ── DOM references ── */
const $overlay = () => document.getElementById('modalOverlay')!;
const $modal = () => document.getElementById('modalContent')!;
const $toasts = () => document.getElementById('toastContainer')!;

/* ── Navigation ── */
export function navigateTo(page: PageName): void {
    if (window.location.hash === `#${page}`) {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
        window.location.hash = `#${page}`;
    }
}

/* ── Modal System ── */
export function showModal(title: string, body: string, onSave?: () => void): void {
    $modal().innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close" id="modalCloseBtn">&times;</button>
    </div>
    <div class="modal-body">${body}</div>
    ${onSave ? `<div class="modal-footer">
      <button class="btn btn-secondary" id="modalCancelBtn">Hủy</button>
      <button class="btn btn-primary" id="modalSaveBtn">Lưu</button>
    </div>` : ''}
  `;
    $overlay().classList.add('active');

    document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
    document.getElementById('modalCancelBtn')?.addEventListener('click', closeModal);
    if (onSave) {
        document.getElementById('modalSaveBtn')?.addEventListener('click', onSave);
    }
}

export function closeModal(): void {
    $overlay().classList.remove('active');
}

/* ── Toast Notifications ── */
export function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons: Record<string, string> = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    };

    toast.innerHTML = `<div class="toast-icon">${icons[type]}</div><div class="toast-message">${message}</div>`;
    $toasts().appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ── Theme Management ── */
export function initTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
        updateThemeIcons(true);
    }
}

export function toggleTheme(): void {
    const isLight = document.documentElement.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeIcons(isLight);
}

function updateThemeIcons(isLight: boolean): void {
    const sunIcon = document.querySelector('.sun-icon') as HTMLElement;
    const moonIcon = document.querySelector('.moon-icon') as HTMLElement;
    if (sunIcon && moonIcon) {
        sunIcon.style.display = isLight ? 'none' : 'block';
        moonIcon.style.display = isLight ? 'block' : 'none';
    }
}

/* ── Notifications ── */
export function toggleNotifications(): void {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown?.classList.toggle('active');
    if (dropdown?.classList.contains('active')) {
        renderNotifications();
        // Hide badge after reading
        const badge = document.querySelector('.notification-badge');
        if (badge) (badge as HTMLElement).style.display = 'none';
    }
}

export function renderNotifications(): void {
    const list = document.getElementById('notificationList');
    if (!list) return;

    // Derive "notifications" from recent data
    const recentBookings = [...DB.bookings].sort((a, b) =>
        new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
    ).slice(0, 5);

    list.innerHTML = recentBookings.map(b => {
        const guest = DB.guests.find(g => g.guest_id === b.guest_id);
        return `
            <div class="notification-item">
                <div class="notification-item-icon" style="background: rgba(108, 99, 255, 0.1); color: var(--accent-primary);">
                    📅
                </div>
                <div class="notification-item-content">
                    <div class="notification-item-text">
                        <strong>${guest?.full_name}</strong> đã đặt phòng mới.
                    </div>
                    <div class="notification-item-time">${formatDateTime(b.booking_date)}</div>
                </div>
            </div>
        `;
    }).join('');

    if (recentBookings.length === 0) {
        list.innerHTML = '<div class="notification-item"><div class="notification-item-text">Không có thông báo mới</div></div>';
    }
}

// Close notifications when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notificationBtn');
    if (dropdown?.classList.contains('active') && !dropdown.contains(e.target as Node) && !btn?.contains(e.target as Node)) {
        dropdown.classList.remove('active');
    }
});

/* ── Authentication & RBAC ── */
export function getCurrentUser(): Employee | null {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Phân quyền truy cập trang theo vai trò:
 * - Admin (Quản trị viên): Toàn quyền tuyệt đối — truy cập tất cả trang,
 *   có thể tạo/sửa/xóa tài khoản Admin khác.
 * - Manager (Quản lý): Truy cập tất cả trang, nhưng KHÔNG thể
 *   sửa/xóa tài khoản Admin hoặc tạo nhân viên với role Admin.
 * - Receptionist (Lễ tân): Truy cập tất cả trang trừ 'employees'.
 * - Housekeeper (Phục vụ): Chỉ truy cập 'dashboard' và 'rooms'.
 */
export function checkPermission(page: PageName): boolean {
    const user = getCurrentUser();
    if (!user) return false;

    const role = user.role;

    // Admin: toàn quyền tuyệt đối
    if (role === 'Admin') return true;

    // Manager: quản lý toàn bộ nghiệp vụ (giới hạn quản trị tài khoản Admin được xử lý ở employees.ts)
    if (role === 'Manager') return true;

    if (role === 'Receptionist') {
        return page !== 'employees';
    }

    if (role === 'Housekeeper') {
        return page === 'dashboard' || page === 'rooms';
    }

    return false;
}

/** Kiểm tra xem user hiện tại có phải Admin không (quyền cao nhất) */
export function isAdminUser(): boolean {
    return getCurrentUser()?.role === 'Admin';
}

export function login(user: Employee): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

export function logout(): void {
    localStorage.removeItem('currentUser');
    window.location.hash = '#login';
}

export function showChangePasswordModal(): void {
    const user = getCurrentUser();
    if (!user) return;

    const modalBody = `
        <form id="changePasswordForm" class="modal-form">
            <div class="form-group">
                <label>Mật khẩu hiện tại</label>
                <input type="password" id="currentPassword" required placeholder="••••••••">
            </div>
            <div class="form-group">
                <label>Mật khẩu mới</label>
                <input type="password" id="newPassword" required placeholder="••••••••">
            </div>
            <div class="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input type="password" id="confirmPassword" required placeholder="••••••••">
            </div>
        </form>
    `;

    showModal('Đổi mật khẩu', modalBody, async () => {
        const current = (document.getElementById('currentPassword') as HTMLInputElement).value;
        const newPass = (document.getElementById('newPassword') as HTMLInputElement).value;
        const confirm = (document.getElementById('confirmPassword') as HTMLInputElement).value;

        if (newPass !== confirm) {
            showToast('Mật khẩu xác nhận không khớp.', 'error');
            return;
        }

        if (newPass.length < 3) {
            showToast('Mật khẩu mới phải có ít nhất 3 ký tự.', 'error');
            return;
        }

        try {
            await apiPost('/employees/change-password', {
                emp_id: user.emp_id,
                current_password: current,
                new_password: newPass
            });

            showToast('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.', 'success');
            closeModal();
            setTimeout(() => logout(), 1500);
        } catch (error) {
            showToast('Mật khẩu hiện tại không đúng hoặc lỗi hệ thống.', 'error');
        }
    });
}
