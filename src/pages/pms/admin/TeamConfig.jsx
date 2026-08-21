import { useState, useEffect } from 'react';
import { SlidersHorizontal, Info, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner } from '../../../components/pms/Common';

const blankConfig = { minTeamSize: 1, maxTeamSize: 5, minGuideTeams: '', maxGuideTeams: '' };

const TeamConfig = () => {
  const [years, setYears] = useState([]);
  const [yearId, setYearId] = useState('');
  const [semester, setSemester] = useState('');
  const [config, setConfig] = useState(blankConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI.listYears().then((res) => {
      setYears(res.data.years);
      const active = res.data.years.find((y) => y.isActive);
      if (active) setYearId(active._id);
    }).catch((err) => toast.error(handleError(err)));
  }, []);

  const load = async () => {
    if (!yearId || !semester) return;
    setLoading(true);
    try {
      const res = await adminAPI.getTeamConfig({ academicYear: yearId, semester });
      const c = res.data.config;
      setConfig({
        minTeamSize: c.minTeamSize ?? 1,
        maxTeamSize: c.maxTeamSize ?? 5,
        minGuideTeams: c.minGuideTeams ?? '',
        maxGuideTeams: c.maxGuideTeams ?? '',
      });
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [yearId, semester]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.upsertTeamConfig({ academicYear: yearId, semester, ...config });
      toast.success('Team configuration saved');
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Configuration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Set minimum/maximum team size and the maximum number of teams a single guide can be assigned, per academic year and semester.
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={yearId} onChange={(e) => setYearId(e.target.value)}>
              <option value="">Select year</option>
              {years.map((y) => (
                <option key={y._id} value={y._id}>{y.yearName}{y.isActive ? ' (active)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">Select semester</option>
              {[5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}th Semester</option>)}
            </select>
          </div>
        </div>
      </Card>

      {yearId && semester && (
        loading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : (
          <Card title="Configuration" icon={SlidersHorizontal}>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Minimum Team Size</label>
                  <input
                    type="number" min="1" className="form-input"
                    value={config.minTeamSize}
                    onChange={(e) => setConfig({ ...config, minTeamSize: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Maximum Team Size</label>
                  <input
                    type="number" min="1" className="form-input"
                    value={config.maxTeamSize}
                    onChange={(e) => setConfig({ ...config, maxTeamSize: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Min Teams per Guide (target, optional)</label>
                  <input
                    type="number" min="0" className="form-input" placeholder="No minimum"
                    value={config.minGuideTeams}
                    onChange={(e) => setConfig({ ...config, minGuideTeams: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Max Teams per Guide (optional)</label>
                  <input
                    type="number" min="1" className="form-input" placeholder="No maximum"
                    value={config.maxGuideTeams}
                    onChange={(e) => setConfig({ ...config, maxGuideTeams: e.target.value })}
                  />
                </div>
              </div>
              <div className="alert-info text-xs">
                <Info className="w-4 h-4 flex-shrink-0" />
                Min team size / min teams per guide are shown as guidance on the Allocation Sheet, not hard-blocked. Max team size and max teams per guide are enforced when editing a team or assigning a guide.
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" className="text-white" /> : <><Save className="w-4 h-4" /> Save Configuration</>}
              </button>
            </form>
          </Card>
        )
      )}
    </div>
  );
};

export default TeamConfig;
