import { DB, formatVND, formatDateTime, getRoomType, getRoom, getGuest, getInitials, fetchDB } from '../data';
import { showModal, closeModal, showToast, navigateTo } from '../ui';
import { apiPost } from '../api';

export function renderRooms(): string {
  const floors = [...new Set(DB.rooms.map(r => r.floor))].sort((a, b) => a - b);
  const statusLabel: Record<string, string> = { Clean: 'Sạch', Occupied: 'Đang ở', Dirty: 'Cần dọn', Maintenance: 'Bảo trì' };
  const badgeMap: Record<string, string> = { Clean: 'success', Occupied: 'primary', Dirty: 'warning', Maintenance: 'danger' };

  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="status-legend">
          <div class="legend-item"><span class="legend-dot clean"></span> Sạch (${DB.rooms.filter(r => r.status === 'Clean').length})</div>
          <div class="legend-item"><span class="legend-dot occupied"></span> Đang ở (${DB.rooms.filter(r => r.status === 'Occupied').length})</div>
          <div class="legend-item"><span class="legend-dot dirty"></span> Cần dọn (${DB.rooms.filter(r => r.status === 'Dirty').length})</div>
          <div class="legend-item"><span class="legend-dot maintenance"></span> Bảo trì (${DB.rooms.filter(r => r.status === 'Maintenance').length})</div>
        </div>
      </div>
      <button class="btn btn-primary" id="addRoomBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm phòng
      </button>
    </div>

    ${floors.map(floor => `
      <div class="floor-section">
        <div class="floor-label">🏢 Tầng ${floor}</div>
        <div class="room-grid">
          ${DB.rooms.filter(r => r.floor === floor).map(room => {
    const type = getRoomType(room);
    return `<div class="room-card glass-panel status-${room.status.toLowerCase()}" data-room-detail="${room.room_id}">
                      <div class="room-number">${room.room_number}</div>
                      <div class="room-type">${type?.type_name || 'N/A'}</div>
                      <span class="badge badge-${badgeMap[room.status]}">${statusLabel[room.status]}</span>
                    </div>`;
  }).join('')}
        </div>
      </div>
    `).join('')}

    <div class="section-panel glass-panel" style="margin-top: var(--space-xl)">
      <div class="section-header"><div><h3 class="section-title">Danh mục loại phòng</h3><p class="section-subtitle">Bảng giá và thông tin</p></div></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Mã</th><th>Loại phòng</th><th>Giá niêm yết</th><th>Sức chứa</th><th>Mô tả</th><th>Số phòng</th></tr></thead>
          <tbody>
            ${DB.roomTypes.map(rt => {
    const count = DB.rooms.filter(r => r.type_id === rt.type_id).length;
    return `<tr>
                          <td data-label="Mã"><strong>#${rt.type_id}</strong></td>
                          <td data-label="Loại phòng"><span class="badge badge-primary">${rt.type_name}</span></td>
                          <td data-label="Giá niêm yết"><strong>${formatVND(rt.base_price)}</strong></td>
                          <td data-label="Sức chứa">${rt.max_capacity} người</td>
                          <td data-label="Mô tả" style="max-width:250px;color:var(--text-secondary);font-size:var(--font-xs)">${rt.description || ''}</td>
                          <td data-label="Số phòng">${count}</td>
                        </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function initRoomsEvents(): void {
  document.getElementById('addRoomBtn')?.addEventListener('click', () => {
    showModal('Thêm phòng mới', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Số phòng *</label><input class="form-input" id="newRoomNumber" placeholder="401"></div>
        <div class="form-group"><label class="form-label">Tầng *</label><input class="form-input" id="newRoomFloor" type="number" min="1" placeholder="4"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Loại phòng *</label>
        <select class="form-select" id="newRoomType">
          ${DB.roomTypes.map(rt => `<option value="${rt.type_id}">${rt.type_name} — ${formatVND(rt.base_price)}</option>`).join('')}
        </select>
      </div>
    `, async () => {
      const num = (document.getElementById('newRoomNumber') as HTMLInputElement).value.trim();
      const floorInput = (document.getElementById('newRoomFloor') as HTMLInputElement).value;
      const floor = parseInt(floorInput);
      const typeId = parseInt((document.getElementById('newRoomType') as HTMLSelectElement).value);
      if (!num || isNaN(floor)) { showToast('Vui lòng điền đầy đủ thông tin', 'error'); return; }

      try {
        await apiPost('/rooms', { room_number: num, floor, type_id: typeId, status: 'Clean' });
        await fetchDB();
        showToast(`Thêm phòng ${num} thành công!`, 'success');
        closeModal(); navigateTo('rooms');
      } catch (err) {
        showToast('Lỗi khi thêm phòng', 'error');
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-room-detail]').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.roomDetail!);
      const room = getRoom(id);
      if (!room) return;
      const type = getRoomType(room);

      const currentBD = DB.bookingDetails.find(bd => bd.room_id === id && bd.actual_checkin && !bd.actual_checkout);
      let bookingInfo = '';
      if (currentBD) {
        const booking = DB.bookings.find(b => b.booking_id === currentBD.booking_id);
        if (booking) {
          const guest = getGuest(booking.guest_id);
          bookingInfo = `
            <div style="margin-top:var(--space-md);padding:var(--space-md);background:var(--glass-bg);border-radius:var(--radius-md)">
              <div style="font-size:var(--font-xs);color:var(--text-muted);margin-bottom:var(--space-xs)">KHÁCH ĐANG Ở</div>
              <div class="entity-name" style="margin-bottom:var(--space-sm)">
                <div class="entity-avatar">${guest ? getInitials(guest.full_name) : '?'}</div>
                <div><div><strong>${guest ? guest.full_name : 'Unknown'}</strong></div><div style="font-size:var(--font-xs);color:var(--text-secondary)">${guest ? guest.phone : ''}</div></div>
              </div>
              <div style="font-size:var(--font-xs);color:var(--text-secondary)">
                Check-in: ${formatDateTime(currentBD.actual_checkin)}<br>
                Dự kiến trả: ${formatDateTime(booking.expected_checkout)}
              </div>
            </div>`;
        }
      }

      showModal(`Phòng ${room.room_number}`, `
        <div class="form-row">
          <div class="form-group"><label class="form-label">Loại phòng</label><div>${type?.type_name || 'N/A'}</div></div>
          <div class="form-group"><label class="form-label">Giá</label><div style="font-weight:700">${formatVND(type?.base_price || 0)}</div></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Tầng</label><div>${room.floor}</div></div>
          <div class="form-group"><label class="form-label">Sức chứa</label><div>${type?.max_capacity || 0} người</div></div>
        </div>
        <div class="form-group">
          <label class="form-label">Trạng thái</label>
          <select class="form-select" id="roomStatusSelect">
            <option value="Clean" ${room.status === 'Clean' ? 'selected' : ''}>Sạch</option>
            <option value="Occupied" ${room.status === 'Occupied' ? 'selected' : ''}>Đang ở</option>
            <option value="Dirty" ${room.status === 'Dirty' ? 'selected' : ''}>Cần dọn</option>
            <option value="Maintenance" ${room.status === 'Maintenance' ? 'selected' : ''}>Bảo trì</option>
          </select>
        </div>
        ${bookingInfo}
        <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);border-top:1px solid var(--border-color);padding-top:var(--space-md)">
          <button class="btn btn-outline" style="flex:1" id="editRoomBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Chỉnh sửa
          </button>
          <button class="btn btn-outline-danger" style="flex:1" id="deleteRoomBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:4px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Xoá phòng
          </button>
        </div>
      `, async () => {
        const statusSelect = document.getElementById('roomStatusSelect') as HTMLSelectElement;
        const newStatus = statusSelect.value;
        try {
          await apiPost('/rooms/update-status', { room_id: room.room_id, status: newStatus });
          await fetchDB();
          showToast(`Cập nhật trạng thái phòng ${room.room_number}`, 'success');
          closeModal(); navigateTo('rooms');
        } catch (err) {
          showToast('Lỗi khi cập nhật phòng', 'error');
        }
      });

      // Edit Button Logic
      document.getElementById('editRoomBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showModal('Chỉnh sửa phòng', `
          <div class="form-row">
            <div class="form-group"><label class="form-label">Số phòng *</label><input class="form-input" id="editRoomNumber" value="${room.room_number}"></div>
            <div class="form-group"><label class="form-label">Tầng *</label><input class="form-input" id="editRoomFloor" type="number" min="1" value="${room.floor}"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Loại phòng *</label>
            <select class="form-select" id="editRoomType">
              ${DB.roomTypes.map(rt => `<option value="${rt.type_id}" ${rt.type_id === room.type_id ? 'selected' : ''}>${rt.type_name} — ${formatVND(rt.base_price)}</option>`).join('')}
            </select>
          </div>
        `, async () => {
          const num = (document.getElementById('editRoomNumber') as HTMLInputElement).value.trim();
          const floor = parseInt((document.getElementById('editRoomFloor') as HTMLInputElement).value);
          const typeId = parseInt((document.getElementById('editRoomType') as HTMLSelectElement).value);

          if (!num || isNaN(floor)) { showToast('Vui lòng điền đầy đủ thông tin', 'error'); return; }

          try {
            await apiPost('/rooms/update', { room_id: room.room_id, room_number: num, floor, type_id: typeId });
            await fetchDB();
            showToast(`Cập nhật phòng ${num} thành công!`, 'success');
            closeModal(); navigateTo('rooms');
          } catch (err) {
            showToast('Lỗi khi cập nhật phòng', 'error');
          }
        });
      });

      // Delete Button Logic
      document.getElementById('deleteRoomBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Bạn có chắc chắn muốn xoá phòng ${room.room_number}? Hành động này không thể hoàn tác.`)) {
          (async () => {
            try {
              const { apiDelete } = await import('../api');
              await apiDelete(`/rooms/${room.room_id}`);
              await fetchDB();
              showToast(`Xoá phòng ${room.room_number} thành công!`, 'success');
              closeModal(); navigateTo('rooms');
            } catch (err: any) {
              showToast(err.message || 'Lỗi khi xoá phòng', 'error');
            }
          })();
        }
      });
    });
  });
}
