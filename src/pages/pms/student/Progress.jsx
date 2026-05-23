import { useState, useEffect } from 'react';
import {
  TrendingUp, CheckCircle2, Circle, AlertOctagon, Loader2, Plus, Trash2, Edit3,
  Calendar, Flag, MessageSquarePlus, Activity, Target, ListChecks, RefreshCw,
  Users, ChevronRight, Layers, AlertTriangle, Sparkles, Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal, StatCard, confirmAction } from '../../../components/pms/Common';
import { formatDate, formatDateTime, cn } from '../../../utils/pms/helpers';

const PHASES = [
  { id: 'ideation', label: 'Ideation', color: 'bg-purple-500' },
  { id: 'planning', label: 'Planning', color: 'bg-blue-500' },
  { id: 'design', label: 'Design', color: 'bg-cyan-500' },
  { id: 'development', label: 'Development', color: 'bg-amber-500' },
  { id: 'testing', label: 'Testing', color: 'bg-orange-500' },
  { id: 'deployment', label: 'Deployment', color: 'bg-emerald-500' },
  { id: 'complete', label: 'Complete', color: 'bg-green-600' },
];

const TASK_STATUS = [
  { id: 'todo', label: 'To Do', color: 'badge-secondary', icon: Circle },
  { id: 'in_progress', label: 'In Progress', color: 'badge-warning', icon: Loader2 },
  { id: 'completed', label: 'Completed', color: 'badge-success', icon: CheckCircle2 },
  { id: 'blocked', label: 'Blocked', color: 'badge-danger', icon: AlertOctagon },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'badge-secondary' },
  { id: 'medium', label: 'Medium', color: 'badge-info' },
  { id: 'high', label: 'High', color: 'badge-danger' },
];

