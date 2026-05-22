import { Github as GithubIcon, Twitter, Linkedin, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-100 px-6 py-24 bg-white/40 backdrop-blur-md overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-brand-indigo/5 blur-[120px]" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-brand-orange/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid gap-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-brand-indigo to-brand-purple shadow-xl shadow-brand-indigo/20 group-hover:scale-110 transition-transform duration-500">
                <span className="font-display text-xl font-black text-white">X</span>
              </div>
              <span className="font-display text-2xl font-[900] tracking-tight text-foreground">
                CampusX<span className="text-brand-orange">.</span>
              </span>
            </div>
            <p className="mt-8 max-w-sm text-lg text-slate-500 font-medium leading-relaxed">
              The unified student ecosystem. Empowering innovators through placements, elite rankings, and project showcases on a world-class platform.
            </p>
            <div className="mt-10 flex gap-5">
              {[Twitter, GithubIcon, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl transition-all hover:bg-brand-indigo hover:text-white hover:scale-110 shadow-sm border-white"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-8 font-mono text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Ecosystem</div>
            <ul className="space-y-4 text-base font-bold">
              {["Placement Portal", "Super 50 Platform", "Innovation Gallery", "Global Leaderboard"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-slate-500 hover:text-brand-indigo transition-all hover:translate-x-1 inline-block">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="mb-8 font-mono text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Headquarters</div>
            <ul className="space-y-4 text-base font-bold text-slate-500">
              <li className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-brand-orange" />
                connect@campusx.nexus
              </li>
              <li>+91 80 4321 0000</li>
              <li className="leading-relaxed">CampusX Innovation Hub, 4th Floor<br />Vibrant Tech Park, Bengaluru 560001</li>
            </ul>
          </div>
        </div>

        <div className="mt-24 flex flex-col items-center justify-center border-t border-slate-100 pt-12">
          <div className="glass-strong px-8 py-3.5 rounded-full border-white/80 shadow-elevated text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80 hover:scale-[1.02] transition-all duration-500 cursor-default group/footer">
            <span className="opacity-60">© 2026</span> 
            <span className="mx-2 opacity-20">|</span> 
            Designed & Developed by <span className="text-gradient-brand group-hover/footer:drop-shadow-[0_0_8px_var(--brand-indigo)/30] transition-all">Ghanshyam, Shivam, Shubham and Ajay</span> 
            <span className="mx-2 opacity-20">|</span> 
            under the Guidance of <span className="text-foreground">Prof. Nargish Gupta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
