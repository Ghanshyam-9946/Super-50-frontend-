import { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Save, Users, CheckCircle2, Clock, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { formatDate, cn } from '../../../utils/pms/helpers';

// The guide records marks + a remark for every student of their teams in
// each meeting round the coordinator scheduled. Everything stays editable.
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const dateInput = (d) => (d ? new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '');

const windowState = (m) => {
  const today = todayStr();
  if (today < dateInput(m.startDate)) return { label: 'Upcoming', cls: 'badge-secondary' };
  if (today > dateInput(m.endDate)) return { label: 'Window closed', cls: 'badge-warning' };
  return { label: 'Open now', cls: 'badge-success' };
};

const TeamMeetingCard = ({ meeting, team, rows, onSaved }) => {
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const map = {};
    (team.members || []).forEach((m) => {
      const sid = m.student?._id;
      const ev = rows.find((r) => String(r.student) === String(sid));
      map[sid] = {
        marks: ev?.marks ?? '',
        remark: ev?.remark || '',
        metOn: dateInput(ev?.metOn) || '',
      };
    });
    setData(map);
  }, [team, rows]);

  const setField = (sid, patch) => setData((p) => ({ ...p, [sid]: { ...p[sid], ...patch } }));

  const copyFirstToAll = () => {
    const first = Object.values(data)[0];
    if (!first) return;
    setData((p) => Object.fromEntries(Object.keys(p).map((k) => [k, { ...first }])));
    toast.success('Copied to every member — edit where needed');
  };

  const save = async () => {
    const students = Object.entries(data).map(([studentId, v]) => ({
      studentId,
      marks: v.marks,
      remark: v.remark,
      metOn: v.metOn || null,
    }));
    if (students.some((s) => s.marks !== '' && Number(s.marks) > meeting.maxMarks)) {
      return toast.error(`Maximum is ${meeting.maxMarks} marks`);
    }
    setSaving(true);
    try {
      await guideAPI.saveMeetingEvaluations(meeting._id, { teamId: team._id, students });
      toast.success('Saved');
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
          <div className="text-xs text-slate-500">{team.groupName} · {team.members?.length || 0} members</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={filled === (team.members?.length || 0) && filled > 0 ? 'badge-success' : 'badge-secondary'}>
            {filled}/{team.members?.length || 0} marked
          </span>
          {(team.members?.length || 0) > 1 && (
            <button onClick={copyFirstToAll} className="btn-outline btn-sm" title="Copy the first row to every member">
              <Copy className="w-3 h-3" /> Same for all
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th className="w-28">Marks (/{meeting.maxMarks})</th><th className="w-36">Met on</th><th>Remark</th></tr>
          </thead>
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
                    <input
                      type="number" min="0" max={meeting.maxMarks} step="0.5" className="form-input py-1.5"
                      value={v.marks ?? ''}
                      onChange={(e) => setField(sid, { marks: e.target.value })}
                    />
                  </td>
                  <td>
                    <input type="date" className="form-input py-1.5" value={v.metOn || ''} onChange={(e) => setField(sid, { metOn: e.target.value })} />
                  </td>
                  <td>
                    <input
                      className="form-input py-1.5"
                      placeholder="What was discussed, what to do next…"
                      value={v.remark || ''}
                      onChange={(e) => setField(sid, { remark: e.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary btn-sm">
          {saving ? <Spinner size="sm" className="text-white" /> : <><Save className="w-3.5 h-3.5" /> Save marks & remarks</>}
        </button>
      </div>
    </div>
  );
};

const GuideMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await guideAPI.getMyMeetings();
      setMeetings(data.meetings || []);
      setTeams(data.teams || []);
      setEvaluations(data.evaluations || []);
      setActiveId((cur) => cur || data.meetings?.[0]?._id || '');
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  const active = meetings.find((m) => m._id === activeId);
  const teamsFor = (m) => teams.filter((t) => String(t.academicYear) === String(m.academicYear) && t.semester === m.semester);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guide Meetings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Record marks and a remark for each student when they come to meet you. You can edit them later.
        </p>
      </div>

      {meetings.length === 0 ? (
        <Card><EmptyState icon={CalendarClock} title="No meetings scheduled yet" message="The Project Coordinator schedules Meeting 1, 2 and 3." /></Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {meetings.map((m) => {
              const w = windowState(m);
              return (
                <button
                  key={m._id}
                  onClick={() => setActiveId(m._id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                    activeId === m._id ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {m.title || `Meeting ${m.meetingNo}`}
                  <span className="ml-2 opacity-80">/{m.maxMarks}</span>
                  <span className={cn('ml-2 text-[10px]', activeId === m._id && 'text-white/90')}>{w.label}</span>
                </button>
              );
            })}
          </div>

          {active && (
            <Card
              title={`${active.title || `Meeting ${active.meetingNo}`} · ${formatDate(active.startDate)} – ${formatDate(active.endDate)}`}
              icon={active.window === 'over' ? Clock : CheckCircle2}
              noPadding
            >
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className={windowState(active).cls}>{windowState(active).label}</span>
                  <span>Max {active.maxMarks} marks per student</span>
                  {active.instructions && <span className="text-slate-500">· {active.instructions}</span>}
                </div>
                {teamsFor(active).length === 0 ? (
                  <EmptyState icon={Users} title="No teams assigned to you for this semester" />
                ) : (
                  teamsFor(active).map((t) => (
                    <TeamMeetingCard
                      key={t._id}
                      meeting={active}
                      team={t}
                      rows={evaluations.filter((e) => String(e.meeting) === String(active._id) && String(e.team) === String(t._id))}
                      onSaved={load}
                    />
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

export default GuideMeetings;
