import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, Layers, Presentation, Calendar, CheckCircle2, Settings as SettingsIcon,
  CalendarPlus, ArrowUpCircle, Download, Zap, GitBranch,
} from 'lucide-react';
import { adminAPI } from '../../../api/pms';
import { Spinner, Card, StatCard, EmptyState } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  const { stats, activeYear } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your institution's project activity.</p>
        </div>
        <Link to="/pms/admin/settings" className="btn-secondary">
          <SettingsIcon className="w-4 h-4" /> Settings
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students" value={stats?.totalStudents ?? 0} icon={Users} color="primary" meta="Active learners" />
        <StatCard label="Project Guides" value={stats?.totalGuides ?? 0} icon={UserCheck} color="success" meta="Faculty supervisors" />
        <StatCard label="Total Teams" value={stats?.totalTeams ?? 0} icon={Layers} color="warning" meta="Project groups" />
        <StatCard label="Presentations" value={stats?.totalPresentations ?? 0} icon={Presentation} color="info" meta="Scheduled" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Active year */}
        <div className="lg:col-span-5">
          <Card title="Active Academic Year" icon={Calendar} action={<Link to="/pms/admin/academic-year" className="text-sm text-brand-600 hover:underline">Manage</Link>} className="h-full">
            {activeYear ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{activeYear.yearName}</h3>
                  <div className="text-sm text-slate-500">
                    {formatDate(activeYear.startDate)} — {formatDate(activeYear.endDate)}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No active academic year"
                message="Set up an academic year to get started."
                action={<Link to="/pms/admin/academic-year" className="btn-primary"><CalendarPlus className="w-4 h-4" /> Create Academic Year</Link>}
              />
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-7">
          <Card title="Quick Actions" icon={Zap} className="h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link to="/pms/admin/teams" className="btn-outline justify-start"><Layers className="w-4 h-4" /> Assign Guides to Teams</Link>
              <Link to="/pms/admin/attendance" className="btn-outline justify-start"><CheckCircle2 className="w-4 h-4" /> View Attendance</Link>
              <Link to="/pms/admin/presentations" className="btn-outline justify-start"><CalendarPlus className="w-4 h-4" /> Schedule Presentation</Link>
              <Link to="/pms/admin/promote" className="btn-outline justify-start"><ArrowUpCircle className="w-4 h-4" /> Promote Students</Link>
              <Link to="/pms/admin/reports" className="btn-outline justify-start"><Download className="w-4 h-4" /> Download Reports</Link>
              <Link to="/pms/admin/settings" className="btn-outline justify-start"><SettingsIcon className="w-4 h-4" /> App Settings</Link>
            </div>
          </Card>
        </div>

        {/* Mapping table */}
        <div className="lg:col-span-12">
          <Card title="Semester — Project Auto-mapping" icon={GitBranch} noPadding>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>Auto-mapped Project</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-semibold">5th Semester</td><td><span className="badge-info">Minor-1</span></td><td>Minor Project</td><td className="text-slate-500">Initial project exploration</td></tr>
                  <tr><td className="font-semibold">6th Semester</td><td><span className="badge-info">Minor-2</span></td><td>Minor Project</td><td className="text-slate-500">Continued from Minor-1</td></tr>
                  <tr><td className="font-semibold">7th Semester</td><td><span className="badge-warning">Major-1</span></td><td>Major Project</td><td className="text-slate-500">Final year project Phase 1</td></tr>
                  <tr><td className="font-semibold">8th Semester</td><td><span className="badge-danger">Major-2</span></td><td>Major Project</td><td className="text-slate-500">Final year project Phase 2</td></tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
