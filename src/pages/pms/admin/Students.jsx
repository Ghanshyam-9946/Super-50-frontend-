import { useState, useEffect, useRef } from 'react';
import {
  Users, Trash2, UserX, UserPlus, Upload, Edit3, Download,
  CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet, KeyRound, Info, Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal, confirmAction } from '../../../components/pms/Common';
import { getInitial } from '../../../utils/pms/helpers';

// =================== ADD STUDENT MODAL ===================
const AddStudentModal = ({ open, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '', enrollmentNo: '', email: '', mobile: '', whatsapp: '',
    semester: '5', password: '', sendEmail: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => {
    setForm({ name: '', enrollmentNo: '', email: '', mobile: '', whatsapp: '', semester: '5', password: '', sendEmail: true });
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminAPI.createStudent(form);
      setResult(res.data);
      toast.success(`Student "${res.data.student.name}" created`);
      onSaved();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add New Student"
      size="lg"
      footer={
        !result && (
          <>
            <button onClick={handleClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? <Spinner size="sm" className="text-white" /> : <><UserPlus className="w-4 h-4" /> Create Student</>}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-lg font-bold mb-1">Student Created!</h3>
          <p className="text-sm text-slate-500 mb-5">{result.student.name} ({result.student.enrollmentNo})</p>

          <div className="bg-slate-50 rounded-lg p-4 text-left mb-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Auto-generated password</div>
            <div className="font-mono font-bold text-lg bg-amber-100 inline-block px-3 py-1 rounded">{result.generatedPassword}</div>
          </div>

          {result.emailSent && (
            <div className="alert-success text-sm">
              <Mail className="w-4 h-4" /> Credentials sent to {result.student.email}
            </div>
          )}
          {result.emailError && (
            <div className="alert-warning text-sm">
              <AlertTriangle className="w-4 h-4" /> Email send failed: {result.emailError}
            </div>
          )}
          {!result.emailSent && !result.emailError && !result.student.email && (
            <div className="alert-info text-sm">
              <Info className="w-4 h-4" /> No email provided. Share password manually with student.
            </div>
          )}

          <div className="flex gap-2 justify-center mt-5">
            <button onClick={reset} className="btn-outline btn-sm">Add Another</button>
            <button onClick={handleClose} className="btn-primary btn-sm">Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Enrollment Number *</label>
            <input className="form-input" value={form.enrollmentNo} onChange={(e) => setForm({ ...form, enrollmentNo: e.target.value.toUpperCase() })} required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="for credentials email" />
          </div>
          <div>
            <label className="form-label">Mobile</label>
            <input type="tel" className="form-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Semester *</label>
            <select className="form-select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required>
              <option value="5">5th Semester</option>
              <option value="6">6th Semester</option>
              <option value="7">7th Semester</option>
              <option value="8">8th Semester</option>
            </select>
          </div>
          <div>
            <label className="form-label">WhatsApp</label>
            <input type="tel" className="form-input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Password <span className="text-slate-400 text-xs font-normal">(leave blank for auto-generated)</span></label>
            <input className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto-generated if empty" />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} />
              <Mail className="w-4 h-4 text-slate-500" /> Email credentials to student (requires email + SMTP setup)
            </label>
          </div>
        </form>
      )}
    </Modal>
  );
};

// =================== EDIT STUDENT MODAL ===================
const EditStudentModal = ({ open, onClose, student, onSaved }) => {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || '',
        email: student.email || '',
        mobile: student.mobile || '',
        whatsapp: student.whatsapp || '',
        semester: String(student.semester || '5'),
        password: '',
        sendEmail: false,
      });
    }
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminAPI.updateStudent(student._id, form);
      toast.success(`Student updated${res.data.passwordChanged ? ' & password reset' : ''}`);
      if (res.data.emailSent) toast.success('New credentials emailed');
      onSaved();
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  if (!student) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Student — ${student.enrollmentNo}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : <>Save Changes</>}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="form-label">Enrollment</label>
          <input className="form-input bg-slate-50" value={student.enrollmentNo} disabled />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="form-label">Mobile</label>
          <input type="tel" className="form-input" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        </div>
        <div>
          <label className="form-label">Semester</label>
          <select className="form-select" value={form.semester || '5'} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            <option value="5">5th</option><option value="6">6th</option><option value="7">7th</option><option value="8">8th</option>
          </select>
        </div>
        <div>
          <label className="form-label">WhatsApp</label>
          <input type="tel" className="form-input" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </div>
        <div className="sm:col-span-2 mt-2 pt-3 border-t border-slate-100">
          <label className="form-label flex items-center gap-2"><KeyRound className="w-4 h-4 text-amber-500" /> Reset Password <span className="text-slate-400 text-xs font-normal">(leave blank to keep current)</span></label>
          <input className="form-input" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New password" />
        </div>
        {form.password && (
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} />
              <Mail className="w-4 h-4 text-slate-500" /> Email new credentials to student
            </label>
          </div>
        )}
      </form>
    </Modal>
  );
};

