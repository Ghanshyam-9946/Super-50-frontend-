import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle2, AlertOctagon, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { formatDate, formatDateTime } from '../../../utils/pms/helpers';

const REVIEW_BADGE = {
  approved: { label: 'Approved', className: 'badge-success', icon: CheckCircle2 },
  needs_revision: { label: 'Needs Revision', className: 'badge-danger', icon: AlertOctagon },
};

// One review row per report — its own local remarks/status draft, so
// reviewing several students' reports in the same team doesn't share state.
function ReportRow({ report, onReviewed }) {
  const [remarks, setRemarks] = useState(report.guideRemarks || '');
  const [submitting, setSubmitting] = useState(false);
  const badge = report.reviewStatus ? REVIEW_BADGE[report.reviewStatus] : null;

  const review = async (reviewStatus) => {
    setSubmitting(true);
    try {
      const res = await guideAPI.reviewWeeklyReport(report._id, { guideRemarks: remarks, reviewStatus });
      toast.success('Report reviewed');
      onReviewed(res.data.data);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">
          {report.student?.name} ({report.student?.enrollmentNo}) — Week of {formatDate(report.weekStartDate)}
        </div>
        {badge ? (
          <span className={badge.className}><badge.icon className="w-3 h-3" /> {badge.label}</span>
        ) : (
          <span className="badge-warning"><Clock className="w-3 h-3" /> Pending Review</span>
        )}
      </div>
      <div className="text-sm"><strong>Work Done:</strong> {report.workDone}</div>
      <div className="text-sm"><strong>Planned Next:</strong> {report.plannedNext}</div>
      {report.blockers && <div className="text-sm text-amber-600"><strong>Blockers:</strong> {report.blockers}</div>}
      <div className="text-xs text-slate-400">Submitted {formatDateTime(report.submittedAt)}</div>

      <div className="pt-2 border-t border-slate-100 space-y-2">
        <textarea
          className="form-input"
          rows={2}
          placeholder="Remarks for the student..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <div className="flex gap-2">
          <button disabled={submitting} onClick={() => review('approved')} className="btn-primary btn-sm">
            <Send className="w-3 h-3" /> Approve
          </button>
          <button disabled={submitting} onClick={() => review('needs_revision')} className="btn-secondary btn-sm">
            Needs Revision
          </button>
        </div>
      </div>
    </div>
  );
}

const GuideWeeklyReports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const teamIdParam = searchParams.get('teamId') || '';

  const [groups, setGroups] = useState([]);
  const [teamId, setTeamId] = useState(teamIdParam);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guideAPI.getMyGroups()
      .then((res) => setGroups(res.data.groups))
      .catch((err) => toast.error(handleError(err)));
  }, []);

  const fetchReports = async (id) => {
    if (!id) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await guideAPI.getTeamWeeklyReports(id);
      setReports(res.data.data || []);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(teamId); /* eslint-disable-next-line */ }, [teamId]);

  const handleTeamChange = (e) => {
    const id = e.target.value;
    setTeamId(id);
    if (id) setSearchParams({ teamId: id });
  };

  const handleReviewed = (updated) => {
    setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Weekly Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Review your teams' weekly progress reports.</p>
      </div>

      <Card>
        <label className="form-label">Select Team</label>
        <select className="form-select" value={teamId} onChange={handleTeamChange}>
          <option value="">— Select a team —</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>{g.groupNo} — {g.groupName}</option>
          ))}
        </select>
      </Card>

      {!teamId ? (
        <EmptyState icon={FileText} title="Select a team to view its weekly reports" />
      ) : loading ? (
        <div className="py-10 flex justify-center"><Spinner /></div>
      ) : reports.length === 0 ? (
        <EmptyState icon={FileText} title="No weekly reports submitted yet for this team" />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => <ReportRow key={r._id} report={r} onReviewed={handleReviewed} />)}
        </div>
      )}
    </div>
  );
};

export default GuideWeeklyReports;
