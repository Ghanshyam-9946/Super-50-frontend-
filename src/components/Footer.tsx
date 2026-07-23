import { Instagram, Linkedin, Twitter, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-[#09090b] border-t border-white/10 px-6 py-16 text-slate-400 overflow-hidden">
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid gap-12 md:grid-cols-3 lg:gap-16">
          {/* Column 1: Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl h-12 w-12 flex items-center justify-center shadow-lg">
                <img src="/upload/SISTec_Logo.png" alt="SISTec Logo" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-widest text-white font-display leading-none">
                  MILE<span className="text-amber-400">.</span>
                </h3>
                <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase block mt-1">
                  Every Milestone Matters
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              SISTec official student portal for placements, project showcases, and student performance rankings.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-white uppercase mb-4">Official Handles</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.instagram.com/sagarcollegebhopal/"
                  className="flex items-center gap-3 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/school/sagar-group-of-institutions-sistec/posts/?feedView=all"
                  className="flex items-center gap-3 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/sagarcollege"
                  className="flex items-center gap-3 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-white uppercase">Contact Information</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed text-slate-400">
                  Opposite International Airport, Gandhi Nagar, Bhopal (M.P.)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <a href="tel:+9191099975760" className="text-xs text-slate-400 hover:text-white transition-colors">
                  +91 910 999 75760
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-purple-400 shrink-0" />
                <a href="mailto:mile@sistec.ac.in" className="text-xs text-slate-400 hover:text-white transition-colors">
                  mile@sistec.ac.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-slate-500 text-center font-medium">
            © {new Date().getFullYear()} SISTec MILE. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-500 text-center font-medium">
            Designed & Developed by <span className="text-slate-300 font-semibold">Shubham, Shivam, Ghanshyam, & Ajay</span> under guidance of <span className="text-slate-300 font-semibold">Prof. Nargish Gupta</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
