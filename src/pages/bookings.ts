import { DB, formatVND, formatDate, formatDateTime, getGuest, getRoom, getRoomType, getInitials, getService, fetchDB } from '../data';
import { showModal, closeModal, showToast, navigateTo } from '../ui';
import { apiPost } from '../api';

export function renderBookings(): string {
  // ... (keeping same rendering logic)
  const statusCounts: Record<string, number> = { all: DB.bookings.length };
  DB.bookings.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });
  const labels: Record<string, string> = { Pending: 'Pending', Confirmed: 'Confirmed', Completed: 'Completed', Cancelled: 'Cancelled' };

  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="filter-group">
          <button class="filter-btn active" data-booking-filter="all">Tất cả (${statusCounts.all})</button>
          ${Object.keys(labels).map(s => `<button class="filter-btn" data-booking-filter="${s}">${labels[s]} (${statusCounts[s] || 0})</button>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary" id="addBookingBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tạo booking
      </button>
    </div>
    <div class="section-panel glass-panel">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Mã</th><th>Khách hàng</th><th>Phòng</th><th>Check-in</th><th>Check-out</th><th>Tiền cọc</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody id="bookingTableBody">${renderBookingRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderBookingRows(filter?: string): string {
  const bookings = filter && filter !== 'all' ? DB.bookings.filter(b => b.status === filter) : DB.bookings;
  const badgeMap: Record<string, string> = { Confirmed: 'badge-success', Pending: 'badge-warning', Completed: 'badge-info', Cancelled: 'badge-danger' };

  return bookings.map(b => {
    const guest = getGuest(b.guest_id);
    const details = DB.bookingDetails.filter(d => d.booking_id === b.booking_id);
    const rooms = details.map(d => getRoom(d.room_id));
    const roomNums = rooms.map(r => r.room_number).join(', ') || '—';
    const canConfirm = b.status === 'Pending';
    const canCancel = b.status === 'Pending' || b.status === 'Confirmed';

    return `<tr>
      <td data-label="Mã"><strong>#${b.booking_id}</strong></td>
      <td data-label="Khách hàng">
        <div class="entity-name">
          <div class="entity-avatar">${getInitials(guest.full_name)}</div>
          <div><div>${guest.full_name}</div><div style="font-size:var(--font-xs);color:var(--text-secondary)">${guest.phone}</div></div>
        </div>
      </td>
      <td data-label="Phòng"><strong>${roomNums}</strong></td>
      <td data-label="Check-in">${formatDate(b.expected_checkin)}</td>
      <td data-label="Check-out">${formatDate(b.expected_checkout)}</td>
      <td data-label="Tiền cọc">${b.total_deposit ? formatVND(b.total_deposit) : '—'}</td>
      <td data-label="Trạng thái"><span class="badge ${badgeMap[b.status]}">${b.status}</span></td>
      <td data-label="Thao tác">
        <div class="action-btns">
          <button class="action-btn" data-view-booking="${b.booking_id}" title="Chi tiết">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${canConfirm ? `<button class="action-btn" data-confirm-booking="${b.booking_id}" title="Xác nhận"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></button>` : ''}
          ${canCancel ? `<button class="action-btn delete" data-cancel-booking="${b.booking_id}" title="Hủy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

export function initBookingsEvents(): void {
  // Filters
  document.querySelectorAll<HTMLElement>('[data-booking-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('bookingTableBody')!.innerHTML = renderBookingRows(btn.dataset.bookingFilter);
      bindBookingActions();
    });
  });

  // Add booking
  document.getElementById('addBookingBtn')?.addEventListener('click', () => {
    showModal('Tạo booking mới', `
      <div class="form-group">
        <label class="form-label">Khách hàng *</label>
        <select class="form-select" id="bookGuestId">${DB.guests.map(g => `<option value="${g.guest_id}">${g.full_name} — ${g.phone}</option>`).join('')}</select>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Check-in *</label><input class="form-input" id="bookCheckin" type="date"></div>
        <div class="form-group"><label class="form-label">Check-out *</label><input class="form-input" id="bookCheckout" type="date"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Phòng</label>
        <div class="room-select-grid" id="roomSelectGrid">
          ${DB.rooms.filter(r => r.status === 'Clean').map(r => {
      const type = getRoomType(r);
      return `<label class="room-select-item glass-panel-sm"><input type="checkbox" value="${r.room_id}"><span>${r.room_number} — ${type.type_name}<br><small>${formatVND(type.base_price)}</small></span></label>`;
    }).join('')}
        </div>
      </div>
      <div class="form-group"><label class="form-label">Tiền cọc</label><input class="form-input" id="bookDeposit" type="number" value="0"></div>
    `, async () => {
      const gid = parseInt((document.getElementById('bookGuestId') as HTMLSelectElement).value);
      const ci = (document.getElementById('bookCheckin') as HTMLInputElement).value;
      const co = (document.getElementById('bookCheckout') as HTMLInputElement).value;
      const selectedRooms = [...document.querySelectorAll<HTMLInputElement>('#roomSelectGrid input:checked')].map(i => parseInt(i.value));
      const deposit = parseInt((document.getElementById('bookDeposit') as HTMLInputElement).value) || 0;

      if (!ci || !co) { showToast('Vui lòng chọn ngày check-in/check-out', 'error'); return; }
      if (selectedRooms.length === 0) { showToast('Vui lòng chọn ít nhất 1 phòng', 'error'); return; }

      try {
        const { booking_id } = await apiPost<{ booking_id: number }>('/bookings', {
          guest_id: gid,
          emp_id: 2, // Mock current user
          expected_checkin: ci + ' 14:00',
          expected_checkout: co + ' 12:00',
          total_deposit: deposit,
          rooms: selectedRooms // We'll need to handle detail insertion in backend or separate calls
        });

        await fetchDB();
        showToast(`Tạo booking #${booking_id} thành công!`, 'success');
        closeModal(); navigateTo('bookings');
      } catch (err) {
        showToast('Lỗi khi tạo booking', 'error');
      }
    });
  });

  bindBookingActions();
}

