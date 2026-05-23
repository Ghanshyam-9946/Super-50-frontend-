import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Sparkles, Crown, Hash, FolderOpen, UserCheck, Info,
  Settings as SettingsIcon, Save, Edit3, Search, X, Lock,
  UserCog, Vote, CheckCircle2, XCircle, AlertTriangle, Loader2, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, StatCard, EmptyState, Modal, confirmAction } from '../../../components/pms/Common';
import { useAuth } from '../../../context/pms/AuthContext';
import { semesterToProject, formatDateTime } from '../../../utils/pms/helpers';

const ROLES = ['Member', 'Co-Leader', 'Frontend', 'Backend', 'Database', 'Tester', 'Documentation'];
const DOMAIN_OPTS = ['WEB DEVELOPMENT', 'MOBILE APP DEVELOPMENT', 'ML', 'DATA SCIENCE / DATA ANALYTICS', 'IOT', 'OTHER'];
const FE_OPTS = ['HTML-CSS-JAVASCRIPT', 'BOOTSTRAP', 'REACT & ANGULAR', 'FLUTTER ANDROID', 'OTHER'];
const BE_OPTS = ['PYTHON', 'PHP', 'JAVA', 'FLASK FRAMEWORK', 'DJANGO FRAMEWORK', 'FIREBASE', 'ASP.NET', 'OTHER'];
const DB_OPTS = ['MYSQL', 'ORACLE', 'MONGODB', 'OTHER'];

// =============== STUDENT PICKER ===============
// Searches admin-uploaded students (same sem, not in any team, not self)
const StudentPicker = ({ onPick, excludeIds = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const search = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await studentAPI.searchStudents(q);
      setResults(res.data.students.filter((s) => !excludeIds.includes(s._id)));
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  }, [excludeIds]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, open, search]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          className="form-input pl-10"
          placeholder="Search by name or enrollment number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-elevated max-h-72 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-400">
              <Loader2 className="w-4 h-4 inline animate-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-400">
              {query ? `No available students match "${query}"` : 'Type to search students from your semester'}
              <div className="text-[10px] mt-1 italic">Only shows students uploaded by admin who aren't in any team</div>
            </div>
          ) : (
            results.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => {
                  onPick(s);
                  setQuery('');
                  setOpen(false);
                  setResults([]);
                }}
                className="w-full text-left p-3 hover:bg-brand-50 border-b border-slate-100 last:border-0"
              >
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-mono">{s.enrollmentNo}</span>
                  <span>· Sem {s.semester}</span>
                  {s.email && <span className="text-slate-400">· {s.email}</span>}
                </div>
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block w-full text-center py-2 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