// =================== BULK UPLOAD MODAL ===================
const BulkUploadModal = ({ open, onClose, onUploaded }) => {
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [defaultSemester, setDefaultSemester] = useState('5');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);

  const reset = () => {
    setFile(null);
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
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sendEmails', sendEmails);
      formData.append('defaultSemester', defaultSemester);
      const res = await adminAPI.bulkUploadStudents(formData);
      setSummary(res.data.summary);
      toast.success(`Uploaded ${res.data.summary.created} students`);
      onUploaded();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk Upload Students"
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
        // ============= SUMMARY VIEW =============
        <div>
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">Upload Complete</h3>
            <p className="text-sm text-slate-500">Processed {summary.total} rows</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">{summary.created}</div>
              <div className="text-xs text-emerald-600 uppercase">Created</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">{summary.skipped}</div>
              <div className="text-xs text-amber-600 uppercase">Skipped</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{summary.failed}</div>
              <div className="text-xs text-red-600 uppercase">Failed</div>
            </div>
            <div className="bg-brand-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-brand-700">{summary.emailsSent}</div>
              <div className="text-xs text-brand-600 uppercase">Emails Sent</div>
            </div>
          </div>

          {summary.errors && summary.errors.length > 0 && (
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
        // ============= FORM VIEW =============
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="alert-info text-sm">
            <Info className="w-4 h-4 flex-shrink-0" />
            <div>
              <strong>Required columns:</strong> Name, Enrollment No (Roll Number), Semester
              <br />
              <strong>Optional:</strong> Email, Mobile, WhatsApp, Section
              <br />
              <a href={adminAPI.sampleTemplateUrl} className="text-brand-700 font-semibold inline-flex items-center gap-1 mt-1.5">
                <Download className="w-3 h-3" /> Download CSV template
              </a>
            </div>
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

          <div>
            <label className="form-label">Default semester <span className="text-slate-400 text-xs font-normal">(used if column missing)</span></label>
            <select className="form-select" value={defaultSemester} onChange={(e) => setDefaultSemester(e.target.value)}>
              <option value="5">5th Semester</option>
              <option value="6">6th Semester</option>
              <option value="7">7th Semester</option>
              <option value="8">8th Semester</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" className="rounded" checked={sendEmails} onChange={(e) => setSendEmails(e.target.checked)} />
            <Mail className="w-4 h-4 text-slate-500" />
            <span>Email login credentials to each student (requires SMTP setup in <code>.env</code>)</span>
          </label>
        </form>
      )}
    </Modal>
  );
};

// =================== MAIN PAGE ===================
const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listStudents();
      setStudents(res.data.students);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = async (id) => {
    try {
      await adminAPI.toggleStudent(id);
      toast.success('Status updated');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  const handleDelete = async (id, name) => {
    if (!confirmAction(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteStudent(id);
      toast.success('Deleted');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  // Filter
  const filtered = students.filter((s) => {
    if (semFilter && String(s.semester) !== semFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q)
        || s.enrollmentNo.toLowerCase().includes(q)
        || (s.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Students</h1>
          <p className="text-sm text-slate-500 mt-1">Add students manually or upload in bulk. Emails carry login credentials automatically.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setBulkOpen(true)} className="btn-outline">
            <FileSpreadsheet className="w-4 h-4" /> Bulk Upload
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        title={<>All Students <span className="badge-secondary ml-1">{filtered.length}</span></>}
        icon={Users}
        noPadding
      >
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : filtered.length === 0 ? <EmptyState icon={UserX} title="No students" message="Try changing filters or add a new student." />
          : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Student</th><th>Enrollment</th><th>Mobile</th><th>Sem</th><th>Status</th><th className="text-right">Actions</th></tr>
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
                      <td className="font-semibold">{s.enrollmentNo}</td>
                      <td className="text-sm">{s.mobile || '—'}</td>
                      <td><span className="badge-info">{s.semester}th</span></td>
                      <td>
                        {s.isActive ? <span className="badge-success">Active</span> : <span className="badge-secondary">Inactive</span>}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditStudent(s)} className="btn-outline btn-sm" title="Edit / Reset password">
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={() => toggle(s._id)} className="btn-secondary btn-sm">
                            {s.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(s._id, s.name)} className="btn-secondary btn-sm text-red-600">
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

      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={fetchData} />
      <EditStudentModal open={!!editStudent} onClose={() => setEditStudent(null)} student={editStudent} onSaved={fetchData} />
      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} onUploaded={fetchData} />
    </div>
  );
};

export default Students;
