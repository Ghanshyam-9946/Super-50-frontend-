import { useState, useEffect } from 'react';
import { FileText, Download, Users, ScrollText, ExternalLink, Filter, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';

const Forms = () => {
  const [years, setYears] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({ yearId: '', semester: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [y, t] = await Promise.all([adminAPI.listYears(), adminAPI.listTeams(filters)]);
      setYears(y.data.years);
      setTeams(t.data.teams);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const apply = (e) => { e.preventDefault(); fetchData(); };

  // Build query params for PDFs based on current filters
  const pdfParams = {};
  if (filters.yearId) pdfParams.yearId = filters.yearId;
  if (filters.semester) pdfParams.semester = filters.semester;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Forms &amp; PDF Generation</h1>
        <p className="text-sm text-slate-500 mt-1">Generate SISTec-format PDFs for initiation forms and guide allotment lists.</p>
      </div>

      {/* Filter */}
      <Card>
        <form onSubmit={apply} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={filters.yearId} onChange={(e) => setFilters({ ...filters, yearId: e.target.value })}>
              <option value="">All years</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
              <option value="">All</option>
              {[5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}th Semester</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full"><Filter className="w-4 h-4" /> Apply Filters</button>
          </div>
        </form>
      </Card>

      {/* Bulk PDF cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="All Initiation Forms (Bulk PDF)" icon={ScrollText}>
          <p className="text-sm text-slate-500 mb-4">
            Generate a single PDF containing the initiation form for <strong>every team</strong> matching the filters above.
            Each group's form is on its own page in SISTec format.
          </p>
          <div className="space-y-2">
            <a
              href={adminAPI.bulkInitiationFormsUrl(pdfParams)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full"
            >
              <Download className="w-4 h-4" /> Download Bulk Initiation Forms PDF
            </a>
            <p className="form-help">Will include {teams.length} teams</p>
          </div>
        </Card>

        <Card title="Guide Allotment List" icon={Users}>
          <p className="text-sm text-slate-500 mb-4">
            Generate the official guide allotment list PDF (landscape) showing all teams, members, project titles, and assigned guides.
          </p>
          <div className="space-y-2">
            <a
              href={adminAPI.guideAllotmentUrl(pdfParams)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full"
            >
              <Download className="w-4 h-4" /> Download Guide Allotment PDF
            </a>
            <p className="form-help">Will include {teams.length} teams</p>
          </div>
        </Card>
      </div>

      {/* Per-team initiation form */}
      <Card title={<>Per-Team Initiation Forms <span className="badge-secondary ml-1">{teams.length}</span></>} icon={Layers} noPadding>
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : teams.length === 0 ? <EmptyState icon={Layers} title="No teams found" message="Adjust filters above." />
          : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Group No</th><th>Project Title</th><th>Sem</th><th>Members</th><th>Guide</th><th className="text-right">PDF</th></tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t._id}>
                      <td className="text-xs font-semibold">{t.groupNo}</td>
                      <td>{t.projectTitle}</td>
                      <td><span className="badge-info">{t.semester}th</span></td>
                      <td><span className="badge-secondary">{t.members?.length || 0}</span></td>
                      <td className="text-sm">{t.guide?.name || '—'}</td>
                      <td className="text-right">
                        <a
                          href={adminAPI.initiationFormUrl(t._id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-outline btn-sm"
                        >
                          <FileText className="w-3 h-3" /> Download
                        </a>
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

export default Forms;
