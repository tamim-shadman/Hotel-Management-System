const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authMiddleware } = require('./auth');

// GET /api/employees - List all employees with filters
router.get('/', (req, res) => {
  let employees = db.getCollection('employees');
  const { search, department, shift, status } = req.query;

  if (search) {
    const q = search.toLowerCase();
    employees = employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.staffId.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  }

  if (department && department !== 'all') {
    employees = employees.filter(e => e.department.toLowerCase() === department.toLowerCase());
  }

  if (shift && shift !== 'all') {
    employees = employees.filter(e => e.shift.toLowerCase().includes(shift.toLowerCase()));
  }

  if (status && status !== 'all') {
    employees = employees.filter(e => e.status.toLowerCase() === status.toLowerCase());
  }

  res.json({ success: true, count: employees.length, employees });
});

// GET /api/employees/stats - Employee metrics & payroll overview
router.get('/stats', (req, res) => {
  const employees = db.getCollection('employees');
  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const onLeaveCount = employees.filter(e => e.status === 'On Leave').length;
  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

  // Department breakdown
  const departments = {};
  employees.forEach(e => {
    departments[e.department] = (departments[e.department] || 0) + 1;
  });

  res.json({
    success: true,
    stats: {
      totalEmployees,
      activeCount,
      onLeaveCount,
      totalPayroll,
      departments
    }
  });
});

// GET /api/employees/:id
router.get('/:id', (req, res) => {
  const emp = db.findById('employees', req.params.id) ||
              db.getCollection('employees').find(e => e.staffId === req.params.id);
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }
  res.json({ success: true, employee: emp });
});

// POST /api/employees - Add employee
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const { name, role, department, shift, salary, contact, email, notes } = req.body;

  if (!name || !role || !department) {
    return res.status(400).json({ success: false, message: 'Name, role, and department are required' });
  }

  const employees = db.getCollection('employees');
  const staffNum = 1000 + employees.length + 1;
  const newEmp = {
    id: `emp_${uuidv4().slice(0, 8)}`,
    staffId: `EMP-${staffNum}`,
    name,
    role,
    department,
    shift: shift || 'Morning (07:00 - 15:30)',
    salary: Number(salary) || 4000,
    contact: contact || '',
    email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@auragrand.com`,
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    notes: notes || 'Hotel operations team member'
  };

  db.insert('employees', newEmp);
  if (db.logActivity) {
    db.logActivity('STAFF_HIRED', `New staff member onboarded: ${newEmp.name} (${newEmp.role} - ${newEmp.department})`, 'Admin');
  }
  res.status(201).json({ success: true, message: 'Employee added successfully', employee: newEmp });
});

// PUT /api/employees/:id - Update employee
router.put('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const emp = db.findById('employees', req.params.id);
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const updated = db.update('employees', req.params.id, req.body);
  res.json({ success: true, message: 'Employee record updated successfully', employee: updated });
});

// DELETE /api/employees/:id - Remove employee
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const deleted = db.delete('employees', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }
  res.json({ success: true, message: 'Employee removed successfully' });
});

module.exports = router;
