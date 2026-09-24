import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Sparkles, Crown, Hash, FolderOpen, UserCheck, Info,
  Settings as SettingsIcon, Save, Edit3, Search, X, Lock,
  UserCog, Vote, CheckCircle2, XCircle, AlertTriangle, Loader2, Trash2, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, StatCard, Modal, confirmAction } from '../../../components/pms/Common';
import { useAuth } from '../../../context/pms/AuthContext';
import { semesterToProject, formatDateTime } from '../../../utils/pms/helpers';

const ROLES = ['Member', 'Co-Leader', 'Frontend', 'Backend', 'Database', 'Tester', 'Documentation'];
const DOMAIN_OPTS = ['WEB DEVELOPMENT', 'MOBILE APP DEVELOPMENT', 'ML', 'DATA SCIENCE / DATA ANALYTICS', 'IOT', 'OTHER'];
const FE_OPTS = ['HTML-CSS-JAVASCRIPT', 'BOOTSTRAP', 'REACT & ANGULAR', 'FLUTTER ANDROID', 'OTHER'];
const BE_OPTS = ['PYTHON', 'PHP', 'JAVA', 'FLASK FRAMEWORK', 'DJANGO FRAMEWORK', 'FIREBASE', 'ASP.NET', 'OTHER'];
const DB_OPTS = ['MYSQL', 'ORACLE', 'MONGODB', 'OTHER'];

// Member limits per team type, leader included — mirrors the backend's
// utils/pmsTeamType.js. SIH teams need exactly 6 to submit for approval.
const TEAM_TYPES = {
  SIH: { max: 6, required: 6, hint: 'Smart India Hackathon — exactly 6 members (including you)' },
  'Non SIH': { max: 4, required: null, hint: 'Regular project — up to 4 members (including you)' },
};
const maxMembersFor = (type) => TEAM_TYPES[type]?.max ?? 4;

const TeamTypeSelect = ({ value, onChange, required }) => (
  <div>
    <label className="form-label">Team Type {required && '*'}</label>
    <select className="form-select" value={value || ''} onChange={(e) => onChange(e.target.value)} required={required}>
      {!value && <option value="">Select team type…</option>}
      {Object.keys(TEAM_TYPES).map((t) => (
        <option key={t} value={t}>{t} — {t === 'SIH' ? '6 members' : 'max 4 members'}</option>
      ))}
    </select>
    {value && <p className="form-help">{TEAM_TYPES[value].hint}</p>}
  </div>
);

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

