import { useState, useEffect } from 'react';
import { ArrowUp, CheckSquare, AlertTriangle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, confirmAction } from '../../../components/pms/Common';

const Promote = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromSemester, setFromSemester] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listStudents();
      setStudents(res.data.students.filter((s) => s.isActive && s.semester < 8));
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBulk = async (e) => {
    e.preventDefault();
    if (!fromSemester) return toast.error('Select semester');
    if (!confirmAction(`Promote all ${fromSemester}th sem students to ${Number(fromSemester) + 1}th?`)) return;
    setSubmitting(true);
    try {
      const res = await adminAPI.bulkPromote({ fromSemester });
      toast.success(`Promoted ${res.data.modifiedCount} students`);
      setFromSemester('');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? students.map((s) => s._id) : []);
  };

  const handleSelective = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return toast.error('Select at least one student');
    if (!confirmAction(`Promote ${selectedIds.length} selected students?`)) return;
    setSubmitting(true);
    try {
      const res = await adminAPI.selectivePromote({ studentIds: selectedIds });
      toast.success(`Promoted ${res.data.modifiedCount} students`);
      setSelectedIds([]);
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Promote Students</h1>
        <p className="text-sm text-slate-500 mt-1">Move students to the next semester at the end of an academic year.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bulk */}
        <div className="lg:col-span-5">
          <Card title="Bulk Promote by Semester" icon={ArrowUp}>
            <form onSubmit={handleBulk} className="space-y-4">
              <div>
                <label className="form-label">Promote students currently in</label>
                <select className="form-select" value={fromSemester} onChange={(e) => setFromSemester(e.target.value)} required>
                  <option value="">Select semester</option>
                  <option value="5">5th → 6th</option>
                  <option value="6">6th → 7th</option>
                  <option value="7">7th → 8th</option>
                </select>
              </div>
              <div className="alert-warning text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Action will increment semester for all matching students.
              </div>
              <button disabled={submitting} className="btn-primary w-full">
                {submitting ? <Spinner size="sm" className="text-white" /> : <><ArrowUp className="w-4 h-4" /> Bulk Promote</>}
              </button>
            </form>
          </Card>
        </div>

        {/* Selective */}
        <div className="lg:col-span-7">
          <Card
            title="Selective Promote"
            icon={CheckSquare}
            action={<span className="text-xs text-slate-500">Pick specific students</span>}
            noPadding
          >
            <form onSubmit={handleSelective}>
              {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
                : students.length === 0 ? <EmptyState icon={Users} title="No students to promote" />
                : (
                  <>
                    <div className="overflow-x-auto max-h-[480px]">
                      <table className="data-table">
                        <thead className="sticky top-0">
                          <tr>
                            <th className="w-10">
                              <input
                                type="checkbox"
                                onChange={(e) => toggleSelectAll(e.target.checked)}
                                checked={selectedIds.length === students.length && students.length > 0}
                                className="rounded"
                              />
                            </th>
                            <th>Name</th><th>Enrollment</th><th>Sem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((s) => (
                            <tr key={s._id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(s._id)}
                                  onChange={() => toggleSelect(s._id)}
                                  className="rounded"
                                />
                              </td>
                              <td className="font-semibold">{s.name}</td>
                              <td className="text-sm">{s.enrollmentNo}</td>
                              <td><span className="badge-info">{s.semester}th</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-5 py-3 bg-slate-50 border-t flex justify-between items-center">
                      <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
                      <button disabled={submitting || selectedIds.length === 0} className="btn-primary">
                        {submitting ? <Spinner size="sm" className="text-white" /> : <><ArrowUp className="w-4 h-4" /> Promote Selected</>}
                      </button>
                    </div>
                  </>
                )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Promote;
