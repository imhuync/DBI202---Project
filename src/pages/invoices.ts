import { DB, formatVND, getGuest, getInitials, fetchDB } from '../data';
import { showModal, closeModal, showToast, navigateTo } from '../ui';
import { apiPost } from '../api';

export function renderInvoices(): string {
  const invoices = [...DB.invoices].sort((a, b) => {
    const timeA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
    const timeB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
    return timeB - timeA || b.invoice_id - a.invoice_id;
  });

  const totalRevenue = invoices.reduce((s, i) => s + i.final_amount, 0);
  const totalRoom = invoices.reduce((s, i) => s + i.room_charge, 0);
  const totalService = invoices.reduce((s, i) => s + i.service_charge, 0);
  const roomPct = totalRevenue > 0 ? Math.round((totalRoom / totalRevenue) * 100) : 0;
  const svcPct = totalRevenue > 0 ? Math.round((totalService / totalRevenue) * 100) : 0;

  const latestInvoice = invoices[0];

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
          <thead><tr><th>Mã HĐ</th><th>Booking</th><th>Khách hàng</th><th>Tiền phòng</th><th>Dịch vụ</th><th>Thuế</th><th>Giảm giá</th><th>Tổng TT</th><th>PT Thanh toán</th><th></th></tr></thead>
          <tbody>
            ${invoices.map(inv => {
    const booking = DB.bookings.find(b => b.booking_id === inv.booking_id);
    const guest = booking ? DB.guests.find(g => g.guest_id === booking.guest_id) : null;
    const guestName = guest?.full_name || 'Khách không xác định';
    const guestInitials = guest ? getInitials(guest.full_name) : '?';
    return `<tr>
                <td data-label="Mã HĐ"><strong>#${inv.invoice_id}</strong></td>
                <td data-label="Booking"><span class="badge badge-info">#${inv.booking_id}</span></td>
                <td data-label="Khách hàng"><div class="entity-name"><div class="entity-avatar">${guestInitials}</div>${guestName}</div></td>
                <td data-label="Tiền phòng">${formatVND(inv.room_charge)}</td>
                <td data-label="Dịch vụ">${formatVND(inv.service_charge)}</td>
                <td data-label="Thuế">${formatVND(inv.tax_amount)}</td>
                <td data-label="Giảm giá" style="color:var(--danger)">${formatVND(-inv.discount_amount)}</td>
                <td data-label="Tổng TT"><strong>${formatVND(inv.final_amount)}</strong></td>
                <td data-label="PT Thanh toán"><span class="badge badge-success">${inv.payment_method}</span></td>
                <td style="text-align:right">
                  <button class="btn btn-outline-sm print-invoice-btn" data-invoice-id="${inv.invoice_id}" title="In hóa đơn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  </button>
                </td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${latestInvoice ? renderInvoiceDetail(latestInvoice) : ''}
    <div id="printContainer"></div>
  `;
}

function renderInvoiceDetail(inv: typeof DB.invoices[0]): string {
  return `
    <div class="section-panel glass-panel" style="margin-top:var(--space-xl)">
      <div class="section-header">
        <div><h3 class="section-title">Chi tiết hóa đơn #${inv.invoice_id}</h3></div>
        <button class="btn btn-outline print-invoice-btn" data-invoice-id="${inv.invoice_id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:8px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          In hóa đơn
        </button>
      </div>
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
  // Print Logic
  const handlePrint = (e: Event) => {
    const btn = (e.target as HTMLElement).closest('.print-invoice-btn') as HTMLElement;
    if (!btn) return;
    const invId = parseInt(btn.dataset.invoiceId!);
    const inv = DB.invoices.find(i => i.invoice_id === invId);
    if (!inv) return;

    const booking = DB.bookings.find(b => b.booking_id === inv.booking_id);
    if (!booking) {
      showToast('Không tìm thấy booking của hóa đơn này', 'error');
      return;
    }

    const guest = DB.guests.find(g => g.guest_id === booking.guest_id);
    if (!guest) {
      showToast('Không tìm thấy thông tin khách hàng', 'error');
      return;
    }

    const details = DB.bookingDetails.filter(d => d.booking_id === inv.booking_id);
    const svcUsages = details.flatMap(d => DB.serviceUsages.filter(u => u.booking_detail_id === d.detail_id));
    const invoiceDate = inv.payment_date
      ? new Date(inv.payment_date).toLocaleDateString('vi-VN')
      : new Date().toLocaleDateString('vi-VN');

    const printContent = `
      <div class="printable-invoice">
        <div class="invoice-header">
          <div class="invoice-logo">COMUA</div>
          <div class="invoice-meta">
            <h2>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h2>
            <p>Số: #INV-${inv.invoice_id}</p>
            <p>Ngày: ${invoiceDate}</p>
          </div>
        </div>
        
        <div class="invoice-info">
          <div class="info-block">
            <h4>TỪ</h4>
            <p><strong>KHÁCH SẠN CỎ MƯA</strong></p>
            <p>Lô 9-10, số 30-31, đường Trạng Trình, phường 9, thành phố Đà Lạt</p>
            <p>Hotline: 0918 330 119</p>
          </div>
          <div class="info-block" style="text-align:right">
            <h4>KHÁCH HÀNG</h4>
            <p><strong>${guest.full_name}</strong></p>
            <p>Quốc tịch: ${guest.nationality}</p>
            <p>CMND/CCCD: ${guest.id_card}</p>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Mô tả</th>
              <th style="text-align:right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tiền thuê phòng (Booking #${inv.booking_id})</td>
              <td style="text-align:right">${formatVND(inv.room_charge)}</td>
            </tr>
            ${svcUsages.map(u => {
      const svc = DB.services.find(s => s.service_id === u.service_id);
      return `
                <tr>
                  <td>Dịch vụ: ${svc?.service_name || 'N/A'} (x${u.quantity} ${svc?.unit || ''})</td>
                  <td style="text-align:right">${formatVND(u.total_price)}</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>

        <div class="invoice-summary">
          <div class="summary-row"><span>Cộng tiền hàng:</span><span>${formatVND(inv.room_charge + inv.service_charge)}</span></div>
          <div class="summary-row"><span>Thuế VAT (10%):</span><span>${formatVND(inv.tax_amount)}</span></div>
          <div class="summary-row"><span>Giảm giá:</span><span>- ${formatVND(inv.discount_amount)}</span></div>
          <div class="summary-row total"><span>TỔNG CỘNG:</span><span>${formatVND(inv.final_amount)}</span></div>
        </div>

        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; text-align: center;">
          <div>
            <p><strong>Người nộp tiền</strong></p>
            <p style="font-size: 10px; font-style: italic;">(Ký, ghi rõ họ tên)</p>
          </div>
          <div>
            <p><strong>Người lập phiếu</strong></p>
            <p style="font-size: 10px; font-style: italic;">(Ký, ghi rõ họ tên)</p>
          </div>
        </div>

        <div class="invoice-footer">
          <p>Cảm ơn Quý khách đã sử dụng dịch vụ của Khách sạn CỎ MƯA!</p>
          <p>Hẹn gặp lại Quý khách.</p>
        </div>
      </div>
    `;

    const printContainer = document.getElementById('printContainer')!;
    printContainer.innerHTML = printContent;
    window.print();
    printContainer.innerHTML = '';
  };

  document.querySelectorAll('.print-invoice-btn').forEach(btn => {
    btn.addEventListener('click', handlePrint);
  });

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
