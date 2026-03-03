import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Shield, User, Lock, Loader2 } from 'lucide-react';
import { authService } from '../services/api';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const data = await authService.login(formData);
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('username', data.username);
            navigate('/');
        } catch (err: any) {
            setError('Incorrent username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Background elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-cyan/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-blue/10 blur-[150px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass-card border border-white/10 shadow-2xl z-10 mx-4"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-blue mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">DCE Access</h1>
                    <p className="text-foreground/60">Documentation Consistency Enforcer</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                            <User className="w-4 h-4 text-accent-cyan" />
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-foreground focus:ring-2 focus:ring-accent-cyan transition-all outline-none"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-accent-blue" />
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-foreground focus:ring-2 focus:ring-accent-blue transition-all outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-accent-cyan to-accent-blue rounded-xl font-bold text-white shadow-xl shadow-accent-cyan/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Login to System
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-white/5 text-center">
                    <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-widest text-shadow-glow">
                        Protected Session • JWT Encryption Enabled
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
