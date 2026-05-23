import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Layers, ArrowRight, Activity, ListChecks, Target, Clock, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { formatDateTime, cn } from '../../../utils/pms/helpers';

const phaseColor = (phase) => {
  const colors = {
    ideation: 'bg-purple-100 text-purple-700',
    planning: 'bg-blue-100 text-blue-700',
    design: 'bg-cyan-100 text-cyan-700',
    development: 'bg-amber-100 text-amber-700',
    testing: 'bg-orange-100 text-orange-700',
    deployment: 'bg-emerald-100 text-emerald-700',
    complete: 'bg-green-100 text-green-700',
  };
  return colors[phase] || 'bg-slate-100 text-slate-700';
};

const progressColor = (pct) => {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  if (pct >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

const GuideStatus = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guideAPI.getAllGroupsStatus()
      .then((res) => setRows(res.data.rows))
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  // Aggregate stats
  const avgProgress = rows.length > 0
    ? Math.round(rows.reduce((sum, r) => sum + (r.overallProgress || 0), 0) / rows.length)
    : 0;
  const activeTeams = rows.filter((r) => r.currentPhase !== 'ideation' && r.currentPhase !== 'complete').length;
  const completedTeams = rows.filter((r) => r.currentPhase === 'complete').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Status Overview</h1>
        <p className="text-sm text-slate-500 mt-1">View progress, phase, and recent activity across all your supervised teams.</p>
      </div>

      {/* Aggregate */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">Total Teams</div>
            <div className="text-3xl font-bold">{rows.length}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">Avg Progress</div>
            <div className="text-3xl font-bold text-brand-700">{avgProgress}%</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className={cn('h-full', progressColor(avgProgress))} style={{ width: `${avgProgress}%` }} />
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">Active Teams</div>
            <div className="text-3xl font-bold text-amber-600">{activeTeams}</div>
            <div className="text-xs text-slate-500 mt-1">In development phases</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">Completed</div>
            <div className="text-3xl font-bold text-emerald-600">{completedTeams}</div>
          </Card>
        </div>
      )}

      <Card title={<>Team-wise Status <span className="badge-secondary ml-1">{rows.length}</span></>} icon={Layers} noPadding>
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No groups assigned" message="When admin assigns teams, their progress will show here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group</th><th>Project</th><th>Phase</th><th>Progress</th>
                  <th>Tasks</th><th>Milestones</th><th>Last Update</th>
                  <th className="text-right">View</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.team._id}>
                    <td>
                      <div className="font-semibold text-xs">{r.team.groupNo}</div>
                      <div className="text-xs text-slate-500">{r.team.groupName}</div>
                    </td>
                    <td>
                      <div className="text-sm">{r.team.projectTitle}</div>
                      <div className="text-xs text-slate-400">Sem {r.team.semester}</div>
                    </td>
                    <td>
                      <span className={cn('text-xs px-2 py-0.5 rounded font-medium', phaseColor(r.currentPhase))}>
                        {r.currentPhase.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={cn('h-full', progressColor(r.overallProgress))} style={{ width: `${r.overallProgress}%` }} />
                        </div>
                        <span className="text-xs font-semibold w-10">{r.overallProgress}%</span>
                      </div>
                    </td>
                    <td className="text-sm">{r.tasksCompleted}/{r.tasksTotal}</td>
                    <td className="text-sm">{r.milestonesCompleted}/{r.milestonesTotal}</td>
                    <td className="text-xs text-slate-500">
                      {r.lastUpdateAt ? formatDateTime(r.lastUpdateAt) : '—'}
                    </td>
                    <td className="text-right">
                      <Link to={`/guide/status/${r.team._id}`} className="btn-outline btn-sm">
                        <ArrowRight className="w-3 h-3" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GuideStatus;
