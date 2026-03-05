import { login, navigateTo, showToast } from '../ui';
import { apiPost } from '../api';
import { fetchDB } from '../data';
import type { Employee } from '../types';

export function renderLoginPage(): string {
    return `
        <div class="login-container">
            <div class="login-card glass-panel">
                <div class="login-header">
                    <div class="logo">
                        <span class="logo-icon">◆</span>
                        <span class="logo-text">LuxStay</span>
                    </div>
                    <h1>Chào mừng trở lại</h1>
                    <p>Vui lòng đăng nhập để tiếp tục</p>
                </div>
                <form id="loginForm" class="login-form">
                    <div class="form-group">
                        <label for="username">Tên đăng nhập</label>
                        <input type="text" id="username" placeholder="Nhập username" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="password">Mật khẩu</label>
                        <input type="password" id="password" placeholder="••••••••" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" id="loginBtn">Đăng nhập</button>
                    
                    <div class="login-help">
                        <span>Quên mật khẩu? Liên hệ quản lý.</span>
                    </div>
                </form>
            </div>
        </div>
    `;
}

export function initLoginPage(): void {
    const form = document.getElementById('loginForm') as HTMLFormElement;
    const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = (document.getElementById('username') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;

        loginBtn.disabled = true;
        loginBtn.textContent = 'Đang xử lý...';

        try {
            const user = await apiPost<Employee>('/login', { username, password });

            if (user && user.emp_id) {
                login(user); // Save to localStorage via ui.ts

                // Refresh data to ensure all permissions and states are correct
                await fetchDB();

                showToast('Đăng nhập thành công!', 'success');

                // Redirect based on role
                if (user.role === 'Housekeeper') {
                    navigateTo('rooms');
                } else {
                    navigateTo('dashboard');
                }

                // Re-render sidebar/header state by triggering route
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                throw new Error('Đăng nhập thất bại');
            }
        } catch (error) {
            showToast('Tên đăng nhập hoặc mật khẩu không đúng.', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Đăng nhập';
        }
    });
}
