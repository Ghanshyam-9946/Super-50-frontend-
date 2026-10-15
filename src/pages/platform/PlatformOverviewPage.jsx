import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Building2, IndianRupee, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";
import platformApi from "../../services/platformApi";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

// The platform at a glance: how many institutes and people, money in, and
// who is about to lapse.
export default function PlatformOverviewPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    platformApi.get("/summary")
      .then(({ data: res }) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || "Could not load the overview"));
  }, []);

  if (!data) return <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  const tiles = [
    { label: "Institutes", value: `${data.active} active of ${data.institutes}`, icon: Building2 },
    { label: "Students", value: data.students.toLocaleString("en-IN"), icon: Users },
    { label: "Staff", value: data.staff.toLocaleString("en-IN"), icon: Users },
    { label: "Received this year", value: money(data.revenueThisYear), icon: IndianRupee },
    { label: "Received in all", value: money(data.revenueAllTime), icon: IndianRupee },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight">Overview</h1>
        <p className="text-sm text-[var(--text-secondary)]">The platform today.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="glass-card rounded-2xl p-4 space-y-1.5">
            <t.icon size={16} className="text-[var(--primary)]" />
            <div className="text-lg font-display font-black text-[var(--text-primary)]">{t.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.label}</div>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-display font-bold text-base flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Subscriptions ending within 30 days</h2>
        {data.expiring.length === 0 ? <p className="text-xs text-[var(--text-secondary)]">None.</p> : (
          <div className="space-y-1.5">
            {data.expiring.map((i) => (
              <Link key={i._id} to={`/platform/institutes/${i._id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-input)]/60 hover:bg-[var(--bg-input)] text-xs">
                <b className="text-[var(--text-primary)]">{i.name}</b>
                <span className="text-[var(--text-secondary)]">ends {day(i.endsAt)}</span>
                <span className={`ml-auto font-bold ${i.daysLeft < 0 ? "text-red-500" : i.daysLeft <= 7 ? "text-amber-600" : "text-[var(--text-secondary)]"}`}>
                  {i.daysLeft < 0 ? `ended ${-i.daysLeft} day(s) ago — read-only` : `${i.daysLeft} day(s) left`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