function bindBookingActions(): void {
  // ... (keeping same detail view)
  document.querySelectorAll<HTMLElement>('[data-view-booking]').forEach(btn => {
    btn.addEventListener('click', () => {
      const bid = parseInt(btn.dataset.viewBooking!);
      const b = DB.bookings.find(bk => bk.booking_id === bid)!;
      const guest = getGuest(b.guest_id);
      const details = DB.bookingDetails.filter(d => d.booking_id === bid);
      const usages = details.flatMap(d => DB.serviceUsages.filter(su => su.booking_detail_id === d.detail_id));

      showModal(`Chi tiết booking #${bid}`, `
        <div class="form-row">
          <div class="form-group"><label class="form-label">Khách hàng</label><div class="entity-name"><div class="entity-avatar">${getInitials(guest.full_name)}</div>${guest.full_name}</div></div>
          <div class="form-group"><label class="form-label">Trạng thái</label><div><span class="badge ${b.status === 'Confirmed' ? 'badge-success' : b.status === 'Pending' ? 'badge-warning' : b.status === 'Completed' ? 'badge-info' : 'badge-danger'}">${b.status}</span></div></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Check-in</label><div>${formatDateTime(b.expected_checkin)}</div></div>
          <div class="form-group"><label class="form-label">Check-out</label><div>${formatDateTime(b.expected_checkout)}</div></div>
        </div>
        <h4 style="margin:var(--space-md) 0 var(--space-sm)">Phòng (${details.length}):</h4>
        <div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Phòng</th><th>Loại</th><th>Giá booking</th><th>Check-in thực tế</th></tr></thead><tbody>
          ${details.map(d => { const r = getRoom(d.room_id); const t = getRoomType(r); return `<tr><td data-label="Phòng"><strong>${r.room_number || '?'}</strong></td><td data-label="Loại">${t?.type_name || '?'}</td><td data-label="Giá booking">${formatVND(d.price_at_booking)}</td><td data-label="Check-in thực tế">${formatDateTime(d.actual_checkin)}</td></tr>`; }).join('')}
        </tbody></table></div>
        ${usages.length ? `
          <h4 style="margin:var(--space-md) 0 var(--space-sm)">Dịch vụ sử dụng (${usages.length}):</h4>
          <div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Dịch vụ</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody>
            ${usages.map(u => { const s = getService(u.service_id); return `<tr><td data-label="Dịch vụ">${s.service_name}</td><td data-label="SL">${u.quantity}</td><td data-label="Thành tiền">${formatVND(u.total_price)}</td></tr>`; }).join('')}
          </tbody></table></div>` : ''}
      `);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-confirm-booking]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const bid = parseInt(btn.dataset.confirmBooking!);
      if (!confirm(`Bạn có chắc muốn xác nhận booking #${bid}?`)) return;
      try {
        await apiPost('/bookings/confirm', { booking_id: bid });
        await fetchDB();
        showToast(`Booking #${bid} đã được xác nhận!`, 'success');
        navigateTo('bookings');
      } catch (err) {
        showToast('Lỗi khi xác nhận booking', 'error');
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-cancel-booking]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn hủy booking này?')) return;
      const bid = parseInt(btn.dataset.cancelBooking!);
      try {
        await apiPost('/bookings/cancel', { booking_id: bid });
        await fetchDB();
        showToast(`Booking #${bid} đã hủy thành công!`, 'info');
        navigateTo('bookings');
      } catch (err) {
        showToast('Lỗi khi hủy booking', 'error');
      }
    });
  });
}
