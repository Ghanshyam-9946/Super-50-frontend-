import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FileCheck2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import NoDuesFormDetail from '../../components/nodues/NoDuesFormDetail';

export default function StudentNoDuesPage() {
  const { user } = useSelector((s) => s.auth);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/no-dues/student');
        if (data.success) {
          setForm(data.data);
          setMessage(data.message || '');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load your No Dues form');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <FileCheck2 className="text-[var(--primary)]" size={30} /> My No Dues Form
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Get each subject faculty to tick your checklist, and submit proofs to your mentor (TG) for the rest.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium text-sm">Loading…</p>
        </div>
      ) : !form ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <Info size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No No Dues form yet</p>
          <p className="text-[var(--text-secondary)] text-sm max-w-md">
            {message || 'Your mentor (TG) has not created a No Dues form for you yet.'}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-card p-6 rounded-3xl">
          <NoDuesFormDetail form={form} currentUser={user} onChange={setForm} showDeleteButton={false} />
        </motion.div>
      )}
    </div>
  );
}
