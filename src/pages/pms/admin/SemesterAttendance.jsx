import { useState, useEffect, useRef } from 'react';
import {
  CheckSquare, Upload, Download, Trash2, Filter, AlertTriangle,
  CheckCircle2, XCircle, Info, FileSpreadsheet, Search, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal, confirmAction } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

// =========== UPLOAD MODAL ===========
const UploadModal = ({ open, onClose, years, onUploaded }) => {
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [yearId, setYearId] = useState('');
  const [semester, setSemester] = useState('5');
  const [sessionName, setSessionName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);

  const reset = () => {
    setFile(null);
    setYearId('');
    setSemester('5');
    setSessionName('');
    setSummary(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!yearId) return toast.error('Select academic year');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('yearId', yearId);
      fd.append('semester', semester);
      fd.append('sessionName', sessionName);
      const res = await adminAPI.uploadSemesterAttendance(fd);
      setSummary(res.data.summary);
      toast.success(`Processed ${res.data.summary.totalRows} rows`);
      onUploaded();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload Semester Attendance"
      size="lg"
      footer={
        !summary && (
          <>
            <button onClick={handleClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !file} className="btn-primary">
              {submitting ? <Spinner size="sm" className="text-white" /> : <><Upload className="w-4 h-4" /> Upload</>}
            </button>
          </>
        )
      }
    >
      {summary ? (
        <div>
          <div className="text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">Upload Complete</h3>
            <p className="text-sm text-slate-500">Processed {summary.totalRows} rows</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">{summary.created}</div>
              <div className="text-xs text-emerald-600 uppercase">Created</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{summary.updated}</div>
              <div className="text-xs text-blue-600 uppercase">Updated</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">{summary.skipped}</div>
              <div className="text-xs text-amber-600 uppercase">Skipped</div>
            </div>
          </div>
          {summary.errors?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="font-semibold text-sm text-red-700 mb-2 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Issues ({summary.errors.length})
              </div>
              <ul className="text-xs text-red-800 space-y-1 list-disc pl-5">
                {summary.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-2 justify-end mt-5">
            <button onClick={reset} className="btn-outline btn-sm">Upload Another</button>
            <button onClick={handleClose} className="btn-primary btn-sm">Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="alert-info text-sm">
            <Info className="w-4 h-4 flex-shrink-0" />
            <div>
              <strong>Required columns:</strong> Student Name, Enrollment No, Total Days, Total Present.
              <br />Attendance % is auto-calculated.
              <br />
              <a href={adminAPI.semesterAttendanceSampleUrl} className="text-brand-700 font-semibold inline-flex items-center gap-1 mt-1.5">
                <Download className="w-3 h-3" /> Download sample CSV template
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Academic Year *</label>
              <select className="form-select" value={yearId} onChange={(e) => setYearId(e.target.value)} required>
                <option value="">— Select year —</option>
                {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}{y.isActive && ' (Active)'}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Semester *</label>
              <select className="form-select" value={semester} onChange={(e) => setSemester(e.target.value)} required>
                <option value="5">5th Semester (Minor Project-I)</option>
                <option value="6">6th Semester (Minor Project-II)</option>
                <option value="7">7th Semester (Major Project-I)</option>
                <option value="8">8th Semester (Major Project-II)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Session Name (optional)</label>
            <input
              className="form-input"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. Jul-Dec 2025"
            />
          </div>

          <div>
            <label className="form-label">Excel / CSV File *</label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="form-input"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <p className="form-help">XLSX, XLS, or CSV · Max 5 MB</p>
          </div>
        </form>
      )}
    </Modal>
  );
};

// =========== MAIN PAGE ===========
const SemesterAttendance = () => {
  const [records, setRecords] = useState([]);
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({ yearId: '', semester: '', q: '' });
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.yearId) params.yearId = filters.yearId;
      if (filters.semester) params.semester = filters.semester;
      if (filters.q) params.q = filters.q;
      const [r, y] = await Promise.all([
        adminAPI.listSemesterAttendance(params),
        adminAPI.listYears(),
      ]);
      setRecords(r.data.records);
      setYears(y.data.years);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const apply = (e) => { e.preventDefault(); fetchData(); };

  const handleDelete = async (rec) => {
    if (!confirmAction(`Delete attendance record for ${rec.studentName} (${rec.enrollmentNo})?`)) return;
    try {
      await adminAPI.deleteSemesterAttendance(rec._id);
      toast.success('Deleted');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  const handleBulkDelete = async () => {
    if (!filters.yearId || !filters.semester) {
      return toast.error('Select year and semester to bulk delete');
    }
    if (!confirmAction(`Delete ALL attendance records for the selected year + semester ${filters.semester}? This cannot be undone.`)) return;
    try {
      const res = await adminAPI.bulkDeleteSemesterAttendance({
        yearId: filters.yearId, semester: filters.semester,
      });
      toast.success(`Deleted ${res.data.deletedCount} records`);
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  const attendanceColor = (pct) => {
    if (pct >= 75) return 'bg-emerald-100 text-emerald-800';
    if (pct >= 60) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Semester Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Upload semester-wise attendance for Minor-1, Minor-2, Major-1, Major-2. Used in rubric evaluation.</p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary">
          <Upload className="w-4 h-4" /> Upload Attendance
        </button>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={apply} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={filters.yearId} onChange={(e) => setFilters({ ...filters, yearId: e.target.value })}>
              <option value="">All</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
              <option value="">All</option>
              <option value="5">5th (Minor-I)</option>
              <option value="6">6th (Minor-II)</option>
              <option value="7">7th (Major-I)</option>
              <option value="8">8th (Major-II)</option>
            </select>
          </div>
          <div>
            <label className="form-label">Search</label>
            <input
              className="form-input"
              placeholder="Name or enrollment"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-primary flex-1"><Filter className="w-4 h-4" /> Apply</button>
            <button type="button" onClick={handleBulkDelete} disabled={!filters.yearId || !filters.semester} className="btn-secondary text-red-600" title="Bulk delete (year+semester)">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Card>

      {/* Records */}
      <Card title={<>Attendance Records <span className="badge-secondary ml-1">{records.length}</span></>} icon={Users} noPadding>
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : records.length === 0 ? <EmptyState icon={FileSpreadsheet} title="No attendance records" message="Click 'Upload Attendance' to add data." />
          : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Enrollment</th><th>Year</th><th>Sem / Project</th>
                    <th className="text-center">Days</th><th className="text-center">Present</th><th className="text-center">%</th>
                    <th>Uploaded</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="font-semibold">{r.studentName || r.student?.name}</div>
                        {r.sessionName && <div className="text-xs text-slate-500">{r.sessionName}</div>}
                      </td>
                      <td className="font-mono text-xs">{r.enrollmentNo}</td>
                      <td className="text-sm">{r.yearName || r.academicYear?.yearName}</td>
                      <td>
                        <div className="text-sm">{r.projectName}</div>
                        <div className="text-xs text-slate-500">Sem {r.semester}</div>
                      </td>
                      <td className="text-center">{r.totalDays}</td>
                      <td className="text-center">{r.totalPresent}</td>
                      <td className="text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${attendanceColor(r.attendancePercentage)}`}>
                          {r.attendancePercentage}%
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">{formatDate(r.updatedAt)}</td>
                      <td className="text-right">
                        <button onClick={() => handleDelete(r)} className="btn-secondary btn-sm text-red-600">
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

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        years={years}
        onUploaded={fetchData}
      />
    </div>
  );
};

export default SemesterAttendance;
