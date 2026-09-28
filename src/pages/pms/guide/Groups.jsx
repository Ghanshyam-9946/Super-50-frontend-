import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, CheckSquare, Inbox, Award, Activity, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { downloadFile } from '../../../utils/downloadFile';

// The tech-stack lists the team filled in on its initiation form.
const TECH_KEYS = [
  ['projectDomain', 'Domain'],
  ['frontendTech', 'Frontend'],
  ['backendTech', 'Backend'],
  ['database', 'Database'],
];

const GuideGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');

  const getForm = async (group) => {
    setDownloading(group._id);
    try {
      await downloadFile(guideAPI.initiationFormUrl(group._id), `initiation_form_${group.groupNo}.pdf`);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setDownloading('');
    }
  };

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
                    <td className="max-w-md">
                      <div className="font-medium">{g.projectTitle}</div>
                      {g.projectDescription && (
                        <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-line">{g.projectDescription}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="badge-primary">{g.project?.projectName}</span>
                        {TECH_KEYS.flatMap(([key, label]) =>
                          (g[key] || []).map((v) => (
                            <span key={`${key}-${v}`} className="badge-secondary text-[10px]" title={label}>{v}</span>
                          ))
                        )}
                      </div>
                      {g.sdgSuggestion && (
                        <div className="text-[11px] text-slate-400 mt-1">SDG / Theme: {g.sdgSuggestion}</div>
                      )}
                    </td>
                    <td><span className="badge-info">{g.semester}th</span></td>
                    <td className="text-sm">{g.teamLeader?.name}<div className="text-xs text-slate-400">{g.teamLeader?.enrollmentNo}</div></td>
                    <td><span className="badge-secondary">{g.members?.length || 0}</span></td>
                    <td className="text-sm">{g.academicYear?.yearName}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/pms/guide/review/${g._id}`} className="btn-outline btn-sm" title="Review submissions">
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link to={`/pms/guide/status/${g._id}`} className="btn-secondary btn-sm" title="Project status">
                          <Activity className="w-3 h-3" />
                        </Link>
                        <Link to={`/pms/guide/rubrics/${g._id}`} className="btn-secondary btn-sm" title="Rubric marks">
                          <Award className="w-3 h-3" />
                        </Link>
                        <Link to={`/pms/guide/attendance?teamId=${g._id}`} className="btn-secondary btn-sm" title="Attendance">
                          <CheckSquare className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => getForm(g)}
                          disabled={downloading === g._id}
                          className="btn-secondary btn-sm disabled:opacity-40"
                          title="Download initiation form (PDF)"
                        >
                          {downloading === g._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        </button>
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
