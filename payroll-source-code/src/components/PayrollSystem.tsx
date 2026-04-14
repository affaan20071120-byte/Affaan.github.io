import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, LayoutDashboard, Users, Calculator, PieChart, MessageSquare, 
  Search, Menu, Trash2, Edit2, FileText, ArrowUpDown, TrendingUp, 
  ReceiptText, Settings, HelpCircle, Database, LogOut 
} from 'lucide-react';
import { UniverseBackground } from './UniverseBackground';
import { Employee, calculateSalaryComponents } from '../types';
import { cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ChatBot } from './ChatBot';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// --- Components ---

const SalaryStats = ({ employees }: { employees: Employee[] }) => {
  if (employees.length === 0) return null;

  const totalNet = employees.reduce((sum, e) => sum + e.netSalary, 0);
  const totalBonus = employees.reduce((sum, e) => sum + e.bonus, 0);
  const totalAllowance = employees.reduce((sum, e) => sum + e.allowance, 0);
  const avgNet = totalNet / employees.length;

  const stats = [
    { label: 'Total Employees', value: employees.length, color: 'text-cyan-400' },
    { label: 'Total Bonus', value: `₹${totalBonus.toLocaleString()}`, color: 'text-emerald-400' },
    { label: 'Total Allowance', value: `₹${totalAllowance.toLocaleString()}`, color: 'text-emerald-400' },
    { label: 'Average Net', value: `₹${avgNet.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: 'text-amber-400' },
    { label: 'Total Payroll', value: `₹${totalNet.toLocaleString()}`, color: 'text-indigo-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-slate-900/60 border border-slate-700 p-4 rounded-xl backdrop-blur-md"
        >
          <p className="text-slate-400 text-xs font-medium mb-1">{stat.label}</p>
          <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

const SalaryGraph = ({ employees }: { employees: Employee[] }) => {
  if (employees.length === 0) return null;

  const data = employees.map(e => ({
    name: e.name,
    netSalary: e.netSalary,
    tax: e.tax,
  }));

  return (
    <div className="bg-slate-900/60 border border-slate-700 p-6 rounded-xl backdrop-blur-md mb-6 h-[400px]">
      <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
        <TrendingUp size={20} /> Net Salary vs Tax Split Graph
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend verticalAlign="top" height={36}/>
          <Area 
            type="monotone" 
            dataKey="netSalary" 
            name="Net Salary" 
            stroke="#10b981" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorNet)" 
          />
          <Area 
            type="monotone" 
            dataKey="tax" 
            name="Tax" 
            stroke="#f43f5e" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorTax)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const EmployeeForm = ({ 
  onSave, 
  onCancel, 
  initialData 
}: { 
  onSave: (data: Partial<Employee>) => void, 
  onCancel: () => void,
  initialData?: Employee
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>(initialData || {
    empno: undefined,
    name: '',
    job: 'OFFICER',
    basicSalary: 0,
    bonus: 0,
    allowance: 0,
    carInsurance: 0,
    healthInsurance: 0,
    experience: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none" />
        
        <h2 className="text-2xl font-bold text-rose-500 mb-6 text-center">
          {initialData ? '✏️ Edit Employee' : '➕ Add Employee'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-cyan-400 text-xs font-bold mb-1">📝 Employee Number</label>
            <input
              type="number"
              required
              disabled={!!initialData}
              value={formData.empno || ''}
              onChange={e => setFormData({ ...formData, empno: parseInt(e.target.value) })}
              className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
              placeholder="Type here..."
            />
          </div>

          <div>
            <label className="block text-cyan-400 text-xs font-bold mb-1">👤 Employee Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
              placeholder="Type here..."
            />
          </div>

          <div>
            <label className="block text-cyan-400 text-xs font-bold mb-1">💼 Job Title (Type or Select)</label>
            <input
              list="job-titles"
              value={formData.job || ''}
              onChange={e => setFormData({ ...formData, job: e.target.value })}
              className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
              placeholder="Select or type job title..."
            />
            <datalist id="job-titles">
              <option value="OFFICER" />
              <option value="MANAGER" />
              <option value="TEACHER" />
              <option value="CLERK" />
              <option value="ASSISTANT" />
              <option value="SUPERVISOR" />
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-cyan-400 text-xs font-bold mb-1">💰 Basic Salary</label>
              <input
                type="number"
                required
                value={formData.basicSalary || ''}
                onChange={e => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) })}
                className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-cyan-400 text-xs font-bold mb-1">🎁 Bonus</label>
              <input
                type="number"
                value={formData.bonus || ''}
                onChange={e => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-cyan-400 text-xs font-bold mb-1">🎟️ Other Allowance</label>
            <input
              type="number"
              value={formData.allowance || ''}
              onChange={e => setFormData({ ...formData, allowance: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-cyan-400 text-xs font-bold mb-1">🚗 Car Insurance</label>
              <input
                type="number"
                value={formData.carInsurance || ''}
                onChange={e => setFormData({ ...formData, carInsurance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-cyan-400 text-xs font-bold mb-1">🏥 Health Insurance</label>
              <input
                type="number"
                value={formData.healthInsurance || ''}
                onChange={e => setFormData({ ...formData, healthInsurance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-cyan-400 text-xs font-bold mb-1">📅 Experience (Years)</label>
            <input
              type="number"
              value={formData.experience || ''}
              onChange={e => setFormData({ ...formData, experience: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white/5 border-2 border-rose-500/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none transition-all"
              placeholder="0"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              SAVE
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

// --- Main Payroll System Component ---

export const PayrollSystem: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTableVisible, setIsTableVisible] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee, direction: 'asc' | 'desc' } | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const handleExportPDF = () => {
    if (employees.length === 0) {
      alert('No data to export!');
      return;
    }

    const doc = new jsPDF('landscape');
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('Payroll Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = employees.map(emp => [
      emp.empno,
      emp.name,
      emp.job,
      `Rs. ${emp.basicSalary.toLocaleString()}`,
      `Rs. ${emp.bonus.toLocaleString()}`,
      `Rs. ${emp.allowance.toLocaleString()}`,
      `Rs. ${emp.da.toLocaleString()}`,
      `Rs. ${emp.hra.toLocaleString()}`,
      `Rs. ${emp.grossSalary.toLocaleString()}`,
      `Rs. ${emp.tax.toLocaleString()}`,
      `Rs. ${emp.netSalary.toLocaleString()}`
    ]);

    doc.autoTable({
      startY: 35,
      head: [['Emp No', 'Name', 'Job', 'Basic', 'Bonus', 'Allow', 'DA', 'HRA', 'Gross', 'Tax', 'Net']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`payroll_report_${Date.now()}.pdf`);
  };

  const handleSaveEmployee = (data: Partial<Employee>) => {
    const { da, hra, grossSalary, tax, netSalary } = calculateSalaryComponents(
      data.job!,
      data.basicSalary!,
      data.bonus || 0,
      data.allowance || 0,
      data.carInsurance || 0,
      data.healthInsurance || 0
    );

    const newEmployee: Employee = {
      ...data as Employee,
      da,
      hra,
      grossSalary,
      tax,
      netSalary,
      bonus: data.bonus || 0,
      allowance: data.allowance || 0,
      carInsurance: data.carInsurance || 0,
      healthInsurance: data.healthInsurance || 0,
      experience: data.experience || 0,
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    if (editingEmployee) {
      setEmployees(employees.map(e => e.empno === editingEmployee.empno ? newEmployee : e));
    } else {
      if (employees.some(e => e.empno === newEmployee.empno)) {
        alert('Employee number already exists!');
        return;
      }
      setEmployees([...employees, newEmployee]);
    }

    setShowForm(false);
    setEditingEmployee(undefined);
  };

  const handleDelete = (empno: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(e => e.empno !== empno));
    }
  };

  const handleSort = (key: keyof Employee) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredEmployees = sortedEmployees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.empno.toString().includes(searchQuery)
  );

  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleShowBreakdown = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowBreakdown(true);
  };

  const sidebarItems = [
    { label: 'Add Employee', icon: Plus, color: 'border-[#ff0000] text-[#ff0000]', onClick: () => { setEditingEmployee(undefined); setShowForm(true); } },
    { label: 'Edit Employee', icon: Edit2, color: 'border-[#ff6b35] text-[#ff6b35]', onClick: () => {
      const selected = employees[0]; 
      if (selected) { setEditingEmployee(selected); setShowForm(true); }
      else alert('Please select an employee from the table first.');
    }},
    { label: 'Delete', icon: Trash2, color: 'border-[#00ff88] text-[#00ff88]', onClick: () => {
      if (employees.length > 0) handleDelete(employees[0].empno);
    }},
    { label: isTableVisible ? 'Hide Table' : 'Show Table', icon: isTableVisible ? X : Users, color: 'border-[#ffa502] text-[#ffa502]', onClick: () => setIsTableVisible(!isTableVisible) },
    { label: 'Export PDF', icon: FileText, color: 'border-[#9b59b6] text-[#9b59b6]', onClick: handleExportPDF },
    { label: 'Sort Table', icon: ArrowUpDown, color: 'border-[#00d2ff] text-[#00d2ff]', onClick: () => handleSort('netSalary') },
    { label: 'Salary Stats', icon: TrendingUp, color: 'border-[#f9ca24] text-[#f9ca24]', onClick: () => setShowStatsModal(true) },
    { label: 'Breakdown', icon: ReceiptText, color: 'border-[#e056fd] text-[#e056fd]', onClick: () => {
      if (employees.length > 0) handleShowBreakdown(employees[0]);
      else alert('Please add an employee first.');
    }},
    { label: 'AI ChatBot', icon: MessageSquare, color: 'border-[#fd79a8] text-[#fd79a8]', onClick: () => setIsChatOpen(true) },
    { label: 'Settings', icon: Settings, color: 'border-slate-500 text-slate-500', onClick: () => alert('⚙️ Settings: Configuration options coming soon!') },
    { label: 'Backup Data', icon: Database, color: 'border-indigo-500 text-indigo-500', onClick: () => alert('💾 Backup: Data backup initiated! (Simulation)') },
    { label: 'Help Center', icon: HelpCircle, color: 'border-cyan-500 text-cyan-500', onClick: () => alert('❓ Help: Contact Mohammed Affaan for support.') },
    { label: 'Logout', icon: LogOut, color: 'border-rose-700 text-rose-700', onClick: () => window.location.reload() },
  ];

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-[#0a0a1a]/90 backdrop-blur-xl border-r border-blue-500/50 overflow-hidden flex flex-col"
      >
        <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
          <div className="bg-[#1a2a4a] border-2 border-blue-500/50 rounded-2xl p-4 flex items-center justify-center gap-3 mb-8 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-1.5 rounded-lg">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <h1 className="text-blue-500 font-black text-xl tracking-tighter">PAYROLL</h1>
          </div>

          <nav className="space-y-4">
            {sidebarItems.map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border-4 transition-all hover:scale-105 active:scale-95 bg-transparent font-bold text-base",
                  item.color
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 bg-blue-500/20 border-2 border-blue-500 text-blue-500 rounded-full hover:bg-blue-500/30 transition-all"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="🔍 Search by name or employee number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border-2 border-slate-700 rounded-full py-3 pl-12 pr-6 text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <SalaryStats employees={employees} />
          <SalaryGraph employees={employees} />

          {isTableVisible && (
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl overflow-hidden backdrop-blur-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-500/20 text-white">
                    {[
                      { label: 'Emp No', key: 'empno' },
                      { label: 'Name', key: 'name' },
                      { label: 'Job', key: 'job' },
                      { label: 'Exp', key: 'experience' },
                      { label: 'Basic', key: 'basicSalary' },
                      { label: 'Bonus', key: 'bonus' },
                      { label: 'Allow', key: 'allowance' },
                      { label: 'Car Ins', key: 'carInsurance' },
                      { label: 'Health Ins', key: 'healthInsurance' },
                      { label: 'Gross', key: 'grossSalary' },
                      { label: 'Tax', key: 'tax' },
                      { label: 'Net', key: 'netSalary' },
                      { label: 'Time', key: 'entryTime' }
                    ].map((col) => (
                      <th 
                        key={col.key}
                        onClick={() => handleSort(col.key as keyof Employee)}
                        className="p-4 font-bold text-sm cursor-pointer hover:bg-blue-500/30 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          {col.label}
                          <ArrowUpDown size={14} className="opacity-50" />
                        </div>
                      </th>
                    ))}
                    <th className="p-4 font-bold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <AnimatePresence>
                    {filteredEmployees.map((emp) => (
                      <motion.tr
                        key={emp.empno}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-slate-800 hover:bg-blue-500/10 transition-all group"
                      >
                        <td className="p-4">{emp.empno}</td>
                        <td className="p-4 font-medium text-white">{emp.name}</td>
                        <td className="p-4">{emp.job}</td>
                        <td className="p-4">{emp.experience}y</td>
                        <td className="p-4">₹{emp.basicSalary.toLocaleString()}</td>
                        <td className="p-4 text-emerald-400">₹{emp.bonus.toLocaleString()}</td>
                        <td className="p-4 text-emerald-400">₹{emp.allowance.toLocaleString()}</td>
                        <td className="p-4 text-rose-400">₹{emp.carInsurance.toLocaleString()}</td>
                        <td className="p-4 text-rose-400">₹{emp.healthInsurance.toLocaleString()}</td>
                        <td className="p-4 text-amber-400 font-bold">₹{emp.grossSalary.toLocaleString()}</td>
                        <td className="p-4 text-rose-400">₹{emp.tax.toLocaleString()}</td>
                        <td className="p-4 text-cyan-400 font-bold">₹{emp.netSalary.toLocaleString()}</td>
                        <td className="p-4 text-xs text-slate-500">{emp.entryTime}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredEmployees.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  <Users size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No employees found. Add some to get started!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showForm && (
          <EmployeeForm
            onSave={handleSaveEmployee}
            onCancel={() => { setShowForm(false); setEditingEmployee(undefined); }}
            initialData={editingEmployee}
          />
        )}
        {showStatsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border-2 border-[#f9ca24] rounded-2xl p-8 w-full max-w-4xl shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#f9ca24]">📈 Salary Statistics</h2>
                <button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <SalaryStats employees={employees} />
              <div className="mt-8">
                <SalaryGraph employees={employees} />
              </div>
            </div>
          </motion.div>
        )}
        {showBreakdown && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border-2 border-[#e056fd] rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
              <h2 className="text-xl font-bold text-[#e056fd] mb-6 text-center">
                🧾 {selectedEmployee.name} — Salary Breakdown
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Employee No', value: selectedEmployee.empno, color: 'text-cyan-400' },
                  { label: 'Job Title', value: selectedEmployee.job, color: 'text-blue-400' },
                  { label: 'Experience', value: `${selectedEmployee.experience} Years`, color: 'text-white' },
                  { label: 'Basic Salary', value: `₹${selectedEmployee.basicSalary.toLocaleString()}`, color: 'text-white' },
                  { label: '+ DA', value: `₹${selectedEmployee.da.toLocaleString()}`, color: 'text-emerald-400' },
                  { label: '+ HRA', value: `₹${selectedEmployee.hra.toLocaleString()}`, color: 'text-emerald-400' },
                  { label: '+ Bonus', value: `₹${selectedEmployee.bonus.toLocaleString()}`, color: 'text-emerald-400' },
                  { label: '+ Allowance', value: `₹${selectedEmployee.allowance.toLocaleString()}`, color: 'text-emerald-400' },
                  { label: '= Gross Salary', value: `₹${selectedEmployee.grossSalary.toLocaleString()}`, color: 'text-amber-400' },
                  { label: '− Tax', value: `₹${selectedEmployee.tax.toLocaleString()}`, color: 'text-rose-400' },
                  { label: '− Car Insurance', value: `₹${selectedEmployee.carInsurance.toLocaleString()}`, color: 'text-rose-400' },
                  { label: '− Health Insurance', value: `₹${selectedEmployee.healthInsurance.toLocaleString()}`, color: 'text-rose-400' },
                  { label: '✅ Net Salary', value: `₹${selectedEmployee.netSalary.toLocaleString()}`, color: 'text-yellow-400' },
                  { label: '🕒 Entry Time', value: selectedEmployee.entryTime, color: 'text-slate-500' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-400 text-sm">{item.label}</span>
                    <span className={cn("font-bold", item.color)}>{item.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowBreakdown(false)}
                className="w-full mt-6 bg-[#e056fd] hover:bg-[#c030d0] text-white font-bold py-3 rounded-xl transition-all"
              >
                CLOSE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};