// =============== EDIT TEAM MODAL ===============
const EditTeamModal = ({ open, onClose, team, currentUser, onSaved }) => {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (team && open) {
      setForm({
        groupName: team.groupName || '',
        projectTitle: team.projectTitle || '',
        projectDescription: team.projectDescription || '',
        sdgSuggestion: team.sdgSuggestion || '',
        section: team.section || '',
        projectDomain: team.projectDomain || [],
        frontendTech: team.frontendTech || [],
        backendTech: team.backendTech || [],
        database: team.database || [],
        members: (team.members || []).map((m) => ({
          student: m.student,
          enrollmentNo: m.student?.enrollmentNo || '',
          name: m.student?.name || '',
          role: m.role || 'Member',
        })),
      });
    }
  }, [team, open]);

  const toggleArr = (key, value) => {
    setForm((p) => {
      const arr = p[key] || [];
      return { ...p, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const addMember = (student) => {
    setForm((p) => {
      if (p.members.length >= 5) {
        toast.error('Max 5 members allowed');
        return p;
      }
      if (p.members.find((m) => m.enrollmentNo === student.enrollmentNo)) {
        toast.error('Already added');
        return p;
      }
      return {
        ...p,
        members: [...p.members, {
          student,
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          role: 'Member',
        }],
      };
    });
  };

  const removeMember = (idx) => {
    setForm((p) => {
      const m = p.members[idx];
      // Cannot remove yourself
      if (m.student?._id === currentUser._id || m.student === currentUser._id) {
        toast.error("You can't remove yourself. Ask a teammate to do this.");
        return p;
      }
      return { ...p, members: p.members.filter((_, i) => i !== idx) };
    });
  };

  const changeRole = (idx, role) => {
    setForm((p) => {
      const ms = p.members.map((m, i) => i === idx ? { ...m, role } : m);
      // If setting someone as Leader, demote others from Leader
      if (role === 'Leader') {
        ms.forEach((m, i) => {
          if (i !== idx && m.role === 'Leader') m.role = 'Member';
        });
      }
      return { ...p, members: ms };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        groupName: form.groupName,
        projectTitle: form.projectTitle,
        projectDescription: form.projectDescription,
        sdgSuggestion: form.sdgSuggestion,
        section: form.section,
        projectDomain: form.projectDomain,
        frontendTech: form.frontendTech,
        backendTech: form.backendTech,
        database: form.database,
        members: form.members.map((m) => ({
          enrollmentNo: m.enrollmentNo,
          role: m.role,
        })),
      };
      const res = await studentAPI.updateMyTeam(payload);
      if (res.data.rejected?.length > 0) {
        toast.error(`Saved, but ${res.data.rejected.length} member(s) were rejected (see console)`);
        console.warn('Rejected members:', res.data.rejected);
      } else {
        toast.success('Team updated successfully');
      }
      onSaved();
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  if (!team) return null;
  const excludeIds = (form.members || []).map((m) => m.student?._id || m.student).filter(Boolean);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Team — ${team.groupNo}`}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Group Name *</label>
            <input className="form-input" value={form.groupName || ''} onChange={(e) => setForm({ ...form, groupName: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Section</label>
            <input className="form-input" value={form.section || ''} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g. A" />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Project Title *</label>
            <input className="form-input" value={form.projectTitle || ''} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Project Description</label>
            <textarea className="form-input" rows="2" value={form.projectDescription || ''} onChange={(e) => setForm({ ...form, projectDescription: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">SDG / Theme</label>
            <input className="form-input" value={form.sdgSuggestion || ''} onChange={(e) => setForm({ ...form, sdgSuggestion: e.target.value })} />
          </div>
        </div>

        {/* Tech checkboxes (compact) */}
        <details className="border border-slate-100 rounded-lg">
          <summary className="px-3 py-2 cursor-pointer font-semibold text-sm">Technology Stack</summary>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'projectDomain', label: 'Domain', opts: DOMAIN_OPTS },
              { key: 'frontendTech', label: 'Frontend', opts: FE_OPTS },
              { key: 'backendTech', label: 'Backend', opts: BE_OPTS },
              { key: 'database', label: 'Database', opts: DB_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="form-label">{label}</div>
                <div className="bg-slate-50 p-2 rounded space-y-1">
                  {opts.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" className="rounded" checked={form[key]?.includes(opt) || false} onChange={() => toggleArr(key, opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* Members */}
        <div className="border-t border-slate-100 pt-4">
          <h6 className="font-semibold text-sm mb-3 flex items-center justify-between">
            <span>Team Members ({form.members?.length || 0}/5)</span>
            <span className="text-xs text-slate-500 font-normal">One student = one team only</span>
          </h6>

          {/* Current members */}
          <div className="space-y-2 mb-3">
            {(form.members || []).map((m, idx) => {
              const sid = m.student?._id || m.student;
              const isMe = sid?.toString() === currentUser._id?.toString();
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded-lg">
                  <div className="col-span-1 text-center text-xs text-slate-500 font-semibold">{idx + 1}</div>
                  <div className="col-span-6 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      {m.role === 'Leader' && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                      <span className="truncate">{m.name}</span>
                      {isMe && <span className="badge-primary text-[9px]">You</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{m.enrollmentNo}</div>
                  </div>
                  <select
                    className="form-select col-span-4 py-1.5 text-xs"
                    value={m.role}
                    onChange={(e) => changeRole(idx, e.target.value)}
                  >
                    <option value="Leader">Leader</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    disabled={isMe}
                    title={isMe ? "You can't remove yourself" : 'Remove'}
                    className="col-span-1 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add member picker */}
          {(form.members?.length || 0) < 5 && (
            <div>
              <label className="form-label">Add member (search from admin-uploaded students)</label>
              <StudentPicker onPick={addMember} excludeIds={excludeIds} />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

// =============== LEADER CHANGE VOTING ===============
const LeaderChangeSection = ({ team, currentUser, onSaved }) => {
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const proposal = team.leaderChangeProposal;
  const hasActiveProposal = proposal && proposal.proposedLeader;

  const handlePropose = async () => {
    if (!selectedCandidate) {
      toast.error('Select a member');
      return;
    }
    if (!confirmAction('Propose this member as new team leader? All members must agree.')) return;
    setSubmitting(true);
    try {
      await studentAPI.proposeLeader(selectedCandidate);
      toast.success('Proposal submitted. Awaiting votes.');
      setProposeOpen(false);
      setSelectedCandidate('');
      onSaved();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  const handleVote = async (vote) => {
    const confirmMsg = vote === 'yes'
      ? 'Vote YES to support this leader change?'
      : 'Vote NO will cancel the entire proposal. Continue?';
    if (!confirmAction(confirmMsg)) return;
    setSubmitting(true);
    try {
      await studentAPI.voteLeader(vote);
      toast.success(vote === 'yes' ? 'Voted yes' : 'Proposal cancelled');
      onSaved();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  const proposedLeaderObj = hasActiveProposal
    ? team.members.find(
        (m) => (m.student?._id || m.student)?.toString() === (proposal.proposedLeader?._id || proposal.proposedLeader)?.toString()
      ) : null;
  const proposedByObj = hasActiveProposal
    ? team.members.find(
        (m) => (m.student?._id || m.student)?.toString() === (proposal.proposedBy?._id || proposal.proposedBy)?.toString()
      ) : null;

  const myVoteCast = hasActiveProposal && (proposal.votes || []).some(
    (v) => (v._id || v)?.toString() === currentUser._id?.toString()
  );

  const totalMembers = team.members.length;
  const yesVotes = (proposal?.votes || []).length;
  const candidates = team.members.filter((m) => m.role !== 'Leader');

  return (
    <>
      <Card title="Team Leadership" icon={UserCog}>
        <div className="alert-info text-xs mb-4">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>To change the team leader, all members must vote YES unanimously. Any NO vote cancels the proposal.</span>
        </div>

        {hasActiveProposal ? (
          <div className="border-2 border-amber-300 bg-amber-50 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <Vote className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900">Active Leader-Change Proposal</h4>
                <p className="text-sm text-amber-800 mt-1">
                  <strong>{proposedByObj?.student?.name || 'A member'}</strong> proposed{' '}
                  <strong>{proposedLeaderObj?.student?.name || 'a member'}</strong> as new team leader.
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {proposal.proposedAt ? formatDateTime(proposal.proposedAt) : 'just now'}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 mb-3">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Voting progress</span>
                <span className="text-sm font-bold">{yesVotes} / {totalMembers} yes</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${(yesVotes / totalMembers) * 100}%` }} />
              </div>
            </div>
            {myVoteCast ? (
              <div className="alert-success text-sm">
                <CheckCircle2 className="w-4 h-4" /> You voted YES. Waiting for others.
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => handleVote('yes')} disabled={submitting} className="btn-success flex-1">
                  <CheckCircle2 className="w-4 h-4" /> Vote YES
                </button>
                <button onClick={() => handleVote('no')} disabled={submitting} className="btn-danger flex-1">
                  <XCircle className="w-4 h-4" /> Vote NO (cancels)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center flex-wrap gap-3">
            <p className="text-sm text-slate-600">No active proposal.</p>
            {candidates.length > 0 && (
              <button onClick={() => setProposeOpen(true)} className="btn-outline btn-sm">
                <UserCog className="w-3 h-3" /> Propose New Leader
              </button>
            )}
          </div>
        )}
      </Card>

      <Modal
        open={proposeOpen}
        onClose={() => { setProposeOpen(false); setSelectedCandidate(''); }}
        title="Propose New Team Leader"
        footer={
          <>
            <button onClick={() => setProposeOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handlePropose} disabled={submitting || !selectedCandidate} className="btn-primary">
              <Vote className="w-4 h-4" /> Submit Proposal
            </button>
          </>
        }
      >
        <div className="alert-warning text-sm mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>All {totalMembers} members must vote YES for change to take effect.</span>
        </div>
        <label className="form-label">Select new leader</label>
        <select className="form-select" value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}>
          <option value="">— Select —</option>
          {candidates.map((m) => (
            <option key={m.student._id} value={m.student._id}>
              {m.student.name} ({m.student.enrollmentNo})
            </option>
          ))}
        </select>
      </Modal>
    </>
  );
};

