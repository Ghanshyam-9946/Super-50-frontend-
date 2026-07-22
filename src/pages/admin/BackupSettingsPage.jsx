import { useEffect, useState, useCallback } from 'react';
import { DatabaseBackup, Save, Send, Loader2, Clock, Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function BackupSettingsPage() {
  const [email, setEmail] = useState('');
  const [time, setTime] = useState('12:00');
  const [enabled, setEnabled] = useState(true);
  const [lastSentDate, setLastSentDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/backup-settings');
      if (data.success) {
        setEmail(data.data.email || '');
        setTime(data.data.time || '12:00');
        setEnabled(data.data.enabled);
        setLastSentDate(data.data.lastSentDate || '');
      }
    } catch {
      toast.error('Failed to load backup settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/backup-settings', { email, time, enabled });
      if (data.success) toast.success('Backup settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const { data } = await api.post('/backup-settings/test');
      if (data.success) toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test backup failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
          <DatabaseBackup className="text-[var(--primary)]" size={26} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">
            Daily Database Backup
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Automatically emails a full MongoDB backup (gzip-compressed JSON) every day.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-16 flex items-center justify-center rounded-3xl">
          <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <div className="glass-card p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-[var(--text-primary)]">Enable daily backups</p>
              <p className="text-xs text-[var(--text-secondary)]">Turn off to pause the scheduled email without losing your settings.</p>
            </div>
            <button
              onClick={() => setEnabled((v) => !v)}
              className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border-light)]'}`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">
              <Mail size={12} /> Recipient email(s)
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sistec.ac.in, another@sistec.ac.in"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-500/10 transition-all"
            />
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">Comma-separate for more than one address.</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">
              <Clock size={12} /> Time (IST, 24-hour)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-500/10 transition-all"
            />
          </div>

          {lastSentDate && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <CheckCircle2 size={14} /> Last sent: {lastSentDate}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={save} disabled={saving} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Settings
            </button>
            <button onClick={sendTest} disabled={testing} className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2">
              {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Test Backup Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
