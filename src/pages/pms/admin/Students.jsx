import { useState, useEffect } from 'react';
import { Users, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { getInitial } from '../../../utils/pms/helpers';

// Read-only, batch-wise view of students — creating, editing, bulk-uploading
// and deleting students all happen in the main admin panel (Admin > All
// Students / Bulk Create), which already owns this data; PMS only displays it.
const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listStudents({ semester: semFilter || undefined, batch: batchFilter || undefined });
      setStudents(res.data.students);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [semFilter, batchFilter]);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const enr = (s.enrollmentNo || s.enrollmentNumber || '').toLowerCase();
    return (s.name || '').toLowerCase().includes(q)
      || enr.includes(q)
      || (s.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-sm text-slate-500 mt-1">
          Read-only — students are added, edited and bulk-uploaded from the main Admin panel.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="form-label">Search</label>
            <input
              className="form-input"
              placeholder="Name, enrollment number, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Batch</label>
            <input
              className="form-input"
              placeholder="e.g. 2022"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
              <option value="">All Semesters</option>
              <option value="5">5th</option>
              <option value="6">6th</option>
              <option value="7">7th</option>
              <option value="8">8th</option>
            </select>
          </div>
        </div>
      </Card>

      <Card
        title={<>Students <span className="badge-secondary ml-1">{filtered.length}</span></>}
        icon={Users}
        noPadding
      >
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : filtered.length === 0 ? <EmptyState icon={UserX} title="No students" message="Try changing filters — students are managed in the main Admin panel." />
            : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>Student</th><th>Enrollment</th><th>Contact (Mobile/Email)</th><th>Sem</th><th>Batch</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-xs">
                              {getInitial(s.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{s.name}</div>
                              <div className="text-xs text-slate-400 truncate">{s.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="font-semibold">{s.enrollmentNo || s.enrollmentNumber || '—'}</td>
                        <td className="text-sm">
                          <div className="flex flex-col">
                            <span>{s.mobile || s.mobileNumber || s.email || '—'}</span>
                          </div>
                        </td>
                        <td><span className="badge-info whitespace-nowrap">{s.semester ? `${s.semester}th` : '—'}</span></td>
                        <td className="text-sm">{s.batch || '—'}</td>
                        <td>
                          {s.isActive ? <span className="badge-success">Active</span> : <span className="badge-secondary">Inactive</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </Card>
    </div>
  );
};

export default Students;
