import { useState, useEffect } from 'react';
import { CloudUpload, Lock, FileText, Github, AlertCircle, CheckCircle2, Calendar, Upload, Inbox, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate, isPastDate, cn } from '../../../utils/pms/helpers';

const SubmitForm = ({ presentation, submission, onSubmitted }) => {
  const [pptFile, setPptFile] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [gitUrl, setGitUrl] = useState(submission?.gitUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pptFile && !submission?.pptFile) {
      toast.error('PPT file is required');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('presentationId', presentation._id);
      if (pptFile) formData.append('pptFile', pptFile);
      if (reportFile) formData.append('reportFile', reportFile);
      if (gitUrl) formData.append('gitUrl', gitUrl);

      await studentAPI.submitPresentation(formData);
      toast.success('Submission uploaded! Guide will review.');
      onSubmitted();
    } catch (err) { toast.error(handleError(err)); }
    finally { setUploading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3 p-4 bg-slate-50 rounded-lg">
      <div>
        <label className="form-label">PPT / Slides File <span className="text-red-500">*</span></label>
        <input
          type="file"
          accept=".ppt,.pptx,.pdf"
          className="form-input"
          onChange={(e) => setPptFile(e.target.files[0])}
        />
        <p className="form-help">.ppt, .pptx or .pdf · Max 30 MB</p>
      </div>

      {presentation.presentationNo >= 2 && (
        <div>
          <label className="form-label">
            <Github className="w-3 h-3 inline mr-1" /> GitHub / Code Repository URL
          </label>
          <input
            type="url"
            className="form-input"
            placeholder="https://github.com/your-team/project"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
          />
        </div>
      )}

      {presentation.presentationNo >= 3 && (
        <div>
          <label className="form-label">Final Report (PDF / DOCX)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="form-input"
            onChange={(e) => setReportFile(e.target.files[0])}
          />
        </div>
      )}

      <button type="submit" disabled={uploading} className="btn-primary">
        {uploading ? <Spinner size="sm" className="text-white" /> : <><Upload className="w-4 h-4" /> Upload Submission</>}
      </button>
    </form>
  );
};

const StudentPresentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getPresentations();
      setPresentations(res.data.presentations);
      setSubmissions(res.data.submissions || {});
      setTeam(res.data.team);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  if (!team) {
    return (
      <Card>
        <EmptyState
          icon={Inbox}
          title="Form a team first"
          message="You need to be in a team to submit presentations."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Presentations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload your slides and code for each scheduled presentation. Locked submissions cannot be re-uploaded.
        </p>
      </div>

      {presentations.length === 0 ? (
        <Card>
          <EmptyState icon={Calendar} title="No presentations scheduled" message="Your guide / admin will schedule them soon." />
        </Card>
      ) : (
        <div className="space-y-4">
          {presentations.map((p) => {
            const sub = submissions[p._id];
            const isOpen = isPastDate(p.presentationDate);
            const isLocked = sub?.isLocked;

            return (
              <Card key={p._id} className={cn(isLocked && 'border-emerald-500')}>
                <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                      {p.presentationTitle}
                      {isLocked && <span className="badge-success"><Lock className="w-3 h-3" /> Locked</span>}
                    </h3>
                    <div className="text-sm text-slate-500 flex items-center gap-3 flex-wrap">
                      <span><Calendar className="w-3 h-3 inline mr-1" /> {formatDate(p.presentationDate)}</span>
                      <span>•</span>
                      <span>Marks: <strong>{p.totalMarks}</strong></span>
                      <span>•</span>
                      <span>Presentation #{p.presentationNo}</span>
                    </div>
                  </div>
                  {sub && <StatusBadge status={sub.status} />}
                </div>

                {/* Locked window */}
                {!isOpen && (
                  <div className="alert-warning text-sm">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <strong>Submission window not open yet.</strong>
                      <div className="text-xs mt-0.5">Opens on {formatDate(p.presentationDate)}</div>
                    </div>
                  </div>
                )}

                {/* Existing submission display */}
                {sub && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                    {sub.pptFile && (
                      <a href={`/uploads/presentations/${sub.pptFile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg">
                        <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                        <span className="truncate flex-1">PPT File</span>
                        <span className="text-xs text-brand-600">Open ↗</span>
                      </a>
                    )}
                    {sub.reportFile && (
                      <a href={`/uploads/presentations/${sub.reportFile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg">
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="truncate flex-1">Final Report</span>
                        <span className="text-xs text-brand-600">Open ↗</span>
                      </a>
                    )}
                    {sub.gitUrl && (
                      <a href={sub.gitUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg md:col-span-2">
                        <Github className="w-4 h-4 text-slate-700 flex-shrink-0" />
                        <span className="truncate flex-1">{sub.gitUrl}</span>
                        <span className="text-xs text-brand-600">Open ↗</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Marks for locked/accepted */}
                {sub?.status === 'accepted' && sub.marksObtained !== null && (
                  <div className="alert-success text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <strong>Awarded: {sub.marksObtained} / {p.totalMarks}</strong>
                      {sub.guideComment && <div className="text-xs mt-1">"{sub.guideComment}"</div>}
                    </div>
                  </div>
                )}

                {/* Rejection notice */}
                {sub?.status === 'rejected' && (
                  <div className="alert-danger text-sm mb-3">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <strong>Rejected — please re-upload</strong>
                      {sub.guideComment && <div className="text-xs mt-1">"{sub.guideComment}"</div>}
                    </div>
                  </div>
                )}

                {/* Upload form (if window open and not locked) */}
                {isOpen && !isLocked && (
                  <SubmitForm presentation={p} submission={sub} onSubmitted={fetchData} />
                )}

                {/* Locked, all done */}
                {isLocked && (
                  <div className="alert-info text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Submission accepted and locked. No further changes allowed.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentPresentations;
