import { useState, useEffect } from 'react';
import { Save, Palette, Eye, Image as ImageIcon, Info, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { useAuth } from '../../../context/pms/AuthContext';

const Settings = () => {
  const { refreshBranding } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSettings();
      setSettings(res.data.settings);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('appName', settings.appName || '');
      formData.append('appTagline', settings.appTagline || '');
      formData.append('institutionName', settings.institutionName || '');
      if (logoFile) formData.append('appLogo', logoFile);
      if (removeLogo) formData.append('removeLogo', 'true');

      const res = await adminAPI.updateSettings(formData);
      toast.success('Settings updated');
      setSettings(res.data.settings);
      setLogoFile(null);
      setRemoveLogo(false);
      refreshBranding();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">App Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Customize your institution's branding — app name, tagline, and logo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <Card title="Branding & Identity" icon={Palette}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Application Name</label>
                <input className="form-input" value={settings?.appName || ''} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} required />
                <p className="form-help">Appears in sidebar, page titles, and browser tab.</p>
              </div>
              <div>
                <label className="form-label">Tagline</label>
                <input className="form-input" value={settings?.appTagline || ''} onChange={(e) => setSettings({ ...settings, appTagline: e.target.value })} />
                <p className="form-help">A short sub-title shown on the login page.</p>
              </div>
              <div>
                <label className="form-label">Institution Name</label>
                <input className="form-input" value={settings?.institutionName || ''} onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })} />
                <p className="form-help">Your college or university name.</p>
              </div>

              <hr className="border-slate-100" />

              <div>
                <label className="form-label">App Logo</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  className="form-input"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                />
                <p className="form-help">PNG, JPG, SVG or WebP. Recommended: 64x64 px square. Max 2MB.</p>

                {settings?.appLogo && (
                  <label className="flex items-center gap-2 mt-3 text-sm text-red-600">
                    <input
                      type="checkbox"
                      checked={removeLogo}
                      onChange={(e) => setRemoveLogo(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-600"
                    />
                    <Trash2 className="w-4 h-4" /> Remove current logo
                  </label>
                )}
              </div>

              <button disabled={submitting} className="btn-primary">
                {submitting ? <Spinner size="sm" className="text-white" /> : <><Save className="w-4 h-4" /> Save Settings</>}
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card title="Current Logo" icon={Eye}>
            <div className="text-center py-2">
              {settings?.appLogo ? (
                <img
                  src={`/uploads/branding/${settings.appLogo}`}
                  alt="Current logo"
                  className="mx-auto max-w-[120px] max-h-[120px] object-contain rounded-xl bg-slate-50 p-2"
                />
              ) : (
                <EmptyState icon={ImageIcon} title="No logo uploaded" message="Default mortarboard icon will be used." />
              )}
            </div>
          </Card>
          <Card title="Tip" icon={Info}>
            <p className="text-sm mb-2">Changes apply across all pages immediately.</p>
            <p className="text-xs text-slate-500">For best results, upload a square PNG or SVG with a transparent background.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
