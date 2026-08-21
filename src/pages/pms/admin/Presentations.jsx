import { useState, useEffect } from 'react';
import { CalendarPlus, Presentation, Trash2, Info, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, confirmAction } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

const blankForm = {
  academicYear: '', semester: '', presentationTitle: '',
  presentationNo: '1', presentationDate: '', totalMarks: '100', criteria: '',
};

const Presentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedYear = years.find((y) => y._id === form.academicYear);
  const dateMin = selectedYear?.startDate ? selectedYear.startDate.slice(0, 10) : undefined;
  const dateMax = selectedYear?.endDate ? selectedYear.endDate.slice(0, 10) : undefined;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, yRes] = await Promise.all([
        adminAPI.listPresentations(),
        adminAPI.listYears(),
      ]);
      setPresentations(pRes.data.presentations);
      setYears(yRes.data.years);
      const active = yRes.data.years.find((y) => y.isActive);
      if (active && !form.academicYear) {
        setForm((f) => ({ ...f, academicYear: active._id }));
      }
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      academicYear: p.academicYear?._id || '',
      semester: String(p.semester),
      presentationTitle: p.presentationTitle,
      presentationNo: String(p.presentationNo),
      presentationDate: p.presentationDate?.slice(0, 10) || '',
      totalMarks: String(p.totalMarks),
      criteria: p.criteria || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await adminAPI.updatePresentation(editingId, form);
        toast.success('Presentation updated');
        setEditingId(null);
        setForm(blankForm);
      } else {
        await adminAPI.createPresentation(form);
        toast.success('Presentation scheduled');
        setForm({ ...form, presentationTitle: '', presentationDate: '', criteria: '' });
      }
      fetchData();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirmAction('Delete this presentation?')) return;
    try {
      await adminAPI.deletePresentation(id);
      toast.success('Deleted');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule Presentations</h1>
        <p className="text-sm text-slate-500 mt-1">Project type is auto-resolved from semester.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <Card title={editingId ? 'Edit Presentation' : 'New Presentation'} icon={editingId ? Pencil : CalendarPlus}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Academic Year</label>
                <select className="form-select" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required>
                  <option value="">Select year</option>
                  {years.map((y) => (
                    <option key={y._id} value={y._id}>{y.yearName}{y.isActive ? ' (active)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Semester</label>
                <select className="form-select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required>
                  <option value="">Select semester</option>
                  <option value="5">5th — Minor-1</option>
                  <option value="6">6th — Minor-2</option>
                  <option value="7">7th — Major-1</option>
                  <option value="8">8th — Major-2</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="form-label">Title</label>
                  <input className="form-input" placeholder="Presentation-1" value={form.presentationTitle} onChange={(e) => setForm({ ...form, presentationTitle: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">No.</label>
                  <select className="form-select" value={form.presentationNo} onChange={(e) => setForm({ ...form, presentationNo: e.target.value })} required>
                    <option>1</option><option>2</option><option>3</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.presentationDate}
                    onChange={(e) => setForm({ ...form, presentationDate: e.target.value })}
                    min={dateMin}
                    max={dateMax}
                    required
                  />
                  {selectedYear && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Must fall within {selectedYear.yearName} ({formatDate(selectedYear.startDate)} – {formatDate(selectedYear.endDate)})
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Total Marks</label>
                  <input type="number" className="form-input" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="form-label">Criteria</label>
                <textarea className="form-input" rows="2" value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} />
              </div>
              <div className="alert-info text-xs"><Info className="w-4 h-4 flex-shrink-0" /> Project type auto-mapped from semester.</div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Spinner size="sm" className="text-white" /> : editingId ? 'Update' : 'Schedule'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="btn-secondary">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card title="All Scheduled Presentations" icon={Presentation} noPadding>
            {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
              : presentations.length === 0 ? <EmptyState icon={Presentation} title="Nothing scheduled yet" />
              : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Title</th><th>Year</th><th>Sem</th><th>Project</th><th>Date</th><th>Marks</th><th className="text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {presentations.map((p) => (
                        <tr key={p._id}>
                          <td className="font-semibold">{p.presentationTitle}</td>
                          <td>{p.academicYear?.yearName}</td>
                          <td><span className="badge-info">{p.semester}th</span></td>
                          <td><span className="badge-primary">{p.project?.projectName}</span></td>
                          <td>{formatDate(p.presentationDate)}</td>
                          <td>{p.totalMarks}</td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => startEdit(p)} className="btn-outline btn-sm">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(p._id)} className="btn-secondary btn-sm">
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

export default Presentations;
