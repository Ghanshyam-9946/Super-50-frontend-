import { Instagram, Linkedin, Twitter, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-[#080B11] border-t border-slate-900 px-6 py-16 text-slate-400 overflow-hidden">
      {/* Background glow effects for premium look */}
      <div className="absolute top-0 left-1/4 h-80 w-80 rounded-full bg-blue-500/5 blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-indigo-500/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid gap-12 md:grid-cols-3 lg:gap-16">
          {/* Column 1: Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl h-14 w-14 flex items-center justify-center shadow-lg shadow-black/20">
                <img src="/upload/SISTec_Logo.png" alt="SISTec Logo" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h3 className="text-3xl font-[900] tracking-widest text-white font-display leading-none">
                  MILE<span className="text-blue-500">.</span>
                </h3>
                <span className="text-sm font-bold tracking-wider text-blue-500 uppercase block mt-1.5">
                  Every Milestone Matters
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm font-medium">
              The unified student ecosystem. Empowering innovators through placements, elite rankings, and project showcases on a world-class platform.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://www.instagram.com/sagarcollegebhopal/"
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-pink-500 transition-colors duration-200 group"
                >
                  <Instagram className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="font-semibold">Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/school/sagar-group-of-institutions-sistec/posts/?feedView=all"
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-blue-500 transition-colors duration-200 group"
                >
                  <Linkedin className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="font-semibold">LinkedIn</span>
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/sagarcollege"
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-slate-100 transition-colors duration-200 group"
                >
                  <Twitter className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="font-semibold">Twitter</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase">Contact Information</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="bg-[#111726]/80 border border-slate-800/80 p-2.5 rounded-xl text-blue-500 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-sm leading-relaxed text-slate-400 font-medium">
                  Opposite International Airport, Gandhi Nagar, Bhopal (M.P.)
                </span>
              </li>
              <li className="flex items-center gap-4">
                <div className="bg-[#111726]/80 border border-slate-800/80 p-2.5 rounded-xl text-emerald-500 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <a href="tel:+9191099975760" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                  +91 910 999 75760
                </a>
              </li>
              <li className="flex items-center gap-4">
                <div className="bg-[#111726]/80 border border-slate-800/80 p-2.5 rounded-xl text-indigo-500 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <a href="mailto:seogn@sistec.ac.in" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                  mile@sistec.ac.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-16 pt-8 border-t border-slate-900/60 flex justify-center items-center">
          <p className="text-xs text-slate-500 text-center font-medium tracking-wide">
            © 2026 Designed & Developed by{" "}
            <span className="text-blue-400/90 font-semibold hover:text-blue-400 transition-colors cursor-pointer">Shubham, Shivam, Ghanshyam</span>{" "}
            and{" "}
            <span className="text-blue-400/90 font-semibold hover:text-blue-400 transition-colors cursor-pointer">Ajay</span>{" "}
            under the Guidance of{" "}
            <span className="text-blue-400/90 font-semibold hover:text-blue-400 transition-colors cursor-pointer">Prof. Nargish Gupta</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
