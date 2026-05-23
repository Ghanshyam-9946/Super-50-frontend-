import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, ChevronLeft, FolderOpen, FileText, Github, Hash,
  CheckCircle2, XCircle, Calendar, Inbox, ClipboardCheck, Crown, Lock, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, StatCard, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate, semesterToProject } from '../../../utils/pms/helpers';

const ReviewForm = ({ submission, presentation, onReviewed }) => {
  const [marks, setMarks] = useState(submission.marksObtained || '');
  const [comment, setComment] = useState(submission.guideComment || '');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (status) => {
    if (status === 'accepted' && (marks === '' || marks < 0)) {
      toast.error('Enter valid marks');
      return;
    }
    if (status === 'rejected' && !comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setSubmitting(true);
    try {
      await guideAPI.reviewSubmission({
        submissionId: submission._id,
        status,
        marks: Number(marks) || 0,
        comment,
      });
      toast.success(status === 'accepted' ? 'Accepted & locked' : 'Rejected — student can re-upload');
      onReviewed();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
      <h6 className="font-semibold text-sm">Review &amp; Score</h6>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="form-label">
            Marks (out of {presentation.totalMarks})
          </label>
          <input
            type="number"
            min="0"
            max={presentation.totalMarks}
            className="form-input"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Comment</label>
          <input
            className="form-input"
            placeholder="Optional feedback"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => submitReview('accepted')}
          disabled={submitting}
          className="btn-success"
        >
          {submitting ? <Spinner size="sm" className="text-white" /> : <><CheckCircle2 className="w-4 h-4" /> Accept &amp; Lock</>}
        </button>
        <button
          onClick={() => submitReview('rejected')}
          disabled={submitting}
          className="btn-danger"
        >
          <XCircle className="w-4 h-4" /> Reject
        </button>
      </div>
    </div>
  );
};

const GuideReview = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await guideAPI.getTeamForReview(teamId);
      setTeam(res.data.team);
      setReviews(res.data.reviews);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [teamId]);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;
  if (!team) return <Card><EmptyState icon={AlertTriangle} title="Team not found" message="Or not assigned to you." /></Card>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <Link to="/pms/guide/groups" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1 mb-2">
            <ChevronLeft className="w-3 h-3" /> Back to groups
          </Link>
          <h1 className="text-2xl font-bold">{team.groupName}</h1>
          <p className="text-sm text-slate-500 mt-1">{team.projectTitle}</p>
        </div>
      </div>

      {/* Team summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Group No" value={team.groupNo} icon={Hash} color="primary" />
        <StatCard label="Semester" value={`${team.semester}th`} icon={Calendar} color="info" />
        <StatCard label="Project Type" value={team.project?.projectName || semesterToProject(team.semester)} icon={FolderOpen} color="warning" />
        <StatCard label="Members" value={team.members?.length || 0} icon={Users} color="success" />
      </div>

      {/* Members */}
      <Card title="Team Members" icon={Users} noPadding>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Enrollment</th><th>Role</th><th>Mobile</th></tr>
            </thead>
            <tbody>
              {team.members?.map((m, idx) => (
                <tr key={m.student?._id || idx}>
                  <td className="font-semibold">{idx + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {m.role === 'Leader' && <Crown className="w-4 h-4 text-amber-500" />}
                      <strong>{m.student?.name}</strong>
                    </div>
                  </td>
                  <td>{m.student?.enrollmentNo}</td>
                  <td>
                    {m.role === 'Leader' ? <span className="badge-warning">Leader</span> : <span className="badge-secondary">{m.role}</span>}
                  </td>
                  <td className="text-sm text-slate-500">{m.student?.mobile || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SDG */}
      {team.sdgSuggestion && (
        <Card title="SDG / Theme">
          <p className="text-sm text-slate-700">{team.sdgSuggestion}</p>
        </Card>
      )}

      {/* Presentation reviews */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-brand-600" /> Submissions to Review
        </h2>

        {reviews.length === 0 ? (
          <Card><EmptyState icon={Inbox} title="No presentations scheduled yet" /></Card>
        ) : (
          <div className="space-y-4">
            {reviews.map(({ presentation, submission }) => (
              <Card key={presentation._id}>
                <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                      {presentation.presentationTitle}
                      {submission?.isLocked && <span className="badge-success"><Lock className="w-3 h-3" /> Locked</span>}
                    </h3>
                    <div className="text-sm text-slate-500">
                      <Calendar className="w-3 h-3 inline mr-1" /> {formatDate(presentation.presentationDate)}
                      <span className="mx-2">•</span>
                      Marks: <strong>{presentation.totalMarks}</strong>
                      <span className="mx-2">•</span>
                      Presentation #{presentation.presentationNo}
                    </div>
                  </div>
                  {submission && <StatusBadge status={submission.status} />}
                </div>

                {!submission ? (
                  <div className="alert-warning text-sm">
                    <Inbox className="w-4 h-4 flex-shrink-0" /> Awaiting submission from team.
                  </div>
                ) : (
                  <>
                    {/* Files */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {submission.pptFile && (
                        <a href={`/uploads/presentations/${submission.pptFile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg">
                          <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                          <span className="truncate flex-1">PPT File</span>
                          <span className="text-xs text-brand-600">Open ↗</span>
                        </a>
                      )}
                      {submission.reportFile && (
                        <a href={`/uploads/presentations/${submission.reportFile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg">
                          <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate flex-1">Final Report</span>
                          <span className="text-xs text-brand-600">Open ↗</span>
                        </a>
                      )}
                      {submission.gitUrl && (
                        <a href={submission.gitUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg md:col-span-2">
                          <Github className="w-4 h-4 text-slate-700 flex-shrink-0" />
                          <span className="truncate flex-1">{submission.gitUrl}</span>
                          <span className="text-xs text-brand-600">Open ↗</span>
                        </a>
                      )}
                    </div>

                    {/* Review form OR locked status */}
                    {submission.isLocked ? (
                      <div className="alert-success text-sm mt-4">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <strong>Accepted &amp; Locked — Marks: {submission.marksObtained} / {presentation.totalMarks}</strong>
                          {submission.guideComment && <div className="text-xs mt-1">"{submission.guideComment}"</div>}
                        </div>
                      </div>
                    ) : (
                      <ReviewForm submission={submission} presentation={presentation} onReviewed={fetchData} />
                    )}
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideReview;