// =============== CREATE TEAM FORM ===============
const CreateTeamForm = ({ user, onCreated }) => {
  const [form, setForm] = useState({
    groupName: '',
    projectTitle: '',
    sdgSuggestion: '',
    members: [], // {student, enrollmentNo, name, role}
  });
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const addMember = (student) => {
    if (form.members.length >= 4) {
      toast.error('You + 4 members = max 5. Cannot add more.');
      return;
    }
    if (form.members.find((m) => m.enrollmentNo === student.enrollmentNo)) {
      toast.error('Already added');
      return;
    }
    setForm((p) => ({
      ...p,
      members: [...p.members, {
        student: student._id,
        enrollmentNo: student.enrollmentNo,
        name: student.name,
        role: 'Member',
      }],
    }));
  };

  const removeMember = (idx) => {
    setForm((p) => ({ ...p, members: p.members.filter((_, i) => i !== idx) }));
  };

  const changeRole = (idx, role) => {
    setForm((p) => ({
      ...p,
      members: p.members.map((m, i) => i === idx ? { ...m, role } : m),
    }));
  };

  const suggestSDG = async () => {
    if (!form.projectTitle.trim()) {
      toast.error('Enter project title first');
      return;
    }
    setSuggesting(true);
    try {
      const res = await studentAPI.suggestSDG(form.projectTitle);
      setForm((p) => ({ ...p, sdgSuggestion: res.data.sdg }));
      toast.success('SDG suggestion ready');
    } catch (err) { toast.error(handleError(err)); }
    finally { setSuggesting(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await studentAPI.createTeam({
        ...form,
        additionalMembers: form.members.map((m) => ({
          enrollmentNo: m.enrollmentNo,
          name: m.name,
          role: m.role,
        })),
      });
      if (res.data.rejected?.length > 0) {
        toast(`Team created, but ${res.data.rejected.length} member(s) were rejected`, { icon: '⚠️' });
        console.warn('Rejected:', res.data.rejected);
      } else {
        toast.success('Team created!');
      }
      onCreated();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  const excludeIds = form.members.map((m) => m.student);

  return (
    <Card title="Create Your Team" icon={Plus}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Group Name *</label>
            <input className="form-input" placeholder="e.g. Tech Titans" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Project Title *</label>
            <input className="form-input" placeholder="e.g. Smart Attendance with Face Recognition" value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} required />
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between gap-2 mb-1.5">
            <label className="form-label mb-0">SDG / Theme Suggestion</label>
            <button type="button" onClick={suggestSDG} disabled={suggesting} className="btn-outline btn-sm">
              {suggesting ? <Spinner size="sm" /> : <><Sparkles className="w-3 h-3" /> Suggest SDG</>}
            </button>
          </div>
          <textarea
            className="form-input" rows="2"
            value={form.sdgSuggestion}
            onChange={(e) => setForm({ ...form, sdgSuggestion: e.target.value })}
            placeholder="Click 'Suggest SDG' for AI-powered ideas"
          />
        </div>

        <hr className="border-slate-100" />

        {/* Leader */}
        <div className="alert-info">
          <Crown className="w-4 h-4 flex-shrink-0" />
          <div>
            <strong>You ({user.name})</strong> will be the team leader. {user.enrollmentNo}
          </div>
        </div>

        {/* Members - Picker driven */}
        <div>
          <h6 className="font-semibold text-sm mb-1">Add Members ({form.members.length}/4 optional)</h6>
          <p className="text-xs text-slate-500 mb-3">Search students from your semester. Only students uploaded by admin who aren't already in another team will appear.</p>

          {form.members.length > 0 && (
            <div className="space-y-2 mb-3">
              {form.members.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded-lg">
                  <div className="col-span-1 text-center text-xs text-slate-500 font-semibold">{idx + 2}</div>
                  <div className="col-span-6 min-w-0">
                    <div className="font-semibold text-sm truncate">{m.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{m.enrollmentNo}</div>
                  </div>
                  <select
                    className="form-select col-span-4 py-1.5 text-xs"
                    value={m.role}
                    onChange={(e) => changeRole(idx, e.target.value)}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="col-span-1 text-slate-400 hover:text-red-600"
                    title="Remove"
                  >
                    <X className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {form.members.length < 4 && (
            <StudentPicker onPick={addMember} excludeIds={excludeIds} />
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary btn-lg">
          {submitting ? <Spinner size="sm" className="text-white" /> : <><Users className="w-4 h-4" /> Create Team</>}
        </button>
      </form>
    </Card>
  );
};

// =============== MAIN ===============
const StudentTeam = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getMyTeam();
      setTeam(res.data.team);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeam(); }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  // ============ NO TEAM YET ============
  if (!team) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Your Team</h1>
          <p className="text-sm text-slate-500 mt-1">Form a team with up to 5 members. You'll be the leader. Each student can only join one team.</p>
        </div>
        <CreateTeamForm user={user} onCreated={fetchTeam} />
      </div>
    );
  }

  // ============ HAS TEAM ============
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            My Team
            {team.isLocked && <span className="badge-secondary"><Lock className="w-3 h-3" /> Locked by Admin</span>}
          </h1>
          <p className="text-sm text-slate-500 mt-1">All your team details. {!team.isLocked && 'Click Edit Team to update.'}</p>
        </div>
        {!team.isLocked && (
          <button onClick={() => setEditOpen(true)} className="btn-primary">
            <Edit3 className="w-4 h-4" /> Edit Team
          </button>
        )}
      </div>

      {team.isLocked && (
        <div className="alert-warning">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>This team is locked by admin.</strong>
            <p className="text-xs mt-1">You cannot edit team details, members, or change the leader until admin unlocks it. Contact your administrator to make changes.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Group Number"
          value={team.groupNo.length > 18 ? team.groupNo.split('/').pop() : team.groupNo}
          icon={Hash}
          color="primary"
          meta={team.groupNo.length > 18 ? team.groupNo : null}
        />
        <StatCard label="Group Name" value={team.groupName} icon={Users} color="info" />
        <StatCard label="Project Type" value={team.project?.projectName || semesterToProject(team.semester)} icon={FolderOpen} color="warning" />
        <StatCard label="Members" value={team.members?.length || 0} icon={UserCheck} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Project Information" icon={FolderOpen}>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Title</div>
              <div className="font-semibold">{team.projectTitle}</div>
            </div>
            {team.projectDescription && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Description</div>
                <div className="text-slate-700">{team.projectDescription}</div>
              </div>
            )}
            {team.sdgSuggestion && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">SDG / Theme</div>
                <div className="text-slate-700">{team.sdgSuggestion}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Academic Year</div>
              <div>{team.academicYear?.yearName} · Sem {team.semester}</div>
            </div>
          </div>
        </Card>

        <Card title="Project Guide" icon={UserCheck}>
          {team.guide ? (
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-base">{team.guide.name}</div>
              <div className="text-slate-500">{team.guide.email}</div>
              {team.guide.mobile && <div className="text-slate-500">📱 {team.guide.mobile}</div>}
            </div>
          ) : (
            <div className="alert-warning text-xs">
              <Info className="w-4 h-4 flex-shrink-0" />
              Guide will be assigned by admin shortly.
            </div>
          )}
        </Card>
      </div>

      <Card title="Team Members" icon={Users} noPadding>
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
          <Info className="w-3 h-3 text-brand-600" />
          <span>All members have equal powers to edit team details. Each student can only be in ONE team.</span>
        </div>
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
                      {m.student?._id === user._id && <span className="badge-primary">You</span>}
                    </div>
                  </td>
                  <td className="font-mono text-xs">{m.student?.enrollmentNo}</td>
                  <td>
                    {m.role === 'Leader'
                      ? <span className="badge-warning">Leader</span>
                      : <span className="badge-secondary">{m.role}</span>}
                  </td>
                  <td className="text-sm text-slate-500">{m.student?.mobile || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!team.isLocked && (
        <LeaderChangeSection team={team} currentUser={user} onSaved={fetchTeam} />
      )}

      <EditTeamModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        team={team}
        currentUser={user}
        onSaved={fetchTeam}
      />
    </div>
  );
};

export default StudentTeam;