// =============== GUIDE PREFERENCE PICKER ===============
// Tap up to 3 guides; tap order is the preference rank (1/2/3). Used by
// both the Create Team form and the My Team page's Project Details form.
const GuidePreferencePicker = ({ guides, picked, onToggle }) => {
  if (guides.length === 0) {
    return (
      <div className="alert-info text-xs">
        <Info className="w-4 h-4 flex-shrink-0" />
        No guides available yet for your year/semester — check back once admin adds them.
      </div>
    );
  }
  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto">
      {guides.map((g) => {
        const rank = picked.indexOf(g._id);
        const isSelected = rank !== -1;
        return (
          <button
            key={g._id}
            type="button"
            onClick={() => onToggle(g._id)}
            disabled={!isSelected && picked.length >= 3}
            className={`w-full flex items-center justify-between gap-3 border rounded-lg p-2.5 text-left transition-colors ${
              isSelected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{g.name}</div>
              <div className="text-xs text-slate-500 truncate">{g.department || g.designation || g.email}</div>
              <div className="text-xs mt-0.5">
                <span className={g.isFull ? 'badge-danger' : 'badge-secondary'}>
                  {g.currentTeams}{g.maxTeams != null ? ` / ${g.maxTeams}` : ''} team{g.currentTeams === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            {isSelected && (
              <span className="badge-primary w-6 h-6 rounded-full flex items-center justify-center p-0 flex-shrink-0 font-bold">{rank + 1}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const togglePick = (prev, guideId) => {
  if (prev.includes(guideId)) return prev.filter((id) => id !== guideId);
  if (prev.length >= 3) return prev;
  return [...prev, guideId];
};

// =============== TECHNOLOGY STACK ===============
const TECH_GROUPS = [
  { key: 'projectDomain', label: 'Domain', opts: DOMAIN_OPTS },
  { key: 'frontendTech', label: 'Frontend', opts: FE_OPTS },
  { key: 'backendTech', label: 'Backend', opts: BE_OPTS },
  { key: 'database', label: 'Database', opts: DB_OPTS },
];

const TechStackFields = ({ form, onToggle }) => (
  <div>
    <h6 className="font-semibold text-sm mb-2">Technology Stack</h6>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {TECH_GROUPS.map(({ key, label, opts }) => (
        <div key={key}>
          <div className="form-label">{label}</div>
          <div className="bg-slate-50 p-2 rounded space-y-1">
            {opts.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" className="rounded" checked={form[key]?.includes(opt) || false} onChange={() => onToggle(key, opt)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const toggleIn = (arr = [], value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

// =============== PROJECT DETAILS (inline, draft / rejected) ===============
// Everything the student fills in, on the page itself — Save Draft keeps
// it, Submit for Approval saves and sends it to admin in one click.
const TeamDetailsForm = ({ team, currentUser, guides, guidesLocked, onSaved }) => {
  const [form, setForm] = useState({});
  const [picked, setPicked] = useState([]); // guide ids, only while the team has none saved
  const [busy, setBusy] = useState(''); // '' | 'save' | 'submit'
  const hasSavedPrefs = (team.guidePreferences || []).length > 0;

  useEffect(() => {
    if (team) {
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
        teamType: team.teamType || 'Non SIH',
        members: (team.members || []).map((m) => ({
          student: m.student,
          enrollmentNo: m.student?.enrollmentNo || '',
          name: m.student?.name || '',
          role: m.role || 'Member',
        })),
      });
    }
  }, [team]);

  const toggleArr = (key, value) => setForm((p) => ({ ...p, [key]: toggleIn(p[key], value) }));
  const maxMembers = maxMembersFor(form.teamType);
  // SIH only: how many more members before the team can be submitted
  const stillNeeded = (TEAM_TYPES[form.teamType]?.required || 0) - (form.members?.length || 0);

  const changeTeamType = (type) => {
    const count = form.members?.length || 0;
    if (count > maxMembersFor(type)) {
      toast.error(`${type} teams can have at most ${maxMembersFor(type)} members — remove ${count - maxMembersFor(type)} first`);
      return;
    }
    setForm((p) => ({ ...p, teamType: type }));
  };

  const addMember = (student) => {
    if (form.members.length >= maxMembers) {
      toast.error(`${form.teamType} teams can have at most ${maxMembers} members`);
      return;
    }
    if (form.members.find((m) => m.enrollmentNo === student.enrollmentNo)) {
      toast.error('Already added');
      return;
    }
    setForm((p) => ({
      ...p,
      members: [...p.members, {
        student,
        enrollmentNo: student.enrollmentNo || student.enrollmentNumber,
        name: student.name,
        role: 'Member',
      }],
    }));
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

  // Saves the form; with submit=true also sends it for admin approval.
  const save = async (submit) => {
    if (!form.groupName?.trim() || !form.projectTitle?.trim()) {
      toast.error('Group name and project title are required');
      return;
    }
    if (submit && !hasSavedPrefs && picked.length === 0) {
      toast.error('Pick at least 1 guide preference before submitting');
      return;
    }
    const required = TEAM_TYPES[form.teamType]?.required;
    if (submit && required && form.members.length !== required) {
      toast.error(`${form.teamType} teams need exactly ${required} members to submit — you have ${form.members.length}`);
      return;
    }
    if (submit && !hasSavedPrefs && !confirmAction('Submit for admin approval? Your guide preferences cannot be changed after this.')) return;
    setBusy(submit ? 'submit' : 'save');
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
        teamType: form.teamType,
        members: form.members.map((m) => ({
          enrollmentNo: m.enrollmentNo,
          role: m.role,
        })),
        // Preferences are write-once, so they only go up while none are saved.
        ...(!hasSavedPrefs && picked.length > 0 && { guidePreferences: picked }),
      };
      const res = await studentAPI.updateMyTeam(payload);
      if (res.data.rejected?.length > 0) {
        toast.error(`Saved, but ${res.data.rejected.length} member(s) were rejected (see console)`);
        console.warn('Rejected members:', res.data.rejected);
      }
      if (submit) {
        const sub = await studentAPI.submitDetailsForApproval();
        toast.success(sub.data.message || 'Submitted for admin approval');
      } else if (!res.data.rejected?.length) {
        toast.success('Draft saved');
      }
      await onSaved();
    } catch (err) {
      toast.error(handleError(err));
      await onSaved(); // show whatever did get saved before the error
    } finally { setBusy(''); }
  };

  const excludeIds = (form.members || []).map((m) => m.student?._id || m.student).filter(Boolean);
  const rejectedResubmit = team.detailsApprovalStatus === 'rejected';

  return (
    <Card title="Project Details" icon={Edit3}>
      <form onSubmit={(e) => { e.preventDefault(); save(true); }} className="space-y-5">
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
          <TeamTypeSelect value={form.teamType} onChange={changeTeamType} required />
          <div>
            <label className="form-label">Project Title *</label>
            <input className="form-input" value={form.projectTitle || ''} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Project Description</label>
            <textarea className="form-input" rows="3" value={form.projectDescription || ''} onChange={(e) => setForm({ ...form, projectDescription: e.target.value })} placeholder="What the project does, who it's for, key features" />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">SDG / Theme</label>
            <input className="form-input" value={form.sdgSuggestion || ''} onChange={(e) => setForm({ ...form, sdgSuggestion: e.target.value })} />
          </div>
        </div>

        <TechStackFields form={form} onToggle={toggleArr} />

        {/* Guide preferences — write-once; picked here if not saved yet */}
        <div className="border-t border-slate-100 pt-4">
          <h6 className="font-semibold text-sm mb-1">Guide Preferences {!hasSavedPrefs && `(${picked.length}/3)`}</h6>
          {hasSavedPrefs ? (
            <div className="space-y-1.5 text-sm">
              {team.guidePreferences.map((g, i) => (
                <div key={g._id} className="flex items-center gap-2">
                  <span className="badge-secondary w-5 h-5 rounded-full flex items-center justify-center p-0 flex-shrink-0">{i + 1}</span>
                  <span className="font-medium">{g.name}</span>
                  <span className="text-slate-500 text-xs">{g.department || g.designation}</span>
                </div>
              ))}
              <p className="text-xs text-slate-500">Saved — can't be changed. Admin does the final allotment.</p>
            </div>
          ) : guidesLocked ? (
            <div className="alert-warning text-xs">
              <Lock className="w-4 h-4 flex-shrink-0" />
              Guide preferences can't be submitted right now. Contact admin.
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-3">
                Tap up to 3 guides in order of preference. <strong>They can't be changed once saved</strong> — admin does the final allotment.
              </p>
              <GuidePreferencePicker guides={guides} picked={picked} onToggle={(id) => setPicked((p) => togglePick(p, id))} />
            </>
          )}
        </div>

        {/* Members */}
        <div className="border-t border-slate-100 pt-4">
          <h6 className="font-semibold text-sm mb-3 flex items-center justify-between">
            <span>
              Team Members ({form.members?.length || 0}/{maxMembers})
              {stillNeeded > 0 && <span className="ml-2 badge-warning">{stillNeeded} more needed to submit</span>}
            </span>
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
          {(form.members?.length || 0) < maxMembers && (
            <div>
              <label className="form-label">Add member (search from admin-uploaded students)</label>
              <StudentPicker onPick={addMember} excludeIds={excludeIds} />
            </div>
          )}
        </div>

        {(team.guides || []).length === 0 && (
          <div className="alert-info text-xs">
            <Info className="w-4 h-4 flex-shrink-0" />
            Your guide approves these details, so you can submit once admin allots your guide. Keep saving drafts until then.
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => save(false)} disabled={!!busy} className="btn-secondary">
            {busy === 'save' ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Save Draft</>}
          </button>
          <button type="submit" disabled={!!busy || (team.guides || []).length === 0} className="btn-success">
            {busy === 'submit' ? <Spinner size="sm" className="text-white" /> : <><CheckCircle2 className="w-4 h-4" /> {rejectedResubmit ? 'Save & Resubmit for Approval' : 'Submit for Approval'}</>}
          </button>
          <span className="text-xs text-slate-500">Submit saves everything above and sends it to your guide. You can't edit while it's pending.</span>
        </div>
      </form>
    </Card>
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
    projectDescription: '',
    sdgSuggestion: '',
    projectDomain: [],
    frontendTech: [],
    backendTech: [],
    database: [],
    teamType: '',
    members: [], // {student, enrollmentNo, name, role}
  });
  const toggleTech = (key, value) => setForm((p) => ({ ...p, [key]: toggleIn(p[key], value) }));
  // You (the leader) + these members; the limit depends on the team type.
  const maxOthers = form.teamType ? maxMembersFor(form.teamType) - 1 : 0;

  const changeTeamType = (type) => {
    if (form.members.length > maxMembersFor(type) - 1) {
      toast.error(`${type} teams can have at most ${maxMembersFor(type)} members including you — remove ${form.members.length - (maxMembersFor(type) - 1)} first`);
      return;
    }
    setForm((p) => ({ ...p, teamType: type }));
  };
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [guides, setGuides] = useState([]);
  const [guidePrefs, setGuidePrefs] = useState([]); // ordered guide ids, max 3

  useEffect(() => {
    studentAPI.getAvailableGuides()
      .then((res) => setGuides(res.data.data))
      .catch(() => {}); // no guides yet — the picker shows its own empty state
  }, []);

  const addMember = (student) => {
    if (form.members.length >= maxOthers) {
      toast.error(`${form.teamType} teams can have at most ${maxOthers + 1} members including you`);
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
        enrollmentNo: student.enrollmentNo || student.enrollmentNumber,
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
    if (!form.teamType) {
      toast.error('Choose the team type — SIH or Non SIH');
      return;
    }
    setSubmitting(true);
    try {
      const res = await studentAPI.createTeam({
        ...form,
        guidePreferences: guidePrefs,
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
          <TeamTypeSelect value={form.teamType} onChange={changeTeamType} required />
          <div>
            <label className="form-label">Group Name *</label>
            <input className="form-input" placeholder="e.g. Tech Titans" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Project Title *</label>
            <input className="form-input" placeholder="e.g. Smart Attendance with Face Recognition" value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Project Description</label>
            <textarea
              className="form-input" rows="3"
              value={form.projectDescription}
              onChange={(e) => setForm({ ...form, projectDescription: e.target.value })}
              placeholder="What the project does, who it's for, key features"
            />
          </div>
        </div>

        <TechStackFields form={form} onToggle={toggleTech} />

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

        {/* Guide preferences — picked up front, alongside the project details */}
        <div>
          <h6 className="font-semibold text-sm mb-1">Guide Preferences ({guidePrefs.length}/3)</h6>
          <p className="text-xs text-slate-500 mb-3">
            Tap up to 3 guides in order of preference. <strong>These can't be changed after the team is created</strong> — admin does the final allotment.
          </p>
          <GuidePreferencePicker guides={guides} picked={guidePrefs} onToggle={(id) => setGuidePrefs((p) => togglePick(p, id))} />
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
          <h6 className="font-semibold text-sm mb-1">
            Add Members {form.teamType && `(${form.members.length}/${maxOthers}${form.teamType === 'SIH' ? '' : ' optional'})`}
          </h6>
          <p className="text-xs text-slate-500 mb-3">
            {form.teamType === 'SIH'
              ? 'SIH teams need 6 members including you. You can add them now or later — all 6 are needed before submitting for approval.'
              : "Search students from your semester. Only students uploaded by admin who aren't already in another team will appear."}
          </p>

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

          {!form.teamType ? (
            <div className="alert-info text-xs"><Info className="w-4 h-4 flex-shrink-0" /> Choose the team type first — it decides how many members you can add.</div>
          ) : form.members.length < maxOthers && (
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
  const [availableGuides, setAvailableGuides] = useState([]);
  const [guidesLocked, setGuidesLocked] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await studentAPI.getMyTeam();
      setTeam(res.data.team);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  const fetchGuides = async () => {
    try {
      const res = await studentAPI.getAvailableGuides();
      setAvailableGuides(res.data.data);
      setGuidesLocked(res.data.locked);
    } catch {
      // Not in a team yet (404) or guides not set up — the picker handles
      // the empty case on its own, no need to nag with a toast.
    }
  };

  const refresh = async () => { await fetchTeam(); await fetchGuides(); };

  useEffect(() => { fetchTeam(); fetchGuides(); }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  // ============ NO TEAM YET ============
  if (!team) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Your Team</h1>
          <p className="text-sm text-slate-500 mt-1">Choose SIH (6 members) or Non SIH (up to 4 members). You'll be the leader. Each student can only join one team.</p>
        </div>
        <CreateTeamForm user={user} onCreated={refresh} />
      </div>
    );
  }

  // ============ HAS TEAM ============
  const approvalStatus = team.detailsApprovalStatus || 'draft';
  const canEditDetails = !team.isLocked && approvalStatus !== 'pending' && approvalStatus !== 'approved';
  const APPROVAL_BADGE = {
    draft: <span className="badge-secondary">Draft</span>,
    pending: <span className="badge-warning"><Clock className="w-3 h-3" /> Pending Guide Approval</span>,
    approved: <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Approved — Final</span>,
    rejected: <span className="badge-danger"><XCircle className="w-3 h-3" /> Rejected — Revise &amp; Resubmit</span>,
  };
  const techRows = TECH_GROUPS.filter(({ key }) => (team[key] || []).length > 0);

  const guideCard = (
    <Card title={(team.guides || []).length > 1 ? 'Project Guides' : 'Project Guide'} icon={UserCheck}>
      {team.guides?.length ? (
        // Final allotment — set only by admin, students cannot change it.
        <div className="space-y-3 text-sm">
          {team.guides.map((g) => (
            <div key={g._id}>
              <div className="font-semibold text-base">{g.name}</div>
              <div className="text-slate-500">{g.email}</div>
              {g.mobile && <div className="text-slate-500">📱 {g.mobile}</div>}
            </div>
          ))}
        </div>
      ) : team.guidePreferences?.length ? (
        <div className="space-y-3">
          <div className="alert-info text-xs">
            <Info className="w-4 h-4 flex-shrink-0" />
            Waiting for admin's final allotment.
          </div>
          <div className="space-y-1.5 text-sm">
            {team.guidePreferences.map((g, i) => (
              <div key={g._id} className="flex items-center gap-2">
                <span className="badge-secondary w-5 h-5 rounded-full flex items-center justify-center p-0 flex-shrink-0">{i + 1}</span>
                <span className="font-medium">{g.name}</span>
                <span className="text-slate-500 text-xs">{g.department || g.designation}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="alert-warning text-xs">
          <Lock className="w-4 h-4 flex-shrink-0" />
          No guide preferences were submitted. Contact admin.
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
          My Team
          <span className={team.teamType === 'SIH' ? 'badge-primary' : 'badge-info'}>{team.teamType || 'Non SIH'}</span>
          {team.isLocked && <span className="badge-secondary"><Lock className="w-3 h-3" /> Locked by Admin</span>}
          {APPROVAL_BADGE[approvalStatus]}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {canEditDetails
            ? 'Fill in your project details below, then click Submit for Approval — it saves and sends them to your guide in one go.'
            : 'All your team details.'}
        </p>
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

      {!team.isLocked && approvalStatus === 'pending' && (
        <div className="alert-warning">
          <Clock className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Your project details are with your guide for approval.</strong>
            <p className="text-xs mt-1">You can't edit them until your guide approves or rejects the submission.</p>
          </div>
        </div>
      )}

      {!team.isLocked && approvalStatus === 'approved' && (
        <div className="alert-success">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Your project details have been approved and are now final.</strong>
            <p className="text-xs mt-1">Contact admin if you need to make further changes.</p>
          </div>
        </div>
      )}

      {!team.isLocked && approvalStatus === 'rejected' && (
        <div className="alert-danger">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Your project details were rejected by your guide.</strong>
            <p className="text-xs mt-1">Reason: "{team.detailsRejectionReason}"</p>
            <p className="text-xs mt-1">Fix the details below, then click Save &amp; Resubmit for Approval.</p>
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

      {canEditDetails ? (
        <>
          <TeamDetailsForm
            team={team}
            currentUser={user}
            guides={availableGuides}
            guidesLocked={guidesLocked}
            onSaved={refresh}
          />
          {team.guides?.length > 0 && guideCard}
        </>
      ) : (
        <>
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
                    <div className="text-slate-700 whitespace-pre-line">{team.projectDescription}</div>
                  </div>
                )}
                {team.sdgSuggestion && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">SDG / Theme</div>
                    <div className="text-slate-700">{team.sdgSuggestion}</div>
                  </div>
                )}
                {techRows.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Technology Stack</div>
                    <div className="space-y-1">
                      {techRows.map(({ key, label }) => (
                        <div key={key} className="flex flex-wrap items-center gap-1">
                          <span className="text-xs text-slate-500 w-16">{label}</span>
                          {team[key].map((t) => <span key={t} className="badge-info text-[10px]">{t}</span>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Academic Year</div>
                  <div>{team.academicYear?.yearName} · Sem {team.semester}</div>
                </div>
              </div>
            </Card>
            {guideCard}
          </div>

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
        </>
      )}

      {!team.isLocked && (
        <LeaderChangeSection team={team} currentUser={user} onSaved={fetchTeam} />
      )}
    </div>
  );
};

export default StudentTeam;
