import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Trash2, Folder } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, confirmAction } from '../../../components/pms/Common';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ projectName: '', semester: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listProjects();
      setProjects(res.data.projects);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminAPI.createProject(form);
      toast.success('Project created');
      setForm({ projectName: '', semester: '', description: '' });
      fetchProjects();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirmAction('Delete this project?')) return;
    try {
      await adminAPI.deleteProject(id);
      toast.success('Deleted');
      fetchProjects();
    } catch (err) { toast.error(handleError(err)); }
  };

  const projectColor = (name) => {
    if (name?.startsWith('Minor')) return 'badge-info';
    if (name === 'Major-1') return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projects Master</h1>
        <p className="text-sm text-slate-500 mt-1">Four project types mapped to semesters 5–8.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <Card title="Add / Update Project" icon={Plus}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Project Name</label>
                <select className="form-select" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} required>
                  <option value="">Select project</option>
                  <option>Minor-1</option>
                  <option>Minor-2</option>
                  <option>Major-1</option>
                  <option>Major-2</option>
                </select>
              </div>
              <div>
                <label className="form-label">Mapped Semester</label>
                <select className="form-select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required>
                  <option value="">Select</option>
                  <option value="5">5th Semester</option>
                  <option value="6">6th Semester</option>
                  <option value="7">7th Semester</option>
                  <option value="8">8th Semester</option>
                </select>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <Spinner size="sm" className="text-white" /> : 'Save Project'}
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card title="All Projects" icon={FolderOpen} noPadding>
            {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
              : projects.length === 0 ? <EmptyState icon={Folder} title="No projects defined" />
              : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Project</th><th>Semester</th><th>Description</th><th className="text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => (
                        <tr key={p._id}>
                          <td><span className={projectColor(p.projectName)}>{p.projectName}</span></td>
                          <td className="font-semibold">{p.semester}th Semester</td>
                          <td className="text-slate-500">{p.description || '—'}</td>
                          <td className="text-right">
                            <button onClick={() => handleDelete(p._id)} className="btn-secondary btn-sm">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Projects;
