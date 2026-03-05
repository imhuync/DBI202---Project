import { DB, getInitials, fetchDB } from '../data';
import { showModal, closeModal, showToast, navigateTo } from '../ui';
import type { Guest } from '../types';
import { apiPost, apiFetch } from '../api';

export function renderGuests(): string {
  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="filter-group">
          <button class="filter-btn active" data-guest-filter="all">Tất cả</button>
          <button class="filter-btn" data-guest-filter="Vietnam">Việt Nam</button>
          <button class="filter-btn" data-guest-filter="foreign">Nước ngoài</button>
        </div>
      </div>
      <button class="btn btn-primary" id="addGuestBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm khách
      </button>
    </div>
    <div class="section-panel glass-panel">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>CMND/CCCD</th><th>Quốc tịch</th><th>Thao tác</th></tr></thead>
          <tbody id="guestTableBody">${renderGuestRows(DB.guests)}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderGuestRows(guests: Guest[]): string {
  return guests.map(g => {
    const ac = g.nationality !== 'Vietnam' ? 'green' : '';
    return `<tr>
      <td data-label="ID"><strong>#${g.guest_id}</strong></td>
      <td data-label="Họ tên"><div class="entity-name"><div class="entity-avatar ${ac}">${getInitials(g.full_name)}</div>${g.full_name}</div></td>
      <td data-label="Email">${g.email || ''}</td>
      <td data-label="Điện thoại">${g.phone || ''}</td>
      <td data-label="CMND/CCCD"><code style="color:var(--text-secondary);font-size:var(--font-xs)">${g.id_card}</code></td>
      <td data-label="Quốc tịch"><span class="badge ${g.nationality === 'Vietnam' ? 'badge-info' : 'badge-primary'}">${g.nationality}</span></td>
      <td data-label="Thao tác">
        <div class="action-btns">
          <button class="action-btn edit" data-edit-guest="${g.guest_id}" title="Sửa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn delete" data-delete-guest="${g.guest_id}" title="Xóa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openGuestModal(id?: number): void {
  const guest = id ? DB.guests.find(g => g.guest_id === id) : null;
  const title = guest ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới';

  showModal(title, `
    <div class="form-group">
      <label class="form-label">Họ tên *</label>
      <input class="form-input" id="guestName" value="${guest ? guest.full_name : ''}" placeholder="Nguyễn Văn A">
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="guestEmail" type="email" value="${guest ? guest.email : ''}" placeholder="email@example.com"></div>
      <div class="form-group"><label class="form-label">Điện thoại</label><input class="form-input" id="guestPhone" value="${guest ? guest.phone : ''}" placeholder="0901234567"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">CMND/CCCD *</label><input class="form-input" id="guestIdCard" value="${guest ? guest.id_card : ''}" placeholder="001099012345"></div>
      <div class="form-group">
        <label class="form-label">Quốc tịch</label>
        <select class="form-select" id="guestNationality">
          <option value="Vietnam" ${(!guest || guest.nationality === 'Vietnam') ? 'selected' : ''}>Vietnam</option>
          <option value="USA" ${guest?.nationality === 'USA' ? 'selected' : ''}>USA</option>
          <option value="Japan" ${guest?.nationality === 'Japan' ? 'selected' : ''}>Japan</option>
          <option value="Korea" ${guest?.nationality === 'Korea' ? 'selected' : ''}>Korea</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>
  `, async () => {
    const name = (document.getElementById('guestName') as HTMLInputElement).value.trim();
    const idCard = (document.getElementById('guestIdCard') as HTMLInputElement).value.trim();
    const email = (document.getElementById('guestEmail') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('guestPhone') as HTMLInputElement).value.trim();
    const nationality = (document.getElementById('guestNationality') as HTMLSelectElement).value;

    if (!name || !idCard) { showToast('Vui lòng điền họ tên và CMND/CCCD', 'error'); return; }

    try {
      if (guest) {
        await apiPost(`/guests/update`, { guest_id: guest.guest_id, full_name: name, email, phone, id_card: idCard, nationality });
        showToast('Cập nhật khách hàng thành công!', 'success');
      } else {
        await apiPost('/guests', { full_name: name, email, phone, id_card: idCard, nationality });
        showToast('Thêm khách hàng thành công!', 'success');
      }
      await fetchDB();
      closeModal(); navigateTo('guests');
    } catch (err) {
      showToast('Lỗi khi lưu thông tin khách hàng', 'error');
    }
  });
}

export function initGuestsEvents(): void {
  document.getElementById('addGuestBtn')?.addEventListener('click', () => openGuestModal());

  document.querySelectorAll<HTMLElement>('[data-guest-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.guestFilter!;
      const filtered = f === 'all' ? DB.guests : f === 'Vietnam' ? DB.guests.filter(g => g.nationality === 'Vietnam') : DB.guests.filter(g => g.nationality !== 'Vietnam');
      document.getElementById('guestTableBody')!.innerHTML = renderGuestRows(filtered);
      bindGuestActions();
    });
  });

  bindGuestActions();
}

function bindGuestActions(): void {
  document.querySelectorAll<HTMLElement>('[data-edit-guest]').forEach(btn => {
    btn.addEventListener('click', () => openGuestModal(parseInt(btn.dataset.editGuest!)));
  });
  document.querySelectorAll<HTMLElement>('[data-delete-guest]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn xóa khách hàng này?')) return;
      const gid = parseInt(btn.dataset.deleteGuest!);
      try {
        await apiFetch(`/guests/${gid}`, { method: 'DELETE' });
        await fetchDB();
        showToast('Đã xóa khách hàng', 'info');
        navigateTo('guests');
      } catch (err: any) {
        showToast(err?.message || 'Lỗi khi xóa khách hàng', 'error');
      }
    });
  });
}
