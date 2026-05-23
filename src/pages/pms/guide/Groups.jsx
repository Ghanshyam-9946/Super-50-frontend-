import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, CheckSquare, Inbox, Award, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';

const GuideGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guideAPI.getMyGroups()
      .then((res) => setGroups(res.data.groups))
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Groups</h1>
        <p className="text-sm text-slate-500 mt-1">All project teams assigned to you for supervision.</p>
      </div>

      <Card title={<>All My Groups <span className="badge-secondary ml-1">{groups.length}</span></>} icon={Layers} noPadding>
        {groups.length === 0 ? (
          <EmptyState icon={Inbox} title="No groups assigned" message="Once admin assigns teams to you, they will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Group</th><th>Project</th><th>Sem</th><th>Leader</th><th>Members</th><th>Year</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g._id}>
                    <td>
                      <div className="font-semibold">{g.groupNo}</div>
                      <div className="text-xs text-slate-500">{g.groupName}</div>
                    </td>
                    <td>
                      <div className="font-medium">{g.projectTitle}</div>
                      <span className="badge-primary mt-0.5">{g.project?.projectName}</span>
                    </td>
                    <td><span className="badge-info">{g.semester}th</span></td>
                    <td className="text-sm">{g.teamLeader?.name}<div className="text-xs text-slate-400">{g.teamLeader?.enrollmentNo}</div></td>
                    <td><span className="badge-secondary">{g.members?.length || 0}</span></td>
                    <td className="text-sm">{g.academicYear?.yearName}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/guide/review/${g._id}`} className="btn-outline btn-sm" title="Review submissions">
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link to={`/guide/status/${g._id}`} className="btn-secondary btn-sm" title="Project status">
                          <Activity className="w-3 h-3" />
                        </Link>
                        <Link to={`/guide/rubrics/${g._id}`} className="btn-secondary btn-sm" title="Rubric marks">
                          <Award className="w-3 h-3" />
                        </Link>
                        <Link to={`/guide/attendance?teamId=${g._id}`} className="btn-secondary btn-sm" title="Attendance">
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

export default GuideGroups;
