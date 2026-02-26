import React, { useState } from 'react';
import { LayoutDashboard, Database, FileText, Zap, ChevronDown, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Repositories', path: '/repositories', icon: Database },
        { name: 'Updates', path: '/updates', icon: FileText },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b border-white/10 bg-background/50">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center shadow-lg shadow-accent-cyan/20">
                    <Zap size={22} className="text-background fill-current" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black glow-text tracking-tighter leading-none">DCE</span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/40 leading-none mt-1">Consistency Engine</span>
                </div>
            </Link>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-surface-hover p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all ${isActive
                                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 shadow-sm'
                                    : 'text-foreground/50 hover:text-foreground/80 hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={18} />
                                <span className="text-sm font-bold tracking-tight">{item.name}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {/* Profile & Notifications */}
            <div className="flex items-center gap-4 mr-2">
                <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-foreground/40 hover:text-foreground transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent-neon rounded-full border-2 border-background" />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-[10px] bg-accent-purple/20 border border-accent-purple/20 p-0.5 overflow-hidden transition-transform group-hover:scale-110">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit" alt="User" className="rounded-[8px]" />
                        </div>
                        <div className="hidden lg:flex flex-col items-start mr-1 text-left">
                            <span className="text-[11px] font-bold leading-none">Rohit</span>
                            <span className="text-[9px] text-foreground/40 font-medium">Pro Plan</span>
                        </div>
                        <ChevronDown size={14} className={`text-foreground/40 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <>
                                {/* Invisible fixed backdrop to intercept all clicks outside the dropdown */}
                                <div
                                    className="fixed inset-0 z-[100] cursor-default bg-transparent"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsProfileOpen(false);
                                    }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-40 glass-card p-4 shadow-2xl border border-white/10 z-[110] overflow-hidden text-center"
                                >
                                    <span className="text-sm font-black text-accent-cyan tracking-tight">
                                        @Rohit
                                    </span>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
