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
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    userId: '', academicYear: '', assignedSemester: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, yRes, fRes] = await Promise.all([
        adminAPI.listGuides(), adminAPI.listYears(), adminAPI.listFacultyCandidates(),
      ]);
      setGuides(gRes.data.guides);
      setYears(yRes.data.years);
      setFaculty(fRes.data.faculty);
      const active = yRes.data.years.find((y) => y.isActive);
      if (active && !form.academicYear) setForm((f) => ({ ...f, academicYear: active._id }));
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  // Faculty already tagged as a guide don't need to show up again as candidates.
  const guideIds = new Set(guides.map((g) => g._id));
  const availableFaculty = faculty.filter((f) => !guideIds.has(f._id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId) return toast.error('Select a faculty member');
    setSubmitting(true);
    try {
      await adminAPI.assignGuideRole(form);
      toast.success('Faculty assigned as Project Guide');
      setForm((f) => ({ ...f, userId: '', assignedSemester: '' }));
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirmAction('Remove guide access for this faculty member? Their account and other roles are unaffected.')) return;
    try {
      await adminAPI.removeGuideRole(id);
      toast.success('Guide access removed');
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
          <Card title="Assign Project Guide" icon={UserPlus}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Faculty</label>
                <select className="form-select" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required>
                  <option value="">Select faculty</option>
                  {availableFaculty.map((f) => (
                    <option key={f._id} value={f._id}>{f.name} ({f.email}) — {f.role}</option>
                  ))}
                </select>
                <p className="form-help">No new account is created — this only grants an existing faculty account access to PMS as a guide.</p>
              </div>
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
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <Spinner size="sm" className="text-white" /> : 'Assign as Guide'}
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
                            <button onClick={() => handleDelete(g._id)} title="Remove guide access (account is kept)" className="btn-secondary btn-sm">
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
