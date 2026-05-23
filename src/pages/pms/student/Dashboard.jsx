import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, FolderOpen, Users, CloudUpload, ArrowRight, ClipboardCheck, GraduationCap, Code2, TrendingUp, FolderArchive } from 'lucide-react';
import { studentAPI } from '../../../api/pms';
import { Card, Spinner, StatCard, EmptyState } from '../../../components/pms/Common';
import { useAuth } from '../../../context/pms/AuthContext';
import { semesterToProject } from '../../../utils/pms/helpers';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.dashboard()
      .then((res) => setTeam(res.data.team))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hello, {user?.name} 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome to your project workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Enrollment Number"
          value={user?.enrollmentNo}
          icon={CreditCard}
          color="primary"
          meta={<><GraduationCap className="w-3 h-3 inline mr-1" /> {user?.semester}th Semester</>}
        />
        <StatCard
          label="Project Type"
          value={semesterToProject(user?.semester)}
          icon={FolderOpen}
          color="success"
          meta="Auto-mapped to your semester"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="My Project Team" icon={Users}>
          {team ? (
            <>
              <h5 className="font-semibold text-base mb-1">{team.groupName}</h5>
              <p className="text-sm text-slate-500 mb-2">
                Group: <span className="badge-primary">{team.groupNo}</span>
              </p>
              <p className="mb-3"><strong>Title:</strong> {team.projectTitle}</p>
              <Link to="/pms/student/team" className="btn-outline btn-sm">
                <ArrowRight className="w-3 h-3" /> View team details
              </Link>
            </>
          ) : (
            <EmptyState
              icon={Users}
              title="No team yet"
              message="Form a team with up to 5 members to get started."
              action={<Link to="/pms/student/team" className="btn-primary"><Users className="w-4 h-4" /> Create Team</Link>}
            />
          )}
        </Card>

        <Card title="Presentations & Marks" icon={CloudUpload}>
          {team ? (
            <>
              <p className="text-sm text-slate-500 mb-3">Submit your presentations on time to keep on track.</p>
              <div className="flex gap-2 flex-wrap">
                <Link to="/pms/student/presentations" className="btn-outline">
                  <ArrowRight className="w-4 h-4" /> Presentations
                </Link>
                <Link to="/pms/student/marks" className="btn-secondary">
                  <ClipboardCheck className="w-4 h-4" /> Check marks
                </Link>
              </div>
            </>
          ) : (
            <EmptyState icon={CloudUpload} title="Form a team first" message="Once your team is created, presentations will appear here." />
          )}
        </Card>
      </div>

      {/* Tools shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/pms/student/progress" className="card p-5 hover:shadow-card transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Project Progress</h3>
              <p className="text-xs text-slate-500">Track tasks, milestones & updates</p>
            </div>
          </div>
        </Link>
        <Link to="/pms/student/code-editor" className="card p-5 hover:shadow-card transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Code Editor</h3>
              <p className="text-xs text-slate-500">Run Python, JS, Java, C, C++, HTML</p>
            </div>
          </div>
        </Link>
        <Link to="/pms/student/resources" className="card p-5 hover:shadow-card transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Templates & Formats</h3>
              <p className="text-xs text-slate-500">Download report & PPT formats</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
