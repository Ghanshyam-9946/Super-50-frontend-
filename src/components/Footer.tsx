import { Github as GithubIcon, Twitter, Linkedin, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 dark:border-white/10 px-6 py-24 bg-white/80 dark:bg-black/60 backdrop-blur-xl overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-brand-indigo/5 blur-[120px]" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-brand-orange/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid gap-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center">
                <img src="/upload/SISTec_Logo.png" alt="SCOPE Logo" className="h-12 w-12" />
              </div>
              <span className="font-display text-2xl font-[900] tracking-tight text-foreground">
                SCOPE<span className="text-brand-orange">.</span>
              </span>
            </div>
            <p className="mt-8 max-w-sm text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed drop-shadow-sm">
              The unified student ecosystem. Empowering innovators through placements, elite rankings, and project showcases on a world-class platform.
            </p>
            <div className="mt-10 flex gap-5">
              {[Twitter, GithubIcon, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-brand-indigo hover:bg-brand-indigo hover:text-white transition-all shadow-sm border-white"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-8 font-mono text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400">Ecosystem</div>
            <ul className="space-y-4 text-base font-bold">
              {["Placement Portal", "Super 50 Platform", "Innovation Gallery", "Global Leaderboard"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-slate-700 dark:text-slate-300 hover:text-brand-indigo dark:hover:text-brand-purple transition-all hover:translate-x-1 inline-block">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="mb-8 font-mono text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400">Headquarters</div>
            <ul className="space-y-4 text-base font-bold text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-brand-orange" />
                connect@scope.nexus
              </li>
              <li>+91 80 4321 0000</li>
              <li className="leading-relaxed">SCOPE Innovation Hub, 4th Floor<br />Vibrant Tech Park, Bengaluru 560001</li>
            </ul>
          </div>
        </div>

        <div className="mt-24 flex flex-col items-center justify-center border-t border-slate-200 dark:border-white/10 pt-12">
          <div className="glass-strong bg-white/50 dark:bg-black/50 px-8 py-3.5 rounded-full border-slate-300 dark:border-white/20 shadow-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-300 hover:scale-[1.02] transition-all duration-500 cursor-default group/footer">
            <span className="opacity-70">© 2026</span>
            <span className="mx-2 opacity-30">|</span>
            Designed & Developed by <span className="text-gradient-brand group-hover/footer:drop-shadow-[0_0_8px_var(--brand-indigo)/30] transition-all">Shivam, Ghanshyam, Shubham and Ajay</span>
            <span className="mx-2 opacity-20">|</span>
            under the Guidance of <span className="text-foreground">Prof. Nargish Gupta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
