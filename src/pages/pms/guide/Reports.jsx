import { useState, useEffect } from 'react';
import { Download, BarChart3, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { downloadCSV } from '../../../utils/pms/helpers';

const GuideReports = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guideAPI.reports()
      .then((res) => setGroups(res.data.groups))
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const rows = groups.map((g) => ({
      groupNo: g.groupNo,
      groupName: g.groupName,
      projectTitle: g.projectTitle,
      semester: g.semester,
      projectType: g.project?.projectName || '',
      members: g.members?.length || 0,
      year: g.academicYear?.yearName || '',
      sdg: g.sdgSuggestion || '',
    }));
    downloadCSV(rows, ['Group No', 'Group Name', 'Project Title', 'Sem', 'Project Type', 'Members', 'Year', 'SDG'], 'my_groups_report.csv');
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of all your supervised groups.</p>
        </div>
        {groups.length > 0 && (
          <button onClick={exportCSV} className="btn-success">
            <Download className="w-4 h-4" /> Download CSV
          </button>
        )}
      </div>

      <Card title={<>My Groups Overview <span className="badge-secondary ml-1">{groups.length}</span></>} icon={BarChart3} noPadding>
        {groups.length === 0 ? (
          <EmptyState icon={Inbox} title="No groups assigned yet" message="Once admin assigns groups, you can export their data here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Group</th><th>Project Title</th><th>Sem</th><th>Project Type</th><th>Members</th><th>Year</th></tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g._id}>
                    <td>
                      <div className="font-semibold">{g.groupNo}</div>
                      <div className="text-xs text-slate-500">{g.groupName}</div>
                    </td>
                    <td>{g.projectTitle}</td>
                    <td><span className="badge-info">{g.semester}th</span></td>
                    <td><span className="badge-primary">{g.project?.projectName}</span></td>
                    <td><span className="badge-secondary">{g.members?.length || 0}</span></td>
                    <td className="text-sm">{g.academicYear?.yearName}</td>
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

export default GuideReports;
