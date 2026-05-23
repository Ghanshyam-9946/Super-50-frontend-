import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, TrendingUp, Activity, ListChecks, Target, AlertTriangle,
  CheckCircle2, Circle, Loader2, AlertOctagon, Calendar, Award, MessageSquarePlus, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatCard } from '../../../components/pms/Common';
import { formatDate, formatDateTime, cn } from '../../../utils/pms/helpers';

const phaseColor = (phase) => ({
  ideation: 'bg-purple-100 text-purple-700',
  planning: 'bg-blue-100 text-blue-700',
  design: 'bg-cyan-100 text-cyan-700',
  development: 'bg-amber-100 text-amber-700',
  testing: 'bg-orange-100 text-orange-700',
  deployment: 'bg-emerald-100 text-emerald-700',
  complete: 'bg-green-100 text-green-700',
}[phase] || 'bg-slate-100 text-slate-700');

const TASK_STATUS = {
  todo: { color: 'badge-secondary', label: 'To Do' },
  in_progress: { color: 'badge-warning', label: 'In Progress' },
  completed: { color: 'badge-success', label: 'Completed' },
  blocked: { color: 'badge-danger', label: 'Blocked' },
};

const updateTypeColor = (type) => ({
  progress: 'bg-blue-100 text-blue-700',
  achievement: 'bg-emerald-100 text-emerald-700',
  blocker: 'bg-red-100 text-red-700',
  note: 'bg-slate-100 text-slate-700',
}[type] || 'bg-slate-100 text-slate-700');

const updateTypeIcon = (type) => {
  if (type === 'achievement') return Award;
  if (type === 'blocker') return AlertOctagon;
  return TrendingUp;
};

const GuideStatusDetail = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guideAPI.getGroupStatus(teamId)
      .then((res) => {
        setTeam(res.data.team);
        setProgress(res.data.progress);
      })
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;
  if (!team) return <Card><EmptyState icon={AlertTriangle} title="Team not found" /></Card>;

  const overallProgress = progress?.overallProgress || 0;
  const currentPhase = progress?.currentPhase || 'ideation';
  const tasks = progress?.tasks || [];
  const milestones = progress?.milestones || [];
  const updates = progress?.updates || [];
  const tasksCompleted = tasks.filter((t) => t.status === 'completed').length;
  const milestonesCompleted = milestones.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <Link to="/pms/guide/status" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1 mb-2">
            <ChevronLeft className="w-3 h-3" /> Back to all teams
          </Link>
          <h1 className="text-2xl font-bold">{team.groupName}</h1>
          <p className="text-sm text-slate-500 mt-1">{team.groupNo} · {team.projectTitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Progress" value={`${overallProgress}%`} icon={TrendingUp} color="primary" />
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">Current Phase</div>
          <span className={cn('inline-block px-2.5 py-1 rounded text-sm font-bold capitalize', phaseColor(currentPhase))}>
            {currentPhase.replace('_', ' ')}
          </span>
        </Card>
        <StatCard label="Tasks" value={`${tasksCompleted}/${tasks.length}`} icon={ListChecks} color="success" />
        <StatCard label="Milestones" value={`${milestonesCompleted}/${milestones.length}`} icon={Target} color="warning" />
      </div>

      {/* Progress bar */}
      <Card>
        <div className="mb-3 flex justify-between items-center">
          <span className="text-sm font-semibold">Overall Progress</span>
          <span className="text-2xl font-bold text-brand-700">{overallProgress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </Card>

      {/* Team info */}
      <Card title="Team Info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Team Leader</div>
            <div className="font-semibold mt-1">{team.teamLeader?.name} <span className="text-slate-400 text-xs">({team.teamLeader?.enrollmentNo})</span></div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Members</div>
            <div className="font-semibold mt-1">{team.members?.length || 0} members</div>
          </div>
        </div>
      </Card>

      {/* Milestones */}
      <Card title={<>Milestones <span className="badge-secondary ml-1">{milestones.length}</span></>} icon={Target}>
        {milestones.length === 0 ? (
          <EmptyState icon={Target} title="No milestones set" />
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m._id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="font-semibold flex items-center gap-2">
                    {m.title}
                    <span className={cn(
                      'badge-secondary',
                      m.status === 'completed' && 'badge-success',
                      m.status === 'in_progress' && 'badge-warning',
                      m.status === 'delayed' && 'badge-danger'
                    )}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                  {m.targetDate && (
                    <span className="text-xs text-slate-500">
                      <Calendar className="w-3 h-3 inline" /> {formatDate(m.targetDate)}
                    </span>
                  )}
                </div>
                {m.description && <p className="text-xs text-slate-500 mb-2">{m.description}</p>}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${m.completionPercentage}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-1 text-right">{m.completionPercentage}%</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tasks */}
      <Card title={<>Tasks <span className="badge-secondary ml-1">{tasks.length}</span></>} icon={ListChecks} noPadding>
        {tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Task</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Due</th></tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className="font-semibold">{t.title}</div>
                      {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                    </td>
                    <td><span className={TASK_STATUS[t.status]?.color || 'badge-secondary'}>{TASK_STATUS[t.status]?.label}</span></td>
                    <td><span className="badge-secondary capitalize">{t.priority}</span></td>
                    <td className="text-sm">{t.assignedTo?.name || '—'}</td>
                    <td className="text-sm">{t.dueDate ? formatDate(t.dueDate) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Updates timeline */}
      <Card title={<>Activity Log <span className="badge-secondary ml-1">{updates.length}</span></>} icon={Activity}>
        {updates.length === 0 ? (
          <EmptyState icon={Inbox} title="No updates posted" message="Team hasn't shared any progress updates yet." />
        ) : (
          <div className="space-y-3">
            {updates.map((u, i) => {
              const Icon = updateTypeIcon(u.type);
              return (
                <div key={u._id || i} className="flex gap-3">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', updateTypeColor(u.type))}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="font-semibold text-sm">{u.title}</span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(u.createdAt)}</span>
                    </div>
                    {u.content && <p className="text-sm text-slate-600">{u.content}</p>}
                    <div className="text-xs text-slate-400 mt-1">By {u.postedBy?.name || u.postedByName}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default GuideStatusDetail;
