import { DB, formatVND, getGuest, getInitials, fetchDB } from '../data';
import { showModal, closeModal, showToast, navigateTo } from '../ui';
import { apiPost } from '../api';

export function renderInvoices(): string {
  const totalRevenue = DB.invoices.reduce((s, i) => s + i.final_amount, 0);
  const totalRoom = DB.invoices.reduce((s, i) => s + i.room_charge, 0);
  const totalService = DB.invoices.reduce((s, i) => s + i.service_charge, 0);
  const roomPct = totalRevenue > 0 ? Math.round((totalRoom / totalRevenue) * 100) : 0;
  const svcPct = totalRevenue > 0 ? Math.round((totalService / totalRevenue) * 100) : 0;

  const latestInvoice = DB.invoices[DB.invoices.length - 1];

  return `
    <div class="stats-grid" style="margin-bottom:var(--space-xl)">
      <div class="stat-card glass-panel stat-green">
        <div class="stat-header"><span class="stat-label">Tổng doanh thu</span><div class="stat-icon" style="background:var(--primary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div></div>
        <div class="stat-value">${formatVND(totalRevenue)}</div>
        <div class="stat-change positive">${DB.invoices.length} hóa đơn</div>
      </div>
      <div class="stat-card glass-panel stat-blue">
        <div class="stat-header"><span class="stat-label">Tiền phòng</span><div class="stat-icon" style="background:var(--info)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div></div>
        <div class="stat-value">${formatVND(totalRoom)}</div>
        <div class="stat-change">${roomPct}% tổng doanh thu</div>
      </div>
      <div class="stat-card glass-panel stat-orange">
        <div class="stat-header"><span class="stat-label">Tiền dịch vụ</span><div class="stat-icon" style="background:var(--warning)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div></div>
        <div class="stat-value">${formatVND(totalService)}</div>
        <div class="stat-change">${svcPct}% tổng doanh thu</div>
      </div>
    </div>

    <div class="page-header"><div></div>
      <button class="btn btn-primary" id="createInvoiceBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tạo hóa đơn
      </button>
    </div>

    <div class="section-panel glass-panel">
      <div class="section-header"><div><h3 class="section-title">Danh sách hóa đơn</h3><p class="section-subtitle">Tất cả hóa đơn đã xuất</p></div></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Mã HĐ</th><th>Booking</th><th>Khách hàng</th><th>Tiền phòng</th><th>Dịch vụ</th><th>Thuế</th><th>Giảm giá</th><th>Tổng TT</th><th>PT Thanh toán</th></tr></thead>
          <tbody>
            ${DB.invoices.map(inv => {
    const booking = DB.bookings.find(b => b.booking_id === inv.booking_id)!;
    const guest = getGuest(booking.guest_id);
    return `<tr>
                <td data-label="Mã HĐ"><strong>#${inv.invoice_id}</strong></td>
                <td data-label="Booking"><span class="badge badge-info">#${inv.booking_id}</span></td>
                <td data-label="Khách hàng"><div class="entity-name"><div class="entity-avatar">${getInitials(guest.full_name)}</div>${guest.full_name}</div></td>
                <td data-label="Tiền phòng">${formatVND(inv.room_charge)}</td>
                <td data-label="Dịch vụ">${formatVND(inv.service_charge)}</td>
                <td data-label="Thuế">${formatVND(inv.tax_amount)}</td>
                <td data-label="Giảm giá" style="color:var(--danger)">${formatVND(-inv.discount_amount)}</td>
                <td data-label="Tổng TT"><strong>${formatVND(inv.final_amount)}</strong></td>
                <td data-label="PT Thanh toán"><span class="badge badge-success">${inv.payment_method}</span></td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${latestInvoice ? renderInvoiceDetail(latestInvoice) : ''}
  `;
}

function renderInvoiceDetail(inv: typeof DB.invoices[0]): string {
  return `
    <div class="section-panel glass-panel" style="margin-top:var(--space-xl)">
      <div class="section-header"><div><h3 class="section-title">Chi tiết hóa đơn #${inv.invoice_id}</h3></div></div>
      <div class="invoice-detail" style="padding:var(--space-lg);background:var(--glass-bg);border-radius:var(--radius-md)">
        <div class="invoice-row"><span>Tiền phòng</span><span>${formatVND(inv.room_charge)}</span></div>
        <div class="invoice-row"><span>Tiền dịch vụ</span><span>${formatVND(inv.service_charge)}</span></div>
        <div class="invoice-row"><span>Thuế VAT (10%)</span><span>${formatVND(inv.tax_amount)}</span></div>
        <div class="invoice-row" style="color:var(--danger)"><span>Giảm giá</span><span>- ${formatVND(inv.discount_amount)}</span></div>
        <div class="invoice-row invoice-total"><span>TỔNG THANH TOÁN</span><span>${formatVND(inv.final_amount)}</span></div>
      </div>
    </div>
  `;
}

export function initInvoicesEvents(): void {
  document.getElementById('createInvoiceBtn')?.addEventListener('click', () => {
    const eligible = DB.bookings.filter(b => b.status === 'Completed' || b.status === 'Confirmed');
    const existing = new Set(DB.invoices.map(i => i.booking_id));
    const available = eligible.filter(b => !existing.has(b.booking_id));

    showModal('Tạo hóa đơn mới', `
      <div class="form-group">
        <label class="form-label">Booking *</label>
        <select class="form-select" id="invBookingId">
          ${available.length ? available.map(b => {
      const g = getGuest(b.guest_id);
      return `<option value="${b.booking_id}">#${b.booking_id} — ${g.full_name}</option>`;
    }).join('') : '<option value="">Không có booking khả dụng</option>'}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Giảm giá (₫)</label><input class="form-input" id="invDiscount" type="number" value="0"></div>
        <div class="form-group">
          <label class="form-label">Phương thức</label>
          <select class="form-select" id="invPayMethod"><option>Cash</option><option>Card</option><option>Transfer</option><option>E-Wallet</option></select>
        </div>
      </div>
      <div id="invoicePreview" style="margin-top:var(--space-md);margin-bottom:var(--space-md)"></div>
    `, async () => {
      const bookingIdInput = (document.getElementById('invBookingId') as HTMLSelectElement).value;
      if (!bookingIdInput) { showToast('Vui lòng chọn booking', 'error'); return; }
      const bookingId = parseInt(bookingIdInput);
      const discount = parseInt((document.getElementById('invDiscount') as HTMLInputElement).value) || 0;
      const method = (document.getElementById('invPayMethod') as HTMLSelectElement).value;

      try {
        await apiPost('/generate-invoice', { booking_id: bookingId, discount, payment_method: method });
        await fetchDB();
        showToast(`Tạo hóa đơn thành công!`, 'success');
        closeModal(); navigateTo('invoices');
      } catch (err) {
        showToast('Lỗi khi tạo hóa đơn', 'error');
      }
    });

    // Live preview on booking change
    const sel = document.getElementById('invBookingId') as HTMLSelectElement;
    const updatePreview = () => {
      const bookingId = parseInt(sel.value);
      if (!bookingId) return;
      const details = DB.bookingDetails.filter(d => d.booking_id === bookingId);
      const roomCharge = details.reduce((s, d) => s + d.price_at_booking, 0);
      const svcUsages = details.flatMap(d => DB.serviceUsages.filter(u => u.booking_detail_id === d.detail_id));
      const serviceCharge = svcUsages.reduce((s, u) => s + u.total_price, 0);
      const tax = Math.round((roomCharge + serviceCharge) * 0.1);
      document.getElementById('invoicePreview')!.innerHTML = `
        <div style="padding:var(--space-md);background:var(--glass-bg);border-radius:var(--radius-md);font-size:var(--font-sm)">
          <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-xs)"><span>Tiền phòng</span><span>${formatVND(roomCharge)}</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-xs)"><span>Tiền dịch vụ</span><span>${formatVND(serviceCharge)}</span></div>
          <div style="display:flex;justify-content:space-between"><span>VAT (10%)</span><span>${formatVND(tax)}</span></div>
        </div>`;
    };
    sel?.addEventListener('change', updatePreview);
    if (sel?.value) updatePreview();
  });
}
