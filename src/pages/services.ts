import { DB, formatVND, formatDateTime, getService, fetchDB } from '../data';
import { showModal, closeModal, showToast, navigateTo } from '../ui';
import { apiPost, apiFetch } from '../api';

export function renderServices(): string {
  return `
    <div class="page-header">
      <div class="page-header-left"><div><h3 style="margin:0">Danh mục dịch vụ</h3><p style="margin:0;color:var(--text-secondary);font-size:var(--font-sm)">Quản lý dịch vụ khách sạn</p></div></div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="addUsageBtn">Ghi nhận sử dụng</button>
        <button class="btn btn-primary" id="addServiceBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm dịch vụ
        </button>
      </div>
    </div>

    <div class="services-grid">
      ${DB.services.map(s => `
        <div class="service-card glass-panel" data-edit-service="${s.service_id}" style="position:relative">
          <button class="action-btn delete" data-delete-service="${s.service_id}" title="Xóa dịch vụ" style="position:absolute;top:8px;right:8px;width:28px;height:28px;padding:0;opacity:0.7">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
          <div class="service-icon">${getServiceIcon(s.service_name)}</div>
          <div class="service-name">${s.service_name}</div>
          <div class="service-price">${formatVND(s.unit_price)} / ${s.unit}</div>
        </div>
      `).join('')}
    </div>

    <div class="section-panel glass-panel" style="margin-top: var(--space-xl)">
      <div class="section-header"><div><h3 class="section-title">Lịch sử sử dụng dịch vụ</h3><p class="section-subtitle">Gần đây nhất</p></div></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Mã</th><th>Dịch vụ</th><th>SL</th><th>Thành tiền</th><th>Thời gian</th></tr></thead>
          <tbody>
            ${[...DB.serviceUsages].sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()).map(u => {
    const svc = getService(u.service_id);
    return `<tr>
                <td>#${u.usage_id}</td>
                <td><strong>${svc.service_name}</strong></td>
                <td>${u.quantity} ${svc.unit}</td>
                <td>${formatVND(u.total_price)}</td>
                <td>${formatDateTime(u.used_at)}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getServiceIcon(name: string): string {
  const icons: Record<string, string> = { 'Giặt ủi': '👕', 'Minibar - Nước ngọt': '🥤', 'Minibar - Bia': '🍺', 'Bữa sáng buffet': '🍳', 'Spa & Massage': '💆', 'Xe đưa đón sân bay': '🚗', 'Phòng gym': '🏋️', 'Thuê xe máy': '🏍️' };
  return icons[name] || '🛎️';
}

export function initServicesEvents(): void {
  document.getElementById('addServiceBtn')?.addEventListener('click', () => {
    showModal('Thêm dịch vụ mới', `
      <div class="form-group"><label class="form-label">Tên dịch vụ *</label><input class="form-input" id="svcName" placeholder="Tên dịch vụ"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Đơn giá *</label><input class="form-input" id="svcPrice" type="number" placeholder="100000"></div>
        <div class="form-group"><label class="form-label">Đơn vị *</label><input class="form-input" id="svcUnit" placeholder="Lần, Giờ, Kg..."></div>
      </div>
    `, async () => {
      const name = (document.getElementById('svcName') as HTMLInputElement).value.trim();
      const price = parseInt((document.getElementById('svcPrice') as HTMLInputElement).value);
      const unit = (document.getElementById('svcUnit') as HTMLInputElement).value.trim();
      if (!name || !price || !unit) { showToast('Vui lòng điền đầy đủ thông tin', 'error'); return; }

      try {
        await apiPost('/services', { service_name: name, unit_price: price, unit });
        await fetchDB();
        showToast('Thêm dịch vụ thành công!', 'success');
        closeModal(); navigateTo('services');
      } catch (err) {
        showToast('Lỗi khi thêm dịch vụ', 'error');
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-edit-service]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Không mở modal sửa nếu click vào nút xóa
      if ((e.target as HTMLElement).closest('[data-delete-service]')) return;
      const svc = DB.services.find(s => s.service_id === parseInt(card.dataset.editService!))!;
      showModal(`Sửa dịch vụ — ${svc.service_name}`, `
        <div class="form-group"><label class="form-label">Tên dịch vụ</label><input class="form-input" id="editSvcName" value="${svc.service_name}"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Đơn giá</label><input class="form-input" id="editSvcPrice" type="number" value="${svc.unit_price}"></div>
          <div class="form-group"><label class="form-label">Đơn vị</label><input class="form-input" id="editSvcUnit" value="${svc.unit}"></div>
        </div>
      `, async () => {
        const name = (document.getElementById('editSvcName') as HTMLInputElement).value.trim();
        const price = parseInt((document.getElementById('editSvcPrice') as HTMLInputElement).value);
        const unit = (document.getElementById('editSvcUnit') as HTMLInputElement).value.trim();

        try {
          await apiPost('/services/update', { service_id: svc.service_id, service_name: name, unit_price: price, unit });
          await fetchDB();
          showToast('Cập nhật dịch vụ thành công!', 'success');
          closeModal(); navigateTo('services');
        } catch (err) {
          showToast('Lỗi khi cập nhật dịch vụ', 'error');
        }
      });
    });
  });

  // Delete Service
  document.querySelectorAll<HTMLElement>('[data-delete-service]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.deleteService!);
      const svc = DB.services.find(s => s.service_id === id);
      if (!svc) return;
      if (!confirm(`Bạn có chắc muốn xóa dịch vụ "${svc.service_name}"?`)) return;
      try {
        await apiFetch(`/services/${id}`, { method: 'DELETE' });
        await fetchDB();
        showToast('Đã xóa dịch vụ thành công!', 'info');
        navigateTo('services');
      } catch (err: any) {
        showToast(err.message || 'Lỗi khi xóa dịch vụ', 'error');
      }
    });
  });

  document.getElementById('addUsageBtn')?.addEventListener('click', () => {
    const activeDetails = DB.bookingDetails.filter(d => d.actual_checkin && !d.actual_checkout);
    showModal('Ghi nhận sử dụng dịch vụ', `
      <div class="form-group">
        <label class="form-label">Booking Detail *</label>
        <select class="form-select" id="usageBDId">
          ${activeDetails.map(d => {
      const room = DB.rooms.find(r => r.room_id === d.room_id)!;
      const booking = DB.bookings.find(b => b.booking_id === d.booking_id)!;
      const guest = DB.guests.find(g => g.guest_id === booking.guest_id)!;
      return `<option value="${d.detail_id}">Phòng ${room.room_number} — ${guest.full_name} (Booking #${d.booking_id})</option>`;
    }).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Dịch vụ *</label>
        <select class="form-select" id="usageSvcId">${DB.services.map(s => `<option value="${s.service_id}">${s.service_name} — ${formatVND(s.unit_price)}/${s.unit}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Số lượng</label><input class="form-input" id="usageQty" type="number" min="1" value="1"></div>
    `, async () => {
      const bdId = parseInt((document.getElementById('usageBDId') as HTMLSelectElement).value);
      const svcId = parseInt((document.getElementById('usageSvcId') as HTMLSelectElement).value);
      const qty = parseInt((document.getElementById('usageQty') as HTMLInputElement).value);
      if (!qty || qty < 1) { showToast('Số lượng không hợp lệ', 'error'); return; }

      try {
        await apiPost('/service-usages', { booking_detail_id: bdId, service_id: svcId, quantity: qty });
        await fetchDB();
        showToast('Ghi nhận sử dụng dịch vụ thành công!', 'success');
        closeModal(); navigateTo('services');
      } catch (err) {
        showToast('Lỗi khi ghi nhận sử dụng dịch vụ', 'error');
      }
    });
  });
}
