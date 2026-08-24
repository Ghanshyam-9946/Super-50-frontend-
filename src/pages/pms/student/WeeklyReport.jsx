import { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { formatDate, formatDateTime } from '../../../utils/pms/helpers';

const REVIEW_BADGE = {
  approved: { label: 'Approved', className: 'badge-success', icon: CheckCircle2 },
  needs_revision: { label: 'Needs Revision', className: 'badge-danger', icon: AlertOctagon },
};

const WeeklyReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ workDone: '', plannedNext: '', blockers: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getMyWeeklyReports();
      const fetched = res.data.data;
      setReports(fetched);

      // Client can't recompute the exact ISO week trivially — just treat
      // the most recent report as "this week's" if it was submitted in the
      // last 7 days, so re-opening the form pre-fills what was already
      // sent this week. Computed here (once, after the fetch resolves)
      // rather than during render, since `Date.now()` isn't a pure value.
      const current = fetched.find(
        (r) => Date.now() - new Date(r.submittedAt).getTime() < 7 * 24 * 60 * 60 * 1000
      );
      if (current) {
        setForm({
          workDone: current.workDone || '',
          plannedNext: current.plannedNext || '',
          blockers: current.blockers || '',
        });
      }
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.workDone.trim() || !form.plannedNext.trim()) {
      return toast.error('Work Done and Planned For Next Week are required');
    }
    setSubmitting(true);
    try {
      await studentAPI.submitWeeklyReport(form);
      toast.success('Weekly report submitted');
      load();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Weekly Report</h1>
        <p className="text-sm text-slate-500 mt-1">Submit a short progress update every week — work done, what's planned next, and any blockers.</p>
      </div>

      <Card title="This Week's Report">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="form-label">Work Done This Week *</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.workDone}
              onChange={(e) => setForm({ ...form, workDone: e.target.value })}
              placeholder="What did your team accomplish this week?"
              required
            />
          </div>
          <div>
            <label className="form-label">Planned For Next Week *</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.plannedNext}
              onChange={(e) => setForm({ ...form, plannedNext: e.target.value })}
              placeholder="What's the plan for next week?"
              required
            />
          </div>
          <div>
            <label className="form-label">Blockers / Challenges <span className="text-slate-400">(optional)</span></label>
            <textarea
              className="form-input"
              rows={2}
              value={form.blockers}
              onChange={(e) => setForm({ ...form, blockers: e.target.value })}
              placeholder="Anything blocking progress?"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : <><Send className="w-4 h-4" /> Submit This Week's Report</>}
          </button>
        </form>
      </Card>

      <Card title="Past Reports" icon={Clock}>
        {loading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports submitted yet" />
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const badge = r.reviewStatus ? REVIEW_BADGE[r.reviewStatus] : null;
              return (
                <div key={r._id} className="border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                      Week of {formatDate(r.weekStartDate)} – {formatDate(r.weekEndDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      {badge ? (
                        <span className={badge.className}><badge.icon className="w-3 h-3" /> {badge.label}</span>
                      ) : (
                        <span className="badge-warning"><Clock className="w-3 h-3" /> Pending Review</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm"><strong>Work Done:</strong> {r.workDone}</div>
                  <div className="text-sm"><strong>Planned Next:</strong> {r.plannedNext}</div>
                  {r.blockers && <div className="text-sm text-amber-600"><strong>Blockers:</strong> {r.blockers}</div>}
                  {r.guideRemarks && (
                    <div className="text-sm bg-slate-50 rounded p-2 mt-1"><strong>Guide Remarks:</strong> {r.guideRemarks}</div>
                  )}
                  <div className="text-xs text-slate-400">Submitted {formatDateTime(r.submittedAt)}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WeeklyReport;
