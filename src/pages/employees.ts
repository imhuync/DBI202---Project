import { DB, getInitials, fetchDB } from '../data';
import { showModal, closeModal, showToast, navigateTo, getCurrentUser } from '../ui';
import { apiPost, apiFetch } from '../api';

const roleBadge: Record<string, string> = { Manager: 'badge-primary', Receptionist: 'badge-info', Housekeeper: 'badge-warning', Admin: 'badge-danger' };
const roleLabel: Record<string, string> = { Manager: 'Quản lý', Receptionist: 'Lễ tân', Housekeeper: 'Phục vụ', Admin: 'Admin' };

export function renderEmployees(): string {
  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="filter-group">
          <button class="filter-btn active" data-emp-filter="all">Tất cả</button>
          <button class="filter-btn" data-emp-filter="Manager">Quản lý</button>
          <button class="filter-btn" data-emp-filter="Receptionist">Lễ tân</button>
          <button class="filter-btn" data-emp-filter="Housekeeper">Phục vụ</button>
        </div>
      </div>
      <button class="btn btn-primary" id="addEmpBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm nhân viên
      </button>
    </div>

    <div class="employee-grid" id="empGrid">${renderEmpCards(DB.employees)}</div>

    <div class="section-panel glass-panel" style="margin-top:var(--space-xl)">
      <div class="section-header"><div><h3 class="section-title">Danh sách nhân viên</h3><p class="section-subtitle">Chi tiết</p></div></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Mã</th><th>Họ tên</th><th>Chức vụ</th><th>Tài khoản</th><th>Bookings</th><th>Thao tác</th></tr></thead>
          <tbody id="empTableBody">${renderEmpRows(DB.employees)}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderEmpCards(emps: typeof DB.employees): string {
  return emps.map(e => {
    const bookingCount = DB.bookings.filter(b => b.emp_id === e.emp_id).length;
    return `<div class="employee-card glass-panel">
      <div class="entity-avatar" style="width:56px;height:56px;font-size:var(--font-lg);margin-bottom:var(--space-sm)">${getInitials(e.full_name)}</div>
      <div style="font-weight:600;margin-bottom:var(--space-xs)">${e.full_name}</div>
      <span class="badge ${roleBadge[e.role]}" style="margin-bottom:var(--space-sm)">${roleLabel[e.role] || e.role}</span>
      <div style="font-size:var(--font-xs);color:var(--text-secondary)">${bookingCount} booking đã xử lý</div>
    </div>`;
  }).join('');
}

function renderEmpRows(emps: typeof DB.employees): string {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';
  return emps.map(e => {
    const bookingCount = DB.bookings.filter(b => b.emp_id === e.emp_id).length;
    // Manager không thể sửa/xóa tài khoản Admin
    const canEdit = isAdmin || e.role !== 'Admin';
    return `<tr>
      <td><strong>#${e.emp_id}</strong></td>
      <td><div class="entity-name"><div class="entity-avatar">${getInitials(e.full_name)}</div>${e.full_name}</div></td>
      <td><span class="badge ${roleBadge[e.role]}">${roleLabel[e.role] || e.role}</span></td>
      <td><code style="color:var(--text-secondary);font-size:var(--font-xs)">${e.username}</code></td>
      <td>${bookingCount}</td>
      <td>
        <div class="action-btns">
          ${canEdit ? `
          <button class="action-btn edit" data-edit-emp="${e.emp_id}" title="Sửa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn reset" data-reset-pass="${e.emp_id}" title="Đặt lại mật khẩu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>
          </button>
          <button class="action-btn delete" data-delete-emp="${e.emp_id}" title="Xóa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>` : `<span style="font-size:var(--font-xs);color:var(--text-secondary);font-style:italic">Bảo vệ</span>`}
        </div>
      </td>
    </tr>`;
  }).join('');
}

export function initEmployeesEvents(): void {
  document.querySelectorAll<HTMLElement>('[data-emp-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.empFilter!;
      const filtered = f === 'all' ? DB.employees : DB.employees.filter(e => e.role === f);
      document.getElementById('empGrid')!.innerHTML = renderEmpCards(filtered);
      document.getElementById('empTableBody')!.innerHTML = renderEmpRows(filtered);
      bindEmpActions();
    });
  });

  document.getElementById('addEmpBtn')?.addEventListener('click', () => openEmpModal());
  bindEmpActions();
}

function bindEmpActions(): void {
  document.querySelectorAll<HTMLElement>('[data-edit-emp]').forEach(btn => {
    btn.addEventListener('click', () => openEmpModal(parseInt(btn.dataset.editEmp!)));
  });
  document.querySelectorAll<HTMLElement>('[data-reset-pass]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.resetPass!);
      const emp = DB.employees.find(e => e.emp_id === id);
      if (!emp) return;

      showModal(`Đặt lại mật khẩu cho ${emp.full_name}`, `
        <div class="form-group">
          <label class="form-label">Mật khẩu mới</label>
          <input class="form-input" type="password" id="resetNewPass" placeholder="••••••••">
        </div>
      `, async () => {
        const newPass = (document.getElementById('resetNewPass') as HTMLInputElement).value;
        if (newPass.length < 3) {
          showToast('Mật khẩu phải có ít nhất 3 ký tự', 'error');
          return;
        }
        try {
          await apiPost('/employees/reset-password', { emp_id: emp.emp_id, password_hash: newPass });
          showToast(`Đã đặt lại mật khẩu cho ${emp.full_name}`, 'success');
          closeModal();
        } catch (err) {
          showToast('Lỗi khi đặt lại mật khẩu', 'error');
        }
      });
    });
  });

  document.querySelectorAll<HTMLElement>('[data-delete-emp]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
      const id = parseInt(btn.dataset.deleteEmp!);
      try {
        await apiFetch(`/employees/${id}`, { method: 'DELETE' });
        await fetchDB();
        showToast('Đã xóa nhân viên', 'info');
        navigateTo('employees');
      } catch (err) {
        showToast('Lỗi khi xóa nhân viên', 'error');
      }
    });
  });
}

function openEmpModal(id?: number): void {
  const emp = id ? DB.employees.find(e => e.emp_id === id) : null;
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';
  showModal(emp ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới', `
    <div class="form-group"><label class="form-label">Họ tên *</label><input class="form-input" id="empName" value="${emp?.full_name || ''}"></div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Chức vụ</label>
        <select class="form-select" id="empRole">
          <option value="Receptionist" ${(!emp || emp.role === 'Receptionist') ? 'selected' : ''}>Lễ tân</option>
          <option value="Manager" ${emp?.role === 'Manager' ? 'selected' : ''}>Quản lý</option>
          <option value="Housekeeper" ${emp?.role === 'Housekeeper' ? 'selected' : ''}>Phục vụ</option>
          ${isAdmin ? `<option value="Admin" ${emp?.role === 'Admin' ? 'selected' : ''}>Admin</option>` : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Tài khoản</label><input class="form-input" id="empUsername" value="${emp?.username || ''}"></div>
    </div>
  `, async () => {
    const name = (document.getElementById('empName') as HTMLInputElement).value.trim();
    if (!name) { showToast('Vui lòng nhập họ tên', 'error'); return; }
    const role = (document.getElementById('empRole') as HTMLSelectElement).value;
    const username = (document.getElementById('empUsername') as HTMLInputElement).value.trim();

    try {
      if (emp) {
        await apiPost('/employees/update', { emp_id: emp.emp_id, full_name: name, role, username });
        showToast('Cập nhật nhân viên thành công!', 'success');
      } else {
        await apiPost('/employees', { full_name: name, role, username, password_hash: '123' }); // Default pass
        showToast('Thêm nhân viên thành công!', 'success');
      }
      await fetchDB();
      closeModal(); navigateTo('employees');
    } catch (err) {
      showToast('Lỗi khi lưu nhân viên', 'error');
    }
  });
}
