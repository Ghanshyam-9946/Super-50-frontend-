import { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, confirmAction } from '../../../components/pms/Common';
import { getInitial } from '../../../utils/pms/helpers';

const Guides = () => {
  const [guides, setGuides] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', academicYear: '', assignedSemester: '', password: 'guide@123',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, yRes] = await Promise.all([adminAPI.listGuides(), adminAPI.listYears()]);
      setGuides(gRes.data.guides);
      setYears(yRes.data.years);
      const active = yRes.data.years.find((y) => y.isActive);
      if (active && !form.academicYear) setForm((f) => ({ ...f, academicYear: active._id }));
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminAPI.createGuide(form);
      toast.success('Guide created');
      setForm({ ...form, name: '', email: '', mobile: '', assignedSemester: '' });
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirmAction('Delete this guide?')) return;
    try {
      await adminAPI.deleteGuide(id);
      toast.success('Deleted');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Guides</h1>
        <p className="text-sm text-slate-500 mt-1">Project type auto-mapped from assigned semester.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <Card title="Add Guide" icon={UserPlus}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><label className="form-label">Mobile</label><input type="tel" pattern="[0-9]{10}" className="form-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Academic Year</label>
                  <select className="form-select" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required>
                    <option value="">Select</option>
                    {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Semester</label>
                  <select className="form-select" value={form.assignedSemester} onChange={(e) => setForm({ ...form, assignedSemester: e.target.value })} required>
                    <option value="">Select</option>
                    <option value="5">5th</option><option value="6">6th</option><option value="7">7th</option><option value="8">8th</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Default Password</label>
                <input className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <p className="form-help">Guide can change after first login.</p>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <Spinner size="sm" className="text-white" /> : 'Create Guide'}
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card title="All Guides" icon={Users} noPadding>
            {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
              : guides.length === 0 ? <EmptyState icon={UserCheck} title="No guides yet" />
              : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Mobile</th><th>Sem</th><th>Project</th><th>Year</th><th className="text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {guides.map((g) => (
                        <tr key={g._id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-xs">
                                {getInitial(g.name)}
                              </div>
                              <span className="font-semibold">{g.name}</span>
                            </div>
                          </td>
                          <td className="text-slate-500 text-sm">{g.email}</td>
                          <td className="text-sm">{g.mobile || '—'}</td>
                          <td><span className="badge-info">{g.assignedSemester}th</span></td>
                          <td><span className="badge-primary">{g.assignedProject?.projectName || '—'}</span></td>
                          <td className="text-sm">{g.academicYear?.yearName}</td>
                          <td className="text-right">
                            <button onClick={() => handleDelete(g._id)} className="btn-secondary btn-sm">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Guides;
