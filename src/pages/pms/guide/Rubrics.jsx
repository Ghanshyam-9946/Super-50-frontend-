import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Award, Save, FileText, Users, Crown, Calculator,
  AlertTriangle, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';

// Columns: P1=5, P2=5, P3=5, P4=15, P5=20 → Total 50
const COLS = [
  { key: 'problemIdentification', label: 'Problem ID', max: 5, co: 'CO1' },
  { key: 'projectProgress1', label: 'Progress 1', max: 5, co: 'CO2' },
  { key: 'projectProgress2', label: 'Progress 2', max: 5, co: 'CO3' },
  { key: 'implementation', label: 'Impl. & Code', max: 15, co: 'CO4' },
  { key: 'pptReport', label: 'PPT & Report', max: 20, co: 'CO5' },
];

const totalOf = (marks) => COLS.reduce((sum, c) => sum + (Number(marks[c.key]) || 0), 0);

const GuideRubrics = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [data, setData] = useState({}); // { studentId: { marks: {...}, comment: '' } }
  const [attendanceMap, setAttendanceMap] = useState({}); // 🆕
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await guideAPI.getRubrics(teamId);
      setTeam(res.data.team);
      setAttendanceMap(res.data.attendanceMap || {});

      // Build student-id-keyed map from existing evaluations
      const map = {};
      (res.data.team?.members || []).forEach((m) => {
        const sid = m.student._id;
        map[sid] = {
          marks: {
            problemIdentification: '', projectProgress1: '', projectProgress2: '',
            implementation: '', pptReport: '',
          },
          comment: '',
        };
      });
      (res.data.evaluations || []).forEach((ev) => {
        const sid = ev.student?.toString?.() || ev.student;
        if (map[sid]) {
          map[sid] = {
            marks: {
              problemIdentification: ev.marks?.problemIdentification ?? '',
              projectProgress1: ev.marks?.projectProgress1 ?? '',
              projectProgress2: ev.marks?.projectProgress2 ?? '',
              implementation: ev.marks?.implementation ?? '',
              pptReport: ev.marks?.pptReport ?? '',
            },
            comment: ev.comment || '',
          };
        }
      });
      setData(map);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [teamId]);

  const setMark = (studentId, key, value, max) => {
    const v = value === '' ? '' : Math.max(0, Math.min(max, Number(value)));
    setData((p) => ({
      ...p,
      [studentId]: {
        ...p[studentId],
        marks: { ...p[studentId].marks, [key]: v },
      },
    }));
  };

  const setComment = (studentId, comment) => {
    setData((p) => ({
      ...p,
      [studentId]: { ...p[studentId], comment },
    }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const evaluations = Object.entries(data).map(([studentId, { marks, comment }]) => ({
        studentId,
        marks,
        comment,
      }));
      const res = await guideAPI.saveRubrics({ teamId, evaluations });
      toast.success(`Saved evaluations for ${res.data.saved} students`);
      fetchData();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;
  if (!team) return <Card><EmptyState icon={AlertTriangle} title="Team not found" message="Or not assigned to you." /></Card>;

  const members = team.members || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <Link to="/pms/guide/groups" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1 mb-2">
            <ChevronLeft className="w-3 h-3" /> Back to groups
          </Link>
          <h1 className="text-2xl font-bold">Rubric Evaluation</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-semibold">{team.groupName}</span> · {team.groupNo}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={guideAPI.rubricPdfUrl(teamId)}
            target="_blank"
            rel="noreferrer"
            className="btn-outline"
          >
            <FileText className="w-4 h-4" /> Download PDF
          </a>
        </div>
      </div>

      {/* Project info */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Project Title</div>
            <div className="font-semibold mt-1">{team.projectTitle}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Semester / Project</div>
            <div className="font-semibold mt-1">{team.semester}th — {team.project?.projectName}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Guide</div>
            <div className="font-semibold mt-1">{team.guide?.name}</div>
          </div>
        </div>
      </Card>

      {/* Info bar */}
      <div className="alert-info text-sm">
        <Info className="w-4 h-4 flex-shrink-0" />
        <div>
          Enter marks per student per rubric criterion. Maximum: P1–P3 = 5 each, P4 = 15, P5 = 20. Total per student = 50.
        </div>
      </div>

      {/* Evaluation table */}
      <Card title="Per-Student Rubric Marks" icon={Award} noPadding>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Student</th>
                <th className="text-center">Attendance<div className="text-[10px] font-normal text-slate-400">Current Sem</div></th>
                {COLS.map((c) => (
                  <th key={c.key} className="text-center">
                    <div>{c.label}</div>
                    <div className="text-[10px] font-normal text-slate-400">({c.max}) · {c.co}</div>
                  </th>
                ))}
                <th className="text-center">Total<div className="text-[10px] font-normal text-slate-400">(50)</div></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, idx) => {
                const sid = m.student._id;
                const entry = data[sid] || { marks: {} };
                const total = totalOf(entry.marks || {});
                const att = attendanceMap[sid];
                const attPct = att?.attendancePercentage;
                const attColor = attPct == null ? 'bg-slate-100 text-slate-500'
                  : attPct >= 75 ? 'bg-emerald-100 text-emerald-800'
                  : attPct >= 60 ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800';
                return (
                  <tr key={sid}>
                    <td className="text-center font-semibold">{idx + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {m.role === 'Leader' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        <div>
                          <div className="font-semibold">{m.student.name}</div>
                          <div className="text-xs text-slate-500">{m.student.enrollmentNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      {att ? (
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${attColor}`}>
                            {attPct}%
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">{att.totalPresent}/{att.totalDays}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic" title="Admin hasn't uploaded attendance for this semester">N/A</span>
                      )}
                    </td>
                    {COLS.map((c) => (
                      <td key={c.key} className="text-center">
                        <input
                          type="number"
                          min="0"
                          max={c.max}
                          value={entry.marks?.[c.key] ?? ''}
                          onChange={(e) => setMark(sid, c.key, e.target.value, c.max)}
                          className="form-input text-center w-16 mx-auto"
                          style={{ padding: '6px 4px' }}
                        />
                      </td>
                    ))}
                    <td className="text-center">
                      <span className={`badge-${total >= 30 ? 'success' : total >= 20 ? 'warning' : total > 0 ? 'danger' : 'secondary'} text-base font-bold px-2 py-1`}>
                        {total > 0 ? total : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Calculator className="w-3 h-3" /> Totals auto-calculated. Maximum total per student is 50.
          </div>
          <button onClick={handleSave} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : <><Save className="w-4 h-4" /> Save All Marks</>}
          </button>
        </div>
      </Card>

      {/* Rubric reference */}
      <Card title="Rubric Reference Guide" icon={Info}>
        <div className="text-sm space-y-2">
          <p><strong className="text-slate-700">P1 — Problem Identification:</strong> Initiation form quality. Real-world relevance, specificity, clarity.</p>
          <p><strong className="text-slate-700">P2 — Project Progress:</strong> Idea clarity, role allocation, teamwork.</p>
          <p><strong className="text-slate-700">P3 — Implementation:</strong> Working modules, UI, logic, database integration.</p>
          <p><strong className="text-slate-700">P4 — Code Optimization:</strong> Efficiency, scalability, code structure.</p>
          <p><strong className="text-slate-700">P5 — Presentation & Report:</strong> Organization, clarity, technical depth.</p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Scoring scale: Poor (1) · Satisfactory (2) · Average (3) · Good (4) · Excellent (5)
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GuideRubrics;
