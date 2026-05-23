import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ClipboardList, ArrowRight, CheckSquare, Users, FolderOpen, Inbox, Award, Activity } from 'lucide-react';
import { guideAPI } from '../../../api/pms';
import { Card, Spinner, StatCard, EmptyState } from '../../../components/pms/Common';
import { useAuth } from '../../../context/pms/AuthContext';

const GuideDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guideAPI.dashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;
  const { teams = [], stats = {} } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">Your supervised teams at a glance.</p>
        </div>
        <Link to="/pms/guide/status" className="btn-outline">
          <Activity className="w-4 h-4" /> Project Status Overview
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Teams Assigned" value={stats.totalTeams || 0} icon={Layers} color="primary" meta="Active project groups" />
        <StatCard label="Pending Reviews" value={stats.pendingReviews || 0} icon={ClipboardList} color="warning" meta="Submissions awaiting your action" />
      </div>

      <Card title="My Groups" icon={Users} noPadding>
        {teams.length === 0 ? (
          <EmptyState icon={Inbox} title="No teams assigned yet" message="Admin will assign teams to you soon." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Group</th><th>Project Title</th><th>Sem</th><th>Project</th><th>Year</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className="font-semibold">{t.groupNo}</div>
                      <div className="text-xs text-slate-500">{t.groupName}</div>
                    </td>
                    <td>{t.projectTitle}</td>
                    <td><span className="badge-info">{t.semester}th</span></td>
                    <td><span className="badge-primary">{t.project?.projectName}</span></td>
                    <td className="text-sm">{t.academicYear?.yearName}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/guide/review/${t._id}`} className="btn-outline btn-sm" title="Review submissions">
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link to={`/guide/rubrics/${t._id}`} className="btn-secondary btn-sm" title="Rubric marks">
                          <Award className="w-3 h-3" />
                        </Link>
                        <Link to={`/guide/attendance?teamId=${t._id}`} className="btn-secondary btn-sm" title="Attendance">
                          <CheckSquare className="w-3 h-3" />
                        </Link>
                      </div>
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

export default GuideDashboard;
