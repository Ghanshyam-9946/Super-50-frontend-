import { useState, useEffect, useCallback } from 'react';
import { Presentation as PresentationIcon, Save, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { formatDate, cn } from '../../../utils/pms/helpers';

// Presentation rounds this guide is on the panel of. Only panel members
// can give marks, and only for the groups the coordinator selected.
const TeamRow = ({ presentation, row, onSaved }) => {
  const [data, setData] = useState({});
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const { team, evaluation, assignedDate } = row;

  // Marks are each student's own. The one thing that belongs to the whole
  // group is the panel's feedback, which has its own box at the bottom.
  const [heldOn, setHeldOn] = useState('');

  useEffect(() => {
    const map = {};
    (team.members || []).forEach((m) => {
      const sid = m.student?._id;
      const saved = (evaluation?.students || []).find((x) => String(x.student) === String(sid));
      map[sid] = { marks: saved?.marks ?? '' };
    });
    setData(map);
    setFeedback(evaluation?.feedback || '');
    setHeldOn(
      evaluation?.heldOn
        ? new Date(evaluation.heldOn).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
        : (assignedDate ? new Date(assignedDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : ''),
    );
  }, [team, evaluation, assignedDate]);

  const setField = (sid, patch) => setData((p) => ({ ...p, [sid]: { ...p[sid], ...patch } }));

  const save = async () => {
    const students = Object.entries(data).map(([studentId, v]) => ({ studentId, marks: v.marks }));
    if (students.every((x) => x.marks === '' || x.marks === null)) {
      return toast.error('Enter marks for at least one student');
    }
    if (students.some((x) => x.marks !== '' && Number(x.marks) > presentation.totalMarks)) {
      return toast.error(`Maximum is ${presentation.totalMarks} marks`);
    }
    setSaving(true);
    try {
      await guideAPI.savePresentationMarks(presentation._id, {
        teamId: team._id, heldOn: heldOn || null, feedback, students,
      });
      toast.success('Marks saved');
      onSaved();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSaving(false);
    }
  };

  const filled = Object.values(data).filter((v) => v.marks !== '' && v.marks !== null).length;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-sm">{team.groupNo}</div>
          <div className="text-xs text-slate-500">
            {team.groupName} · {team.teamType || 'Non SIH'}
            {assignedDate ? ` · ${formatDate(assignedDate)}` : ''}
            {(team.guides || []).length ? ` · Guide: ${team.guides.map((g) => g.name).join(', ')}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={filled === (team.members?.length || 0) && filled > 0 ? 'badge-success' : 'badge-secondary'}>
            {filled}/{team.members?.length || 0} marked
          </span>
        </div>
      </div>
      {/* The day it was actually held — which is not always the day
          somebody got round to entering the marks. */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-end gap-3">
        <div>
          <label className="form-label">Presented on</label>
          <input type="date" className="form-input py-1.5 w-44" value={heldOn}
            onChange={(e) => setHeldOn(e.target.value)} />
        </div>
        <p className="text-xs text-slate-500 pb-1.5">
          Marks are per student. The feedback below is for the group.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Student</th><th className="w-32">Marks (/{presentation.totalMarks})</th></tr></thead>
          <tbody>
            {(team.members || []).map((m) => {
              const sid = m.student?._id;
              const v = data[sid] || {};
              return (
                <tr key={sid}>
                  <td>
                    <div className="font-medium">{m.student?.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{m.student?.enrollmentNo}</div>
                  </td>
                  <td>
                    <input type="number" min="0" max={presentation.totalMarks} step="0.5"
                      className="form-input py-1.5"
                      value={v.marks ?? ''} onChange={(e) => setField(sid, { marks: e.target.value })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-slate-100 space-y-2">
        <label className="form-label">Remark for the group (one for everybody — goes into the evaluation PDF)</label>
        <textarea className="form-input" rows="2" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="btn-primary btn-sm">
            {saving ? <Spinner size="sm" className="text-white" /> : <><Save className="w-3.5 h-3.5" /> Save marks & feedback</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const GuidePanelPresentations = () => {
  const [rounds, setRounds] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await guideAPI.getPanelPresentations();
      setRounds(data.rounds || []);
      setActiveId((cur) => cur || data.rounds?.[0]?.presentation?._id || '');
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  const active = rounds.find((r) => r.presentation._id === activeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Presentation Panel</h1>
        <p className="text-sm text-slate-500 mt-1">
          The rounds you are on the panel of. Give each student their marks and remark; the group feedback goes into the evaluation PDF.
        </p>
      </div>

      {rounds.length === 0 ? (
        <Card><EmptyState icon={PresentationIcon} title="You are not on any presentation panel yet" message="The Project Coordinator picks the panel for each presentation." /></Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {rounds.map(({ presentation: p }) => (
              <button
                key={p._id}
                onClick={() => setActiveId(p._id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                  activeId === p._id ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                {p.kind === 'documentation' ? <FileText className="w-3.5 h-3.5 inline mr-1" /> : null}
                {p.presentationTitle}
                <span className="ml-2 opacity-80">/{p.totalMarks}</span>
              </button>
            ))}
          </div>

          {active && (
            <Card
              title={`${active.presentation.presentationTitle} · Sem ${active.presentation.semester}`}
              icon={active.presentation.kind === 'documentation' ? FileText : PresentationIcon}
              noPadding
            >
              <div className="p-4 space-y-4">
                <div className="text-sm text-slate-600">
                  {active.teams.length} group{active.teams.length === 1 ? '' : 's'} · max {active.presentation.totalMarks} marks per student
                  {active.presentation.criteria ? ` · ${active.presentation.criteria}` : ''}
                </div>
                {active.teams.length === 0 ? (
                  <EmptyState icon={Users} title="No groups in this round" />
                ) : (
                  active.teams.map((row) => (
                    <TeamRow key={row.team._id} presentation={active.presentation} row={row} onSaved={load} />
                  ))
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default GuidePanelPresentations;