const UPDATE_TYPES = [
  { id: 'progress', label: 'Progress', icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
  { id: 'achievement', label: 'Achievement', icon: Award, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'blocker', label: 'Blocker', icon: AlertOctagon, color: 'bg-red-100 text-red-700' },
  { id: 'note', label: 'Note', icon: MessageSquarePlus, color: 'bg-slate-100 text-slate-700' },
];

// ============ TASK MODAL ============
const TaskModal = ({ open, onClose, task, members, onSaved }) => {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      });
    } else {
      setForm({ title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', dueDate: '' });
    }
  }, [task, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null };
      if (task?._id) await studentAPI.updateTask(task._id, data);
      else await studentAPI.addTask(data);
      toast.success(task?._id ? 'Task updated' : 'Task added');
      onSaved();
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task?._id ? 'Edit Task' : 'New Task'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : 'Save Task'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="form-label">Task Title *</label>
          <input className="form-input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="2" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status || 'todo'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {TASK_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Priority</label>
          <select className="form-select" value={form.priority || 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Assigned To</label>
          <select className="form-select" value={form.assignedTo || ''} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">— Unassigned —</option>
            {(members || []).map((m) => (
              <option key={m.student._id} value={m.student._id}>{m.student.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Due Date</label>
          <input type="date" className="form-input" value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
};

// ============ MILESTONE MODAL ============
const MilestoneModal = ({ open, onClose, milestone, onSaved }) => {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (milestone) {
      setForm({
        title: milestone.title || '',
        description: milestone.description || '',
        targetDate: milestone.targetDate ? milestone.targetDate.slice(0, 10) : '',
        status: milestone.status || 'pending',
        completionPercentage: milestone.completionPercentage || 0,
      });
    } else {
      setForm({ title: '', description: '', targetDate: '', status: 'pending', completionPercentage: 0 });
    }
  }, [milestone, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...form, targetDate: form.targetDate || null };
      if (milestone?._id) await studentAPI.updateMilestone(milestone._id, data);
      else await studentAPI.addMilestone(data);
      toast.success(milestone?._id ? 'Milestone updated' : 'Milestone added');
      onSaved();
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={milestone?._id ? 'Edit Milestone' : 'New Milestone'}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : 'Save'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="2" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Target Date</label>
            <input type="date" className="form-input" value={form.targetDate || ''} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status || 'pending'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Completion % ({form.completionPercentage || 0}%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={form.completionPercentage || 0}
            onChange={(e) => setForm({ ...form, completionPercentage: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </form>
    </Modal>
  );
};

// ============ UPDATE MODAL ============
const UpdateModal = ({ open, onClose, onSaved }) => {
  const [form, setForm] = useState({ title: '', content: '', type: 'progress' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm({ title: '', content: '', type: 'progress' });
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await studentAPI.postUpdate(form);
      toast.success('Update posted');
      onSaved();
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Post Update"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : <><MessageSquarePlus className="w-4 h-4" /> Post</>}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="form-label">Type</label>
          <div className="grid grid-cols-4 gap-2">
            {UPDATE_TYPES.map((t) => {
              const Icon = t.icon;
              const active = form.type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.id })}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-colors',
                    active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{t.label}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Completed login flow" />
        </div>
        <div>
          <label className="form-label">Details</label>
          <textarea className="form-input" rows="4" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Optional more details for your guide..." />
        </div>
      </form>
    </Modal>
  );
};

// ============ MAIN ============
const StudentProgress = () => {
  const [team, setTeam] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [milestoneModal, setMilestoneModal] = useState({ open: false, milestone: null });
  const [updateModal, setUpdateModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getProgress();
      setTeam(res.data.team);
      setProgress(res.data.progress);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const setPhase = async (currentPhase) => {
    try {
      await studentAPI.updateProgressMeta({ currentPhase });
      toast.success(`Phase set to ${PHASES.find((p) => p.id === currentPhase)?.label}`);
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  const deleteTask = async (taskId) => {
    if (!confirmAction('Delete this task?')) return;
    try {
      await studentAPI.deleteTask(taskId);
      toast.success('Task deleted');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  const deleteMilestone = async (id) => {
    if (!confirmAction('Delete this milestone?')) return;
    try {
      await studentAPI.deleteMilestone(id);
      toast.success('Milestone deleted');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  if (!team) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="Form a team first"
          message="You need to be in a team to track progress."
        />
      </Card>
    );
  }

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
          <h1 className="text-2xl font-bold">Project Progress</h1>
          <p className="text-sm text-slate-500 mt-1">Track milestones, tasks, and post updates for your guide.</p>
        </div>
        <button onClick={() => setUpdateModal(true)} className="btn-primary">
          <MessageSquarePlus className="w-4 h-4" /> Post Update
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Progress" value={`${overallProgress}%`} icon={TrendingUp} color="primary" meta="Auto-calculated" />
        <StatCard label="Current Phase" value={PHASES.find((p) => p.id === currentPhase)?.label} icon={Activity} color="info" />
        <StatCard label="Tasks Completed" value={`${tasksCompleted}/${tasks.length}`} icon={ListChecks} color="success" />
        <StatCard label="Milestones Hit" value={`${milestonesCompleted}/${milestones.length}`} icon={Target} color="warning" />
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

      {/* Phase selector */}
      <Card title="Project Phase" icon={Activity}>
        <div className="flex flex-wrap gap-2">
          {PHASES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPhase(p.id)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                currentPhase === p.id
                  ? `${p.color} text-white shadow-md scale-105`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Milestones */}
      <Card
        title={<>Milestones <span className="badge-secondary ml-1">{milestones.length}</span></>}
        icon={Target}
        action={
          <button onClick={() => setMilestoneModal({ open: true, milestone: null })} className="btn-outline btn-sm">
            <Plus className="w-3 h-3" /> Add
          </button>
        }
      >
        {milestones.length === 0 ? (
          <EmptyState icon={Target} title="No milestones yet" message="Add key targets like 'MVP demo' or 'Final integration'." />
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m._id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
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
                  {m.description && <p className="text-xs text-slate-500 mt-1">{m.description}</p>}
                  {m.targetDate && (
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Target: {formatDate(m.targetDate)}
                    </div>
                  )}
                  <div className="mt-2">
                    <div className="text-xs text-slate-500 mb-1">{m.completionPercentage}%</div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-brand-500" style={{ width: `${m.completionPercentage}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setMilestoneModal({ open: true, milestone: m })} className="btn-secondary btn-sm">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteMilestone(m._id)} className="btn-secondary btn-sm text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tasks */}
      <Card
        title={<>Tasks <span className="badge-secondary ml-1">{tasks.length}</span></>}
        icon={ListChecks}
        action={
          <button onClick={() => setTaskModal({ open: true, task: null })} className="btn-outline btn-sm">
            <Plus className="w-3 h-3" /> Add Task
          </button>
        }
        noPadding
      >
        {tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks" message="Break work into tasks to track who's doing what." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Task</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Due</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const statusObj = TASK_STATUS.find((s) => s.id === t.status);
                  const priorityObj = PRIORITIES.find((p) => p.id === t.priority);
                  return (
                    <tr key={t._id}>
                      <td>
                        <div className="font-semibold">{t.title}</div>
                        {t.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</div>}
                      </td>
                      <td><span className={statusObj?.color || 'badge-secondary'}>{statusObj?.label}</span></td>
                      <td><span className={priorityObj?.color || 'badge-secondary'}>{priorityObj?.label}</span></td>
                      <td className="text-sm">{t.assignedTo?.name || '—'}</td>
                      <td className="text-sm">{t.dueDate ? formatDate(t.dueDate) : '—'}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setTaskModal({ open: true, task: t })} className="btn-outline btn-sm">
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteTask(t._id)} className="btn-secondary btn-sm text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Updates timeline */}
      <Card
        title={<>Activity Log <span className="badge-secondary ml-1">{updates.length}</span></>}
        icon={Activity}
      >
        {updates.length === 0 ? (
          <EmptyState icon={Activity} title="No updates posted yet" message="Use 'Post Update' to share progress with your guide." />
        ) : (
          <div className="space-y-3">
            {updates.map((u, i) => {
              const typeObj = UPDATE_TYPES.find((t) => t.id === u.type) || UPDATE_TYPES[0];
              const Icon = typeObj.icon;
              return (
                <div key={u._id || i} className="flex gap-3">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', typeObj.color)}>
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

      <TaskModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null })}
        task={taskModal.task}
        members={team.members}
        onSaved={fetchData}
      />
      <MilestoneModal
        open={milestoneModal.open}
        onClose={() => setMilestoneModal({ open: false, milestone: null })}
        milestone={milestoneModal.milestone}
        onSaved={fetchData}
      />
      <UpdateModal
        open={updateModal}
        onClose={() => setUpdateModal(false)}
        onSaved={fetchData}
      />
    </div>
  );
};

export default StudentProgress;
