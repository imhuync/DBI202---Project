/* =============================================
   DASHBOARD PAGE
   ============================================= */
import { DB, formatVND, formatDate, getGuest, getRoomType, getInitials } from '../data';

export function renderDashboard(): string {
  const totalRooms = DB.rooms.length;
  const occupied = DB.rooms.filter(r => r.status === 'Occupied').length;
  const clean = DB.rooms.filter(r => r.status === 'Clean').length;
  const activeBookings = DB.bookings.filter(b => ['Confirmed', 'Pending'].includes(b.status)).length;
  const totalRevenue = DB.invoices.reduce((sum, inv) => sum + inv.final_amount, 0);
  const todayGuests = DB.bookingDetails.filter(bd => bd.actual_checkin && !bd.actual_checkout).length;
  const occupancyRate = Math.round((occupied / totalRooms) * 100);

  const recentBookings = [...DB.bookings]
    .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
    .slice(0, 5);

  // Build dynamic activity feed from real DB data
  type ActivityItem = { text: string; time: string; dot: string; ts: number };

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    return `${days} ngày trước`;
  }

  const activityEvents: ActivityItem[] = [];

  // Check-ins
  DB.bookingDetails
    .filter(bd => bd.actual_checkin)
    .forEach(bd => {
      const booking = DB.bookings.find(b => b.booking_id === bd.booking_id);
      const room = DB.rooms.find(r => r.room_id === bd.room_id);
      if (!booking || !room) return;
      const guest = DB.guests.find(g => g.guest_id === booking.guest_id);
      activityEvents.push({
        text: `<strong>${guest?.full_name || 'Khách'}</strong> đã check-in phòng <strong>${room.room_number}</strong>`,
        time: timeAgo(bd.actual_checkin),
        dot: 'dot-green',
        ts: new Date(bd.actual_checkin!).getTime(),
      });
    });

  // Check-outs
  DB.bookingDetails
    .filter(bd => bd.actual_checkout)
    .forEach(bd => {
      const booking = DB.bookings.find(b => b.booking_id === bd.booking_id);
      const room = DB.rooms.find(r => r.room_id === bd.room_id);
      if (!booking || !room) return;
      const guest = DB.guests.find(g => g.guest_id === booking.guest_id);
      activityEvents.push({
        text: `<strong>${guest?.full_name || 'Khách'}</strong> đã check-out phòng <strong>${room.room_number}</strong>`,
        time: timeAgo(bd.actual_checkout),
        dot: 'dot-blue',
        ts: new Date(bd.actual_checkout!).getTime(),
      });
    });

  // New bookings
  DB.bookings.forEach(b => {
    const guest = DB.guests.find(g => g.guest_id === b.guest_id);
    const details = DB.bookingDetails.filter(d => d.booking_id === b.booking_id);
    const rooms = details.map(d => DB.rooms.find(r => r.room_id === d.room_id)?.room_number).filter(Boolean).join(', ');
    activityEvents.push({
      text: `<strong>${guest?.full_name || 'Khách'}</strong> đặt phòng <strong>#${b.booking_id}</strong>${rooms ? ` — phòng ${rooms}` : ''}`,
      time: timeAgo(b.booking_date),
      dot: 'dot-purple',
      ts: new Date(b.booking_date).getTime(),
    });
  });

  // Paid invoices
  DB.invoices.forEach(inv => {
    activityEvents.push({
      text: `Hóa đơn <strong>#${inv.invoice_id}</strong> đã thanh toán — <strong>${formatVND(inv.final_amount)}</strong> via ${inv.payment_method}`,
      time: timeAgo(inv.payment_date),
      dot: 'dot-green',
      ts: new Date(inv.payment_date).getTime(),
    });
  });

  // Sort newest first, take top 8
  const activities = activityEvents
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 20);

  return `
    <div class="stats-grid">
      <div class="stat-card glass-panel stat-purple">
        <div class="stat-header">
          <span class="stat-label">Phòng trống</span>
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        </div>
        <div class="stat-value">${clean}</div>
        <div class="stat-change positive">trên tổng ${totalRooms} phòng</div>
      </div>
      <div class="stat-card glass-panel stat-green">
        <div class="stat-header">
          <span class="stat-label">Công suất</span>
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
        </div>
        <div class="stat-value">${occupancyRate}%</div>
        <div class="stat-change positive">${occupied} phòng đang sử dụng</div>
      </div>
      <div class="stat-card glass-panel stat-orange">
        <div class="stat-header">
          <span class="stat-label">Đặt phòng đang xử lý</span>
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        </div>
        <div class="stat-value">${activeBookings}</div>
        <div class="stat-change">${todayGuests} khách đang ở</div>
      </div>
      <div class="stat-card glass-panel stat-blue">
        <div class="stat-header">
          <span class="stat-label">Doanh thu</span>
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        </div>
        <div class="stat-value">${formatVND(totalRevenue)}</div>
        <div class="stat-change positive">tháng này</div>
      </div>
    </div>

    <div class="content-grid">
      <div class="section-panel glass-panel">
        <div class="section-header">
          <div><h3 class="section-title">Đặt phòng gần đây</h3><p class="section-subtitle">5 booking mới nhất</p></div>
          <a href="#bookings" class="btn btn-secondary btn-sm">Xem tất cả</a>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>Mã</th><th>Khách hàng</th><th>Check-in</th><th>Trạng thái</th></tr></thead>
            <tbody>
              ${recentBookings.map(b => {
    const guest = getGuest(b.guest_id);
    const sc = b.status === 'Confirmed' ? 'badge-success' : b.status === 'Pending' ? 'badge-warning' : b.status === 'Completed' ? 'badge-info' : 'badge-danger';
    return `<tr>
                  <td><strong>#${b.booking_id}</strong></td>
                  <td><div class="entity-name"><div class="entity-avatar">${getInitials(guest.full_name)}</div>${guest.full_name}</div></td>
                  <td>${formatDate(b.expected_checkin)}</td>
                  <td><span class="badge ${sc}">${b.status}</span></td>
                </tr>`;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section-panel glass-panel">
        <div class="section-header">
          <div><h3 class="section-title">Hoạt động gần đây</h3><p class="section-subtitle">Timeline sự kiện</p></div>
        </div>
        <div class="activity-list">
          ${activities.length > 0 ? activities.map(a => `
            <div class="activity-item">
              <div class="activity-dot ${a.dot}"></div>
              <div class="activity-content">
                <div class="activity-text">${a.text}</div>
                <div class="activity-time">${a.time}</div>
              </div>
            </div>
          `).join('') : '<div style="padding:var(--space-md);color:var(--text-muted);text-align:center">Chưa có hoạt động nào</div>'}
        </div>
      </div>
    </div>

    <div class="section-panel glass-panel">
      <div class="section-header">
        <div><h3 class="section-title">Sơ đồ phòng</h3><p class="section-subtitle">Trạng thái hiện tại</p></div>
        <div class="status-legend">
          <div class="legend-item"><span class="legend-dot clean"></span> Sạch</div>
          <div class="legend-item"><span class="legend-dot occupied"></span> Đang ở</div>
          <div class="legend-item"><span class="legend-dot dirty"></span> Cần dọn</div>
          <div class="legend-item"><span class="legend-dot maintenance"></span> Bảo trì</div>
        </div>
      </div>
      <div class="room-grid">
        ${DB.rooms.map(room => {
    const type = getRoomType(room);
    const bc = room.status === 'Clean' ? 'success' : room.status === 'Occupied' ? 'primary' : room.status === 'Dirty' ? 'warning' : 'danger';
    return `<div class="room-card glass-panel status-${room.status.toLowerCase()}">
            <div class="room-number">${room.room_number}</div>
            <div class="room-type">${type.type_name}</div>
            <span class="badge badge-${bc}">${room.status}</span>
          </div>`;
  }).join('')}
      </div>
    </div>
  `;
}
export function initDashboard(): void { }
