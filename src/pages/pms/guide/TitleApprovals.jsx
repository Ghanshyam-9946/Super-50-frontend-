import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal } from '../../../components/pms/Common';
import { formatDateTime } from '../../../utils/pms/helpers';

// The guide approves or rejects the project details (title, description,
// tech stack) their teams submit. A rejection needs a reason; the team can
// then edit and resubmit.
const STATUS = {
  draft: { label: 'Not submitted', cls: 'badge-secondary' },
  pending: { label: 'Waiting for you', cls: 'badge-warning' },
  approved: { label: 'Approved', cls: 'badge-success' },
  rejected: { label: 'Rejected', cls: 'badge-danger' },
};

const chips = (label, values) => (values || []).length > 0 && (
  <div className="flex flex-wrap items-center gap-1">
    <span className="text-xs text-slate-500 w-20">{label}</span>
    {values.map((v) => <span key={v} className="badge-info text-[10px]">{v}</span>)}
  </div>
);

const ReviewModal = ({ team, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');

  const decide = async (action) => {
    if (action === 'reject' && !reason.trim()) return toast.error('Write why you are rejecting it');
    setBusy(action);
    try {
      await guideAPI.reviewTeamDetails(team._id, { action, reason: reason.trim() });
      toast.success(action === 'approve' ? 'Project title approved' : 'Sent back to the team');
      onDone();
      onClose();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <Modal
      open={!!team}
      onClose={onClose}
      title={`Review — ${team.groupNo}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => decide('reject')} disabled={!!busy} className="btn-danger">
            {busy === 'reject' ? <Spinner size="sm" className="text-white" /> : <><XCircle className="w-4 h-4" /> Reject</>}
          </button>
          <button onClick={() => decide('approve')} disabled={!!busy} className="btn-success">
            {busy === 'approve' ? <Spinner size="sm" className="text-white" /> : <><CheckCircle2 className="w-4 h-4" /> Approve</>}
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Project title</div>
          <div className="font-semibold text-base">{team.projectTitle}</div>
        </div>
        {team.projectDescription && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Description</div>
            <p className="whitespace-pre-line text-slate-700">{team.projectDescription}</p>
          </div>
        )}
        {team.sdgSuggestion && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">SDG / Theme</div>
            <p className="text-slate-700">{team.sdgSuggestion}</p>
          </div>
        )}
        <div className="space-y-1">
          {chips('Domain', team.projectDomain)}
          {chips('Frontend', team.frontendTech)}
          {chips('Backend', team.backendTech)}
          {chips('Database', team.database)}
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Members ({team.members?.length || 0}) · {team.teamType || 'Non SIH'}</div>
          <div className="flex flex-wrap gap-2">
            {(team.members || []).map((m) => (
              <span key={m.student?._id} className="badge-secondary">{m.student?.name} · {m.student?.enrollmentNo}</span>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Reason (needed only to reject)</label>
          <textarea className="form-input" rows="2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Title is too broad — narrow it to one module" />
        </div>
      </div>
    </Modal>
  );
};

const GuideTitleApprovals = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await guideAPI.getTitleApprovals();
      setTeams(data.teams || []);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  const pending = teams.filter((t) => t.detailsApprovalStatus === 'pending');
  const others = teams.filter((t) => t.detailsApprovalStatus !== 'pending');

  const row = (t) => {
    const st = STATUS[t.detailsApprovalStatus || 'draft'];
    return (
      <tr key={t._id}>
        <td>
          <div className="font-semibold">{t.groupNo}</div>
          <div className="text-xs text-slate-500">{t.groupName}</div>
        </td>
        <td>
          <div className="font-medium">{t.projectTitle}</div>
          {t.detailsRejectionReason && <div className="text-xs text-rose-600 mt-0.5">Rejected: {t.detailsRejectionReason}</div>}
        </td>
        <td className="text-sm">{t.members?.length || 0}</td>
        <td><span className={st.cls}>{st.label}</span></td>
        <td className="text-xs text-slate-500">
          {t.detailsApprovalStatus === 'pending'
            ? `Submitted ${formatDateTime(t.detailsSubmittedAt)}`
            : t.detailsReviewedAt ? `${formatDateTime(t.detailsReviewedAt)}${t.detailsReviewedBy?.name ? ` by ${t.detailsReviewedBy.name}` : ''}` : '—'}
        </td>
        <td className="text-right">
          {t.detailsApprovalStatus === 'pending' ? (
            <button onClick={() => setReviewing(t)} className="btn-primary btn-sm"><ClipboardCheck className="w-3 h-3" /> Review</button>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Title Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your teams send their project details here. Approve them, or reject with a reason so they can revise and resubmit.
        </p>
      </div>

      <Card title={`Waiting for you (${pending.length})`} icon={Clock} noPadding>
        {pending.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing pending" message="Every team's details have been decided." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Group</th><th>Project Title</th><th>Members</th><th>Status</th><th>Submitted</th><th className="text-right">Action</th></tr></thead>
              <tbody>{pending.map(row)}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="All my teams" icon={FolderOpen} noPadding>
        {others.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No other teams" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Group</th><th>Project Title</th><th>Members</th><th>Status</th><th>Decided</th><th className="text-right">Action</th></tr></thead>
              <tbody>{others.map(row)}</tbody>
            </table>
          </div>
        )}
      </Card>

      {reviewing && <ReviewModal team={reviewing} onClose={() => setReviewing(null)} onDone={load} />}
    </div>
  );
};

export default GuideTitleApprovals;
