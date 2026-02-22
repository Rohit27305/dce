import React from 'react';
import { LayoutDashboard, Database, FileText, Settings, Github } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Repositories', path: '/repositories', icon: Database },
        { name: 'Updates', path: '/updates', icon: FileText },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b border-white/10 bg-background/50">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-cyan to-accent-magenta p-0.5">
                    <div className="w-full h-full bg-background rounded-md flex items-center justify-center">
                        <div className="w-2 h-2 bg-accent-cyan rounded-full shadow-[0_0_10px_#00f2ff]" />
                    </div>
                </div>
                <span className="text-xl font-bold glow-text tracking-tighter">ANTIGRAVITY</span>
            </div>

            <div className="hidden md:flex items-center gap-1 bg-surface-hover p-1 rounded-xl border border-white/5">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path}>
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                                    : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={18} />
                                <span className="text-sm font-medium">{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-background border border-accent-cyan/50 rounded-lg text-accent-cyan text-sm font-bold shadow-[0_0_10px_rgba(0,242,255,0.2)] hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all">
                    <Github size={18} />
                    <span>Sync GitHub</span>
                </button>
                <div className="w-10 h-10 rounded-full bg-surface border border-white/20 p-0.5">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Antigravity" alt="User" className="rounded-full" />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
