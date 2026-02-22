import React from 'react';
import Navbar from './Navbar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 px-6 py-8 relative">
                {/* Background elements */}
                <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent-cyan/10 blur-[120px] rounded-full opacity-20" />
                    <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-accent-magenta/5 blur-[150px] rounded-full opacity-10" />
                </div>

                <div className="h-full">
                    {children}
                </div>
            </main>

            <footer className="px-6 py-8 text-center text-foreground/40 text-xs border-t border-white/5">
                <p>© 2026 Documentation Consistency Enforcer. Powered by DigitalOcean Gradient AI.</p>
            </footer>
        </div>
    );
};

export default Layout;
