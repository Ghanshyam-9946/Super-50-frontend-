import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Trash2, ListChecks, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, confirmAction } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

const AcademicYears = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ yearName: '', startDate: '', endDate: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listYears();
      setYears(res.data.years);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchYears(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminAPI.createYear(form);
      toast.success('Academic year created');
      setForm({ yearName: '', startDate: '', endDate: '', isActive: true });
      fetchYears();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const setActive = async (id) => {
    try {
      await adminAPI.setActiveYear(id);
      toast.success('Year activated');
      fetchYears();
    } catch (err) { toast.error(handleError(err)); }
  };

  const handleDelete = async (id) => {
    if (!confirmAction('Delete this academic year?')) return;
    try {
      await adminAPI.deleteYear(id);
      toast.success('Year deleted');
      fetchYears();
    } catch (err) { toast.error(handleError(err)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Academic Years</h1>
        <p className="text-sm text-slate-500 mt-1">Manage academic years and set the active one.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Add form */}
        <div className="lg:col-span-4">
          <Card title="Add Academic Year" icon={Plus}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Year Name</label>
                <input
                  className="form-input"
                  placeholder="2025-2026"
                  value={form.yearName}
                  onChange={(e) => setForm({ ...form, yearName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                />
                Set as active year
              </label>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <Spinner size="sm" className="text-white" /> : 'Save Year'}
              </button>
            </form>
          </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-8">
          <Card title="All Academic Years" icon={ListChecks} noPadding>
            {loading ? (
              <div className="py-10 flex justify-center"><Spinner /></div>
            ) : years.length === 0 ? (
              <EmptyState icon={Calendar} title="No academic years yet" message="Add your first one using the form on the left." />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Year</th><th>Start</th><th>End</th><th>Status</th><th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {years.map((y) => (
                      <tr key={y._id}>
                        <td className="font-semibold">{y.yearName}</td>
                        <td>{formatDate(y.startDate)}</td>
                        <td>{formatDate(y.endDate)}</td>
                        <td>
                          {y.isActive ? (
                            <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Active</span>
                          ) : (
                            <span className="badge-secondary">Inactive</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            {!y.isActive && (
                              <button onClick={() => setActive(y._id)} className="btn-outline btn-sm">
                                <CheckCircle2 className="w-3 h-3" /> Set Active
                              </button>
                            )}
                            <button onClick={() => handleDelete(y._id)} className="btn-secondary btn-sm">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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

export default AcademicYears;
