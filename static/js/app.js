// ═══ Tính Lương Nhân Viên - Main App ═══
const App = {
  employees: [],
  currentEmpId: null,
  currentMonth: new Date(),
  records: {},

  async init() {
    await this.loadEmployees();
    this.renderTabs();
    this.updateMonthDisplay();
    this.bindEvents();
    if (this.employees.length) this.selectEmployee(this.employees[0].id);
    await this.loadSalaryData();
    this.restoreDraft();  // Khôi phục dữ liệu nhập dở nếu có
  },

  // ─── API Helpers ───
  async api(url, opts = {}) {
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
      return await res.json();
    } catch (e) { this.toast('Lỗi kết nối server', 'error'); return null; }
  },

  // ─── Data ───
  async loadEmployees() {
    const data = await this.api('/api/employees');
    if (data) this.employees = data.employees || [];
  },

  async loadSalaryData() {
    const m = this.getMonthStr();
    const data = await this.api(`/api/salary/${m}`);
    this.records = {};
    if (data && data.records) {
      data.records.forEach(r => { this.records[r.employee_id] = r; });
    }
    this.fillForm();
    this.updateSummary();
  },

  async saveSalaryData() {
    const m = this.getMonthStr();
    this.saveCurrentForm();
    const recs = Object.values(this.records);
    const res = await this.api(`/api/salary/${m}`, {
      method: 'POST', body: JSON.stringify({ month: m, records: recs })
    });
    if (res && !res.error) {
      if (res.data && res.data.records) {
        this.records = {};
        res.data.records.forEach(r => { this.records[r.employee_id] = r; });
      }
      this.toast('💾 Đã lưu bảng lương!', 'success');
      this.fillForm();
      this.updateSummary();
    }
  },

  // ─── Month ───
  getMonthStr() {
    const d = this.currentMonth;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },

  updateMonthDisplay() {
    const d = this.currentMonth;
    document.getElementById('monthDisplay').textContent = `Tháng ${d.getMonth()+1} / ${d.getFullYear()}`;
  },

  changeMonth(delta) {
    this.saveCurrentForm();
    this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
    this.updateMonthDisplay();
    this.loadSalaryData();
  },

  // ─── Tabs ───
  renderTabs() {
    const container = document.getElementById('employeeTabs');
    container.innerHTML = '';
    this.employees.forEach(e => {
      const btn = document.createElement('button');
      btn.className = 'employee-tab';
      btn.dataset.id = e.id;
      btn.id = `tab-${e.id}`;
      const avatar = document.createElement('span');
      avatar.className = 'tab-avatar';
      avatar.textContent = e.name.charAt(0);
      btn.appendChild(avatar);
      btn.appendChild(document.createTextNode(' ' + e.name));
      btn.onclick = () => this.selectEmployee(e.id);
      container.appendChild(btn);
    });
  },

  selectEmployee(id) {
    if (this.currentEmpId) this.saveCurrentForm();
    this.currentEmpId = id;
    document.querySelectorAll('.employee-tab').forEach(t => t.classList.toggle('active', t.dataset.id === id));
    const emp = this.employees.find(e => e.id === id);
    if (emp) {
      document.getElementById('overtimeRate').textContent = `ĐG: ${emp.overtime_rate}k/giờ`;
      document.getElementById('commissionRate').textContent = `Hoa hồng: ${emp.commission_rate}%`;
      document.getElementById('daysOffRate').textContent = `= ${emp.overtime_rate}k × 9h = ${(emp.overtime_rate * 9).toLocaleString('vi-VN')}k/ngày`;
    }
    this.fillForm();
    this.showUploadPreview();
  },

  // ─── Form ───
  fillForm() {
    const r = this.records[this.currentEmpId];
    const ids = { lateCount:'late_count', latePenalty:'late_penalty_each', overtimeHours:'overtime_hours',
      daysOff:'days_off', bonusAmount:'bonus_amount',
      bonusNote:'bonus_note', salesTotal:'sales_total', withholding:'withholding' };
    Object.entries(ids).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (el) {
        if (el.type === 'text') el.value = r ? (r[key] || '') : '';
        else if (elId === 'latePenalty') el.value = r ? (r[key] || 5) : 5;
        else el.value = r ? (r[key] || 0) : 0;
      }
    });
    if (r && r.calculated) this.renderResult(r.calculated);
    else this.renderEmptyResult();
  },

  saveCurrentForm() {
    if (!this.currentEmpId) return;
    const g = id => { const el = document.getElementById(id); return el ? (el.type === 'text' ? el.value : parseFloat(el.value)||0) : 0; };
    this.records[this.currentEmpId] = {
      employee_id: this.currentEmpId,
      late_count: g('lateCount'), late_penalty_each: g('latePenalty') || 5, overtime_hours: g('overtimeHours'),
      days_off: g('daysOff'),
      bonus_amount: g('bonusAmount'),
      bonus_note: g('bonusNote'), sales_total: g('salesTotal'), withholding: g('withholding'),
      kiotviet_image: (this.records[this.currentEmpId]||{}).kiotviet_image || '',
      calculated: (this.records[this.currentEmpId]||{}).calculated || null
    };
  },

  async calculateSalary() {
    this.saveCurrentForm();
    const r = this.records[this.currentEmpId];
    if (!r) return;
    const res = await this.api('/api/calculate', {
      method: 'POST', body: JSON.stringify({ employee_id: this.currentEmpId, ...r })
    });
    if (res && !res.error) {
      r.calculated = res;
      this.renderResult(res);
      this.updateSummary();
    }
  },

  // ─── Result Rendering ───
  fmt(n) { return n !== undefined && n !== null ? Number(n).toLocaleString('vi-VN', {maximumFractionDigits:1}) : '0'; },

  renderEmptyResult() {
    document.getElementById('resultList').innerHTML = `
      <div class="result-empty"><span class="result-empty-icon">💼</span>
      <p>Nhập liệu và bấm "Tính lương" để xem kết quả</p></div>`;
    document.getElementById('btnExportSingle').style.display = 'none';
  },

  renderResult(c) {
    const emp = this.employees.find(e => e.id === this.currentEmpId);
    if (!emp) return;
    const r = this.records[this.currentEmpId] || {};
    const rows = [
      ['Lương cứng', emp.base_salary, true],
      ['Tăng ca (' + (r.overtime_hours||0) + ' giờ)', c.overtime_total, true],
      ['Thưởng', r.bonus_amount||0, true]
    ];
    if (emp.gas_allowance > 0) rows.push(['Xăng xe', emp.gas_allowance, true]);
    rows.push(['Trách nhiệm', emp.responsibility, true]);
    rows.push(['Hoa hồng DS (' + emp.commission_rate + '%)', c.commission, true]);
    if (c.extra_bonus > 0) rows.push(['Thưởng cố định', c.extra_bonus, true]);

    let html = rows.map(([l,v,pos]) => `
      <div class="result-row">
        <span class="result-label">${l}</span>
        <span class="result-value positive">${this.fmt(v)}k</span>
      </div>`).join('');

    html += '<div class="result-divider"></div>';

    const negRows = [
      ['Đi trễ (' + (r.late_count||0) + ' phút)', c.late_total],
      ['Nghỉ (' + (r.days_off||0) + ' ngày)', c.days_off_deduction||0],
      ['Giữ lại', r.withholding||0]
    ];
    html += negRows.map(([l,v]) => `
      <div class="result-row">
        <span class="result-label">${l}</span>
        <span class="result-value negative">${v > 0 ? '-' : ''}${this.fmt(v)}k</span>
      </div>`).join('');

    html += '<div class="result-divider strong"></div>';
    html += `<div class="result-total">
      <span class="result-label">✨ TỔNG LƯƠNG</span>
      <span class="result-value">${this.fmt(c.total_salary)}k</span></div>`;

    // KiotViet image preview
    if (r.kiotviet_image) {
      html += `<div class="result-image-preview">
        <div class="result-image-label">📊 Ảnh doanh số KiotViet</div>
        <img src="/uploads/${r.kiotviet_image}" alt="Doanh số"></div>`;
    }

    document.getElementById('resultList').innerHTML = html;
    document.getElementById('btnExportSingle').style.display = 'block';
  },

  // ─── Summary Table ───
  updateSummary() {
    const tbody = document.getElementById('summaryBody');
    tbody.innerHTML = this.employees.map(emp => {
      const r = this.records[emp.id]; const c = r ? r.calculated : null;
      if (!c) return `<tr><td>${emp.name}</td><td colspan="7" style="color:var(--text-muted);text-align:center">Chưa tính</td></tr>`;
      const totalDeduct = (c.late_total||0) + (c.days_off_deduction||0) + (r.withholding||0);
      return `<tr>
        <td>${emp.name}</td><td>${this.fmt(emp.base_salary)}k</td>
        <td>${this.fmt(c.overtime_total)}k</td><td>${this.fmt(r.bonus_amount)}k</td>
        <td>${this.fmt(emp.gas_allowance + emp.responsibility + (c.extra_bonus||0))}k</td>
        <td>${this.fmt(c.commission)}k</td>
        <td style="color:var(--accent-red)">${totalDeduct > 0 ? '-' : ''}${this.fmt(totalDeduct)}k</td>
        <td>${this.fmt(c.total_salary)}k</td></tr>`;
    }).join('');
  },

  // ─── Upload ───
  showUploadPreview() {
    const r = this.records[this.currentEmpId];
    const preview = document.getElementById('uploadPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const area = document.getElementById('uploadArea');
    if (r && r.kiotviet_image) {
      preview.src = `/uploads/${r.kiotviet_image}`;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      area.classList.add('has-image');
    } else {
      preview.style.display = 'none';
      placeholder.style.display = 'flex';
      area.classList.remove('has-image');
    }
  },

  async uploadImage(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('month', this.getMonthStr());
    fd.append('employee_id', this.currentEmpId);
    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.filename) {
        if (!this.records[this.currentEmpId]) this.saveCurrentForm();
        this.records[this.currentEmpId].kiotviet_image = data.filename;
        this.showUploadPreview();
        this.toast('📷 Upload ảnh thành công!', 'success');
        this.detectSalesFromImage(file);
      }
    } catch (e) { this.toast('Upload thất bại', 'error'); }
  },

  async detectSalesFromImage(file) {
    this.toast('🔍 Đang tự động nhận diện doanh số...', 'info');
    try {
      const result = await Tesseract.recognize(file, 'vie+eng');
      const text = result.data.text;
      console.log('[OCR raw]', text);
      const lines = text.split('\n');

      // Parse số: có dấu chấm/phẩy hoặc liền (VD: 12,570,000 hoặc 12570000)
      const parseNum = s => parseInt(s.replace(/[.,\s]/g, ''));
      // Match số có separator hoặc số thần >= 7 chữ số
      const numRe = /\d{1,3}(?:[.,]\d{3})+|\d{7,}/g;
      const extractBigNums = str => [...str.matchAll(numRe)]
        .map(m => parseNum(m[0])).filter(n => n >= 1_000_000);

      // Chiến lược 1: Dòng tổng hợp KiotViet
      // Được nhận diện qua cụm từ gần đúng với "mặt hàng" (OCR hay lỗi S/I/l)
      const summaryLine = lines.find(l =>
        /m[\u1eaD\u1ea1a][\u0300-\u036ft]?\s*h[a\u00e0]ng/i.test(l) &&
        /:\s*\d+/.test(l)
      );
      if (summaryLine) {
        console.log('[Summary line]', summaryLine);
        const bigNums = extractBigNums(summaryLine);
        if (bigNums.length) {
          const salesK = Math.round(bigNums[0] / 1000);
          document.getElementById('salesTotal').value = salesK;
          this.toast(`✨ Doanh số: ${salesK.toLocaleString('vi-VN')}k`, 'success');
          this.calculateSalary();
          return;
        }
      }

      // Chiến lược 2: Sau header "Doanh thu thuần"
      const dtIdx = lines.findIndex(l => /doanh\s*thu/i.test(l));
      if (dtIdx !== -1) {
        for (let i = dtIdx + 1; i < Math.min(dtIdx + 5, lines.length); i++) {
          const bigNums = extractBigNums(lines[i]);
          if (bigNums.length) {
            const salesK = Math.round(bigNums[0] / 1000);
            document.getElementById('salesTotal').value = salesK;
            this.toast(`✨ Doanh số: ${salesK.toLocaleString('vi-VN')}k`, 'success');
            this.calculateSalary();
            return;
          }
        }
      }

      // Chiến lược 3 (fallback): Số >= 1,000,000 đầu tiên trong toàn văn bản
      const allNums = extractBigNums(text);
      if (allNums.length) {
        const salesK = Math.round(allNums[0] / 1000);
        document.getElementById('salesTotal').value = salesK;
        this.toast(`⚠️ Doanh số (tự động): ${salesK.toLocaleString('vi-VN')}k — kiểm tra lại nhé!`, 'info');
        this.calculateSalary();
        return;
      }

      this.toast('Không tìm thấy doanh số. Nhập tay nhé!', 'info');
    } catch (e) {
      console.error(e);
      this.toast('Lỗi nhận diện ảnh', 'error');
    }
  },

  // ─── Export Image ───
  async exportSingle() {
    const emp = this.employees.find(e => e.id === this.currentEmpId);
    const r = this.records[this.currentEmpId];
    if (!emp || !r || !r.calculated) { this.toast('Chưa tính lương!', 'error'); return; }
    this.renderSlip(emp, r);
    await new Promise(ok => setTimeout(ok, 300));
    const el = document.getElementById('salarySlip');
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const m = this.getMonthStr();
      const filename = `luong_${emp.id}_thang${m.split('-')[1]}_${m.split('-')[0]}.png`;
      const imageB64 = canvas.toDataURL('image/png');
      const res = await this.api('/api/export-image', {
        method: 'POST',
        body: JSON.stringify({ image: imageB64, filename })
      });
      if (res && !res.error) {
        this.toast(`📸 Đã lưu ra Desktop: ${filename}`, 'success');
      } else {
        this.toast('Lỗi lưu ảnh: ' + (res?.error || ''), 'error');
      }
    } catch (e) { this.toast('Lỗi xuất ảnh: ' + e.message, 'error'); }
  },

  async exportAll() {
    for (const emp of this.employees) {
      const r = this.records[emp.id];
      if (r && r.calculated) {
        this.renderSlip(emp, r);
        await new Promise(ok => setTimeout(ok, 300));
        try {
          const canvas = await html2canvas(document.getElementById('salarySlip'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          const m = this.getMonthStr();
          const filename = `luong_${emp.id}_thang${m.split('-')[1]}_${m.split('-')[0]}.png`;
          const imageB64 = canvas.toDataURL('image/png');
          await this.api('/api/export-image', { method: 'POST', body: JSON.stringify({ image: imageB64, filename }) });
          await new Promise(ok => setTimeout(ok, 300));
        } catch(e) { console.error(e); }
      }
    }
    this.toast('📸 Đã lưu ảnh tất cả NV ra Desktop!', 'success');
  },

  renderSlip(emp, r) {
    const c = r.calculated;
    const m = this.getMonthStr();
    const [y, mo] = m.split('-');
    const slip = document.getElementById('salarySlip');
    let imgHtml = '';
    if (r.kiotviet_image) {
      imgHtml = `<div class="slip-kiotviet">
        <div class="slip-kiotviet-title">📊 DOANH SỐ HÀNG TƯ VẤN</div>
        <img src="/uploads/${r.kiotviet_image}" alt="Doanh số" crossorigin="anonymous">
        <div class="slip-kiotviet-info">Doanh số: ${this.fmt(r.sales_total)}k | Hoa hồng ${emp.commission_rate}%: ${this.fmt(c.commission)}k</div>
      </div>`;
    }
    slip.innerHTML = `
      <div class="slip-header">
        <div class="slip-store">NHÀ THUỐC</div>
        <div class="slip-title">💰 BẢNG LƯƠNG THÁNG ${mo}/${y}</div>
        <div class="slip-employee">Nhân viên: ${emp.name}</div>
      </div>
      <div class="slip-section">
        <div class="slip-section-title positive">KHOẢN CỘNG (+)</div>
        <div class="slip-row"><span class="slip-row-label">Lương cứng</span><span class="slip-row-value">${this.fmt(emp.base_salary)}k</span></div>
        <div class="slip-row"><span class="slip-row-label">Tăng ca (${r.overtime_hours||0} giờ)</span><span class="slip-row-value">${this.fmt(c.overtime_total)}k</span></div>
        <div class="slip-row"><span class="slip-row-label">Thưởng${r.bonus_note ? ' ('+r.bonus_note+')' : ''}</span><span class="slip-row-value">${this.fmt(r.bonus_amount)}k</span></div>
        ${emp.gas_allowance > 0 ? `<div class="slip-row"><span class="slip-row-label">Xăng xe</span><span class="slip-row-value">${this.fmt(emp.gas_allowance)}k</span></div>` : ''}
        <div class="slip-row"><span class="slip-row-label">Trách nhiệm</span><span class="slip-row-value">${this.fmt(emp.responsibility)}k</span></div>
        <div class="slip-row"><span class="slip-row-label">Hoa hồng DS (${emp.commission_rate}%)</span><span class="slip-row-value">${this.fmt(c.commission)}k</span></div>
        ${c.extra_bonus > 0 ? `<div class="slip-row"><span class="slip-row-label">Thưởng cố định</span><span class="slip-row-value">${this.fmt(c.extra_bonus)}k</span></div>` : ''}
      </div>
      <div class="slip-section">
        <div class="slip-section-title negative">KHOẢN TRỪ (-)</div>
        <div class="slip-row"><span class="slip-row-label">Đi trễ</span><span class="slip-row-value">${this.fmt(c.late_total)}k</span></div>
        <div class="slip-row"><span class="slip-row-label">Nghỉ (${r.days_off||0} ngày)</span><span class="slip-row-value">${this.fmt(c.days_off_deduction)}k</span></div>
        <div class="slip-row"><span class="slip-row-label">Giữ lại</span><span class="slip-row-value">${this.fmt(r.withholding)}k</span></div>
      </div>
      <div class="slip-total">
        <span class="slip-total-label">✨ TỔNG LƯƠNG</span>
        <span class="slip-total-value">${this.fmt(c.total_salary)}k</span>
      </div>
      ${imgHtml}
      <div class="slip-footer">Tạo bởi Hệ thống Tính Lương | Tháng ${mo}/${y}</div>`;
  },

  // ─── Employee Modal ───
  showModal() {
    document.getElementById('modalOverlay').style.display = 'flex';
    this.renderModalList();
  },
  hideModal() { document.getElementById('modalOverlay').style.display = 'none'; },

  renderModalList() {
    const body = document.getElementById('modalBody');
    body.innerHTML = this.employees.map(e => `
      <div class="emp-card">
        <div class="emp-card-header">
          <span class="emp-card-name">${e.name}</span>
          <div class="emp-card-actions">
            <button class="btn btn-sm" onclick="App.showEditForm('${e.id}')">✏️ Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="App.deleteEmployee('${e.id}')">🗑️</button>
          </div>
        </div>
        <div class="emp-details">
          <div><span class="emp-detail-label">Lương cứng</span><br><span class="emp-detail-value">${this.fmt(e.base_salary)}k</span></div>
          <div><span class="emp-detail-label">ĐG tăng ca</span><br><span class="emp-detail-value">${e.overtime_rate}k/ngày</span></div>
          <div><span class="emp-detail-label">ĐG ngày công</span><br><span class="emp-detail-value">${e.daily_rate}k</span></div>
          <div><span class="emp-detail-label">Xăng xe</span><br><span class="emp-detail-value">${this.fmt(e.gas_allowance)}k</span></div>
          <div><span class="emp-detail-label">Trách nhiệm</span><br><span class="emp-detail-value">${this.fmt(e.responsibility)}k</span></div>
          <div><span class="emp-detail-label">Hoa hồng</span><br><span class="emp-detail-value">${e.commission_rate}%</span></div>
        </div>
      </div>`).join('') +
      `<button class="btn btn-add-emp" onclick="App.showEditForm('new')">➕ Thêm nhân viên</button>`;
  },

  showEditForm(id) {
    const e = id === 'new' ? {id:'',name:'',base_salary:0,gas_allowance:0,responsibility:0,overtime_rate:0,daily_rate:0,commission_rate:2,extra_bonus:0} : this.employees.find(x=>x.id===id);
    const body = document.getElementById('modalBody');
    body.innerHTML = `<div class="edit-form">
      <div class="form-group full-width"><label class="form-label">Tên</label><input class="form-input" id="editName" value="${e.name}"></div>
      <div class="form-group"><label class="form-label">Lương cứng (k)</label><input type="number" class="form-input" id="editBase" value="${e.base_salary}"></div>
      <div class="form-group"><label class="form-label">Xăng xe (k)</label><input type="number" class="form-input" id="editGas" value="${e.gas_allowance}"></div>
      <div class="form-group"><label class="form-label">Trách nhiệm (k)</label><input type="number" class="form-input" id="editResp" value="${e.responsibility}"></div>
      <div class="form-group"><label class="form-label">ĐG tăng ca (k/ngày)</label><input type="number" class="form-input" id="editOT" value="${e.overtime_rate}" step="0.1"></div>
      <div class="form-group"><label class="form-label">ĐG ngày công (k)</label><input type="number" class="form-input" id="editDaily" value="${e.daily_rate}"></div>
      <div class="form-group"><label class="form-label">Hoa hồng (%)</label><input type="number" class="form-input" id="editComm" value="${e.commission_rate}" step="0.1"></div>
      <div class="form-group"><label class="form-label">Thưởng CĐ (k)</label><input type="number" class="form-input" id="editExtra" value="${e.extra_bonus}"></div>
      <div class="edit-actions">
        <button class="btn" onclick="App.renderModalList()">← Quay lại</button>
        <button class="btn btn-save" onclick="App.saveEmployee('${id}')">${id==='new'?'➕ Thêm':'💾 Lưu'}</button>
      </div></div>`;
  },

  async saveEmployee(id) {
    const data = {
      name: document.getElementById('editName').value,
      base_salary: parseFloat(document.getElementById('editBase').value)||0,
      gas_allowance: parseFloat(document.getElementById('editGas').value)||0,
      responsibility: parseFloat(document.getElementById('editResp').value)||0,
      overtime_rate: parseFloat(document.getElementById('editOT').value)||0,
      daily_rate: parseFloat(document.getElementById('editDaily').value)||0,
      commission_rate: parseFloat(document.getElementById('editComm').value)||2,
      extra_bonus: parseFloat(document.getElementById('editExtra').value)||0
    };
    if (!data.name) { this.toast('Tên NV là bắt buộc!', 'error'); return; }
    let res;
    if (id === 'new') {
      res = await this.api('/api/employees', { method: 'POST', body: JSON.stringify(data) });
    } else {
      res = await this.api(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
    if (res && !res.error) {
      await this.loadEmployees();
      this.renderTabs();
      this.renderModalList();
      this.toast('✅ Đã lưu thông tin NV!', 'success');
    } else { this.toast(res?.error || 'Lỗi', 'error'); }
  },

  async deleteEmployee(id) {
    if (!confirm(`Xóa nhân viên ${id}?`)) return;
    await this.api(`/api/employees/${id}`, { method: 'DELETE' });
    await this.loadEmployees();
    this.renderTabs();
    this.renderModalList();
    if (this.currentEmpId === id && this.employees.length) this.selectEmployee(this.employees[0].id);
    this.toast('🗑️ Đã xóa NV', 'info');
  },

  // ─── Toast ───
  toast(msg, type='info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  },

  // ─── Events ───
  bindEvents() {
    document.getElementById('btnPrevMonth').onclick = () => this.changeMonth(-1);
    document.getElementById('btnNextMonth').onclick = () => this.changeMonth(1);
    document.getElementById('btnSave').onclick = () => this.saveSalaryData();
    document.getElementById('btnCalculate').onclick = () => this.calculateSalary();
    document.getElementById('btnManageEmployees').onclick = () => this.showModal();
    document.getElementById('btnCloseModal').onclick = () => this.hideModal();
    document.getElementById('modalOverlay').onclick = (e) => { if (e.target.id === 'modalOverlay') this.hideModal(); };
    document.getElementById('btnExportSingle').onclick = () => this.exportSingle();
    document.getElementById('btnExportAll').onclick = () => this.exportAll();

    // Auto-save draft to localStorage on any input change
    document.getElementById('salaryForm').addEventListener('input', () => {
      this.saveCurrentForm();
      this.saveDraft();
    });

    // Ctrl+F5: clear draft before hard reload
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'F5') {
        localStorage.removeItem('salaryDraft');
      }
    });

    // Save draft before normal F5
    window.addEventListener('beforeunload', () => this.saveDraft());

    // Upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('kiotvietImage');
    uploadArea.onclick = () => fileInput.click();
    fileInput.onchange = (e) => { if (e.target.files[0]) this.uploadImage(e.target.files[0]); };
    uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--accent-blue)'; };
    uploadArea.ondragleave = () => { uploadArea.style.borderColor = ''; };
    uploadArea.ondrop = (e) => { e.preventDefault(); uploadArea.style.borderColor = ''; if (e.dataTransfer.files[0]) this.uploadImage(e.dataTransfer.files[0]); };
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

// localStorage draft helpers
Object.assign(App, {
  saveDraft() {
    if (!this.currentEmpId) return;
    this.saveCurrentForm();
    const draft = {
      month: this.getMonthStr(),
      empId: this.currentEmpId,
      records: this.records
    };
    localStorage.setItem('salaryDraft', JSON.stringify(draft));
  },

  restoreDraft() {
    try {
      const raw = localStorage.getItem('salaryDraft');
      if (!raw) return false;
      const draft = JSON.parse(raw);
      // Chỉ restore nếu cùng tháng
      if (draft.month === this.getMonthStr()) {
        this.records = draft.records || {};
        if (draft.empId) this.selectEmployee(draft.empId);
        else this.fillForm();
        this.updateSummary();
        this.toast('💾 Đã khôi phục dữ liệu chưa lưu', 'info');
        return true;
      }
    } catch(e) {}
    return false;
  }
});
