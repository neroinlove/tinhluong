"""
Công Cụ Tính Lương Nhân Viên - Flask App
==========================================
Web app nội bộ giúp tính lương hàng tháng cho nhân viên nhà thuốc.
"""

import json
import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
RECORDS_DIR = os.path.join(DATA_DIR, 'records')
UPLOADS_DIR = os.path.join(BASE_DIR, 'static', 'uploads')
EMPLOYEES_FILE = os.path.join(DATA_DIR, 'employees.json')

# Ensure directories exist
os.makedirs(RECORDS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


import re

def sanitize_text(value, max_len=50):
    """Strip HTML tags and limit length to prevent XSS."""
    if not isinstance(value, str):
        return str(value)
    # Remove any HTML tags
    clean = re.sub(r'<[^>]+>', '', value)
    # Strip dangerous characters
    clean = clean.strip()
    return clean[:max_len]

def sanitize_id(value, max_len=20):
    """Allow only lowercase letters, digits, underscores."""
    if not isinstance(value, str):
        return ''
    return re.sub(r'[^a-z0-9_]', '', value.lower().strip())[:max_len]


# ─── Data Helpers ───────────────────────────────────────────────

def load_employees():
    """Load employee data from JSON file."""
    try:
        with open(EMPLOYEES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"employees": []}


def save_employees(data):
    """Save employee data to JSON file."""
    with open(EMPLOYEES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_salary_record(month):
    """Load salary record for a specific month (format: YYYY-MM)."""
    filepath = os.path.join(RECORDS_DIR, f"{month}.json")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def save_salary_record(month, data):
    """Save salary record for a specific month."""
    filepath = os.path.join(RECORDS_DIR, f"{month}.json")
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ─── Salary Calculation ────────────────────────────────────────

def calculate_salary(employee, record):
    """
    Calculate total salary for an employee based on monthly input.
    
    All amounts are in thousands (k). E.g., 4700 = 4,700,000 VND.
    """
    overtime_val = record.get('overtime_hours', record.get('overtime_days', 0))
    days_off = record.get('days_off', 0)
    
    # Nếu số ngày nghỉ bằng 0: Tự động cộng 1 ngày lương (tương đương 9 tiếng tăng ca)
    extra_ot_hours = 9 if days_off == 0 else 0
    overtime_total = (overtime_val + extra_ot_hours) * employee.get('overtime_rate', 0)
    
    late_penalty = record.get('late_penalty_each', 5)  # Mặc định 5k/phút
    late_total = record.get('late_count', 0) * late_penalty
    commission = record.get('sales_total', 0) * (employee.get('commission_rate', 2) / 100)
    extra_bonus = employee.get('extra_bonus', 0)

    # Nghỉ: tự tính = số ngày × đơn giá tăng ca × 9 giờ
    days_off_deduction = days_off * employee.get('overtime_rate', 0) * 9
    
    penalty_total = record.get('penalty_amount', 0)

    total_add = (
        employee.get('base_salary', 0)
        + overtime_total
        + record.get('bonus_amount', 0)
        + employee.get('gas_allowance', 0)
        + employee.get('responsibility', 0)
        + commission
        + extra_bonus
    )

    total_subtract = (
        late_total
        + days_off_deduction
        + record.get('withholding', 0)
        + penalty_total
    )

    total_salary = total_add - total_subtract

    return {
        'overtime_total': round(overtime_total, 1),
        'late_total': round(late_total, 1),
        'days_off_deduction': round(days_off_deduction, 1),
        'commission': round(commission, 1),
        'extra_bonus': extra_bonus,
        'penalty_total': round(penalty_total, 1),
        'total_salary': round(total_salary, 1)
    }


# ─── Routes ─────────────────────────────────────────────────────

@app.route('/')
def dashboard():
    """Main dashboard page."""
    return render_template('dashboard.html')


@app.route('/api/employees', methods=['GET'])
def get_employees():
    """Get all employees."""
    month = request.args.get('month')
    data = load_employees()
    if month:
        try:
            year, m_num = map(int, month.split('-'))
            is_before_june_2026 = (year < 2026) or (year == 2026 and m_num < 6)
        except Exception:
            is_before_june_2026 = False
            
        if is_before_june_2026:
            for emp in data.get('employees', []):
                if emp['id'] == 'hoa':
                    emp['base_salary'] = 2000.0
                    emp['gas_allowance'] = 300.0
                    emp['responsibility'] = 0.0
                    emp['overtime_rate'] = 15.0
                    emp['daily_rate'] = 100.0
                    emp['commission_rate'] = 2.0
                    emp['extra_bonus'] = 1000.0
    return jsonify(data)


@app.route('/api/employees', methods=['POST'])
def add_employee():
    """Add a new employee."""
    data = load_employees()
    new_emp = request.json

    # Validate required fields
    if not new_emp or not new_emp.get('name'):
        return jsonify({'error': 'Tên nhân viên là bắt buộc'}), 400

    name = sanitize_text(new_emp['name'])
    if not name:
        return jsonify({'error': 'Tên không hợp lệ'}), 400

    # Generate ID from name
    raw_id = new_emp.get('id', name)
    emp_id = sanitize_id(raw_id)
    if not emp_id:
        return jsonify({'error': 'ID nhân viên không hợp lệ'}), 400

    # Check duplicate
    if any(e['id'] == emp_id for e in data['employees']):
        return jsonify({'error': f'Nhân viên {emp_id} đã tồn tại'}), 400

    employee = {
        'id': emp_id,
        'name': name,
        'base_salary': float(new_emp.get('base_salary', 0)),
        'gas_allowance': float(new_emp.get('gas_allowance', 0)),
        'responsibility': float(new_emp.get('responsibility', 0)),
        'overtime_rate': float(new_emp.get('overtime_rate', 0)),
        'daily_rate': float(new_emp.get('daily_rate', 0)),
        'commission_rate': float(new_emp.get('commission_rate', 2)),
        'extra_bonus': float(new_emp.get('extra_bonus', 0))
    }

    data['employees'].append(employee)
    save_employees(data)
    return jsonify({'message': 'Đã thêm nhân viên', 'employee': employee})


@app.route('/api/employees/<emp_id>', methods=['PUT'])
def update_employee(emp_id):
    """Update an existing employee."""
    data = load_employees()
    updates = request.json

    for i, emp in enumerate(data['employees']):
        if emp['id'] == emp_id:
            for key in ['name', 'base_salary', 'gas_allowance', 'responsibility',
                        'overtime_rate', 'daily_rate', 'commission_rate', 'extra_bonus']:
                if key in updates:
                    if key == 'name':
                        val = sanitize_text(updates[key])
                        if val:
                            data['employees'][i][key] = val
                    else:
                        data['employees'][i][key] = float(updates[key])
            save_employees(data)
            return jsonify({'message': 'Đã cập nhật', 'employee': data['employees'][i]})

    return jsonify({'error': 'Không tìm thấy nhân viên'}), 404


@app.route('/api/employees/<emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    """Delete an employee."""
    data = load_employees()
    original_len = len(data['employees'])
    data['employees'] = [e for e in data['employees'] if e['id'] != emp_id]

    if len(data['employees']) == original_len:
        return jsonify({'error': 'Không tìm thấy nhân viên'}), 404

    save_employees(data)
    return jsonify({'message': 'Đã xóa nhân viên'})


@app.route('/api/salary/<month>', methods=['GET'])
def get_salary(month):
    """Get salary records for a specific month."""
    record = load_salary_record(month)
    if record:
        return jsonify(record)
    return jsonify({'month': month, 'records': []})


@app.route('/api/salary/<month>', methods=['POST'])
def save_salary(month):
    """Save/update salary records for a specific month."""
    salary_data = request.json
    employees_data = load_employees()

    try:
        year, m_num = map(int, month.split('-'))
        is_before_june_2026 = (year < 2026) or (year == 2026 and m_num < 6)
    except Exception:
        is_before_june_2026 = False

    for emp in employees_data.get('employees', []):
        if emp['id'] == 'hoa':
            if is_before_june_2026:
                emp['base_salary'] = 2000.0
                emp['gas_allowance'] = 300.0
                emp['responsibility'] = 0.0
                emp['overtime_rate'] = 15.0
                emp['daily_rate'] = 100.0
                emp['commission_rate'] = 2.0
                emp['extra_bonus'] = 1000.0
            else:
                emp['base_salary'] = 4700.0
                emp['gas_allowance'] = 300.0
                emp['responsibility'] = 600.0
                emp['overtime_rate'] = 17.5
                emp['daily_rate'] = 157.0
                emp['commission_rate'] = 2.0
                emp['extra_bonus'] = 0.0

    # Calculate salary for each record
    for rec in salary_data.get('records', []):
        emp = next((e for e in employees_data['employees'] if e['id'] == rec['employee_id']), None)
        if emp:
            rec['calculated'] = calculate_salary(emp, rec)

    salary_data['month'] = month
    save_salary_record(month, salary_data)
    return jsonify({'message': 'Đã lưu bảng lương', 'data': salary_data})


@app.route('/api/calculate', methods=['POST'])
def calc_salary():
    """Calculate salary for a single employee (preview, not saved)."""
    req = request.json
    employees_data = load_employees()

    emp = next((e for e in employees_data['employees'] if e['id'] == req.get('employee_id')), None)
    if not emp:
        return jsonify({'error': 'Không tìm thấy nhân viên'}), 404

    # Adjust employee data based on month if provided
    month = req.get('month')
    if month:
        try:
            year, m_num = map(int, month.split('-'))
            is_before_june_2026 = (year < 2026) or (year == 2026 and m_num < 6)
        except Exception:
            is_before_june_2026 = False
            
        if emp['id'] == 'hoa':
            if is_before_june_2026:
                emp['base_salary'] = 2000.0
                emp['gas_allowance'] = 300.0
                emp['responsibility'] = 0.0
                emp['overtime_rate'] = 15.0
                emp['daily_rate'] = 100.0
                emp['commission_rate'] = 2.0
                emp['extra_bonus'] = 1000.0
            else:
                emp['base_salary'] = 4700.0
                emp['gas_allowance'] = 300.0
                emp['responsibility'] = 600.0
                emp['overtime_rate'] = 17.5
                emp['daily_rate'] = 157.0
                emp['commission_rate'] = 2.0
                emp['extra_bonus'] = 0.0

    result = calculate_salary(emp, req)
    return jsonify(result)


@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Upload KiotViet screenshot image."""
    if 'file' not in request.files:
        return jsonify({'error': 'Không có file'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Chưa chọn file'}), 400

    if file and allowed_file(file.filename):
        month = request.form.get('month', datetime.now().strftime('%Y-%m'))
        emp_id = request.form.get('employee_id', 'unknown')
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{month}_{emp_id}.{ext}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        file.save(filepath)
        return jsonify({'message': 'Upload thành công', 'filename': filename})

    return jsonify({'error': 'File không hợp lệ (chỉ chấp nhận PNG, JPG, GIF, WebP)'}), 400


@app.route('/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded images."""
    return send_from_directory(UPLOADS_DIR, filename)


@app.route('/api/export-image', methods=['POST'])
def export_image():
    """Save salary slip image directly to user's Desktop."""
    import base64
    data = request.json
    image_b64 = data.get('image', '')
    filename = sanitize_text(data.get('filename', 'luong.png'), max_len=80)

    # Validate filename extension
    if not filename.endswith('.png'):
        filename += '.png'

    # Decode base64 → bytes
    try:
        image_data = base64.b64decode(image_b64.split(',')[-1])
    except Exception:
        return jsonify({'error': 'Dữ liệu ảnh không hợp lệ'}), 400

    # Save to Desktop
    desktop = os.path.join(os.path.expanduser('~'), 'Desktop', filename)
    with open(desktop, 'wb') as f:
        f.write(image_data)

    return jsonify({'message': f'Đã lưu ảnh ra Desktop: {filename}', 'path': desktop})


# ─── Entry Point ────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, port=5000)
