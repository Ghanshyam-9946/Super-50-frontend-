import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Filter, Lock, Unlock, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { downloadFile } from '../../../utils/downloadFile';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';

const AllocationSheet = () => {
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({ yearId: '', semester: '' });
  const [teams, setTeams] = useState([]);
  const [guides, setGuides] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingRow, setSavingRow] = useState('');
  const [togglingFinalize, setTogglingFinalize] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    adminAPI.listYears().then((res) => {
      setYears(res.data.years);
      const active = res.data.years.find((y) => y.isActive);
      if (active) setFilters((f) => ({ ...f, yearId: active._id }));
    }).catch((err) => toast.error(handleError(err)));
  }, []);

  const fetchAll = useCallback(async () => {
    if (!filters.yearId || !filters.semester) return;
    setLoading(true);
    try {
      const [t, g, c] = await Promise.all([
        adminAPI.listTeams({ yearId: filters.yearId, semester: filters.semester }),
        adminAPI.listGuides(),
        adminAPI.getTeamConfig({ academicYear: filters.yearId, semester: filters.semester }),
      ]);
      setTeams(t.data.teams);
      setGuides(g.data.guides);
      setConfig(c.data.config);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  }, [filters.yearId, filters.semester]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const guideLoad = (guideId) => teams.filter((t) => t.guide?._id === guideId).length;

  const setGuideForTeam = async (teamId, guideId) => {
    setSavingRow(teamId);
    try {
      await adminAPI.assignGuide(teamId, guideId || null);
      toast.success('Guide updated');
      fetchAll();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSavingRow('');
    }
  };

  const toggleFinalize = async () => {
    setTogglingFinalize(true);
    try {
      await adminAPI.setAllocationFinalized({
        academicYear: filters.yearId,
        semester: filters.semester,
        finalized: !config?.finalized,
      });
      toast.success(config?.finalized ? 'Allocation unlocked for editing' : 'Allocation finalized');
      fetchAll();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setTogglingFinalize(false);
    }
  };

  const exportPdf = async () => {
    setDownloading(true);
    try {
      await downloadFile(adminAPI.guideAllotmentUrl({ yearId: filters.yearId, semester: filters.semester }), 'guide_allotment_list.pdf');
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Allocation Sheet</h1>
        <p className="text-sm text-slate-500 mt-1">Review and edit team-guide assignments for a year/semester, then finalize.</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={filters.yearId} onChange={(e) => setFilters({ ...filters, yearId: e.target.value })}>
              <option value="">Select year</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}{y.isActive ? ' (active)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
              <option value="">Select semester</option>
              {[5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}th Semester</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={fetchAll} className="btn-outline w-full"><Filter className="w-4 h-4" /> Load</button>
          </div>
        </div>
      </Card>

      {filters.yearId && filters.semester && (
        loading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : teams.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No teams for this year/semester" />
        ) : (
          <>
            {config?.finalized && (
              <div className="alert-warning text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                This allocation has been finalized. Unlock it to reassign guides.
              </div>
            )}

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {guides.map((g) => {
                    const load = guideLoad(g._id);
                    const max = config?.maxGuideTeams;
                    const min = config?.minGuideTeams;
                    const over = max && load >= max;
                    const under = min != null && load < min;
                    return (
                      <span
                        key={g._id}
                        className={over ? 'badge-danger' : under ? 'badge-warning' : 'badge-secondary'}
                        title={g.name}
                      >
                        {g.name}: {load}{max ? `/${max}` : ''}
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={exportPdf} disabled={downloading} className="btn-outline">
                    {downloading ? <Spinner size="sm" /> : <><Download className="w-4 h-4" /> Export PDF</>}
                  </button>
                  <button onClick={toggleFinalize} disabled={togglingFinalize} className={config?.finalized ? 'btn-secondary' : 'btn-primary'}>
                    {togglingFinalize ? <Spinner size="sm" className="text-white" /> : config?.finalized ? <><Unlock className="w-4 h-4" /> Unlock</> : <><Lock className="w-4 h-4" /> Finalize</>}
                  </button>
                </div>
              </div>
            </Card>

            <Card title={<>Teams <span className="badge-secondary ml-1">{teams.length}</span></>} icon={ClipboardList} noPadding>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>Group</th><th>Project Title</th><th>Members</th><th>Guide</th></tr>
                  </thead>
                  <tbody>
                    {teams.map((t) => (
                      <tr key={t._id}>
                        <td className="font-semibold text-xs">{t.groupNo}</td>
                        <td>{t.projectTitle}</td>
                        <td><span className="badge-secondary">{t.members?.length || 0}</span></td>
                        <td>
                          <select
                            className="form-select"
                            value={t.guide?._id || ''}
                            disabled={!!config?.finalized || savingRow === t._id}
                            onChange={(e) => setGuideForTeam(t._id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {guides.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )
      )}
    </div>
  );
};

export default AllocationSheet;
