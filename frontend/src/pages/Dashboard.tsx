import React, { useState } from 'react';
import { Database, CheckCircle, Zap, Loader2, GitBranch, ArrowUpRight, Activity, Clock, ShieldCheck, Lock, Globe } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardService, repositoryService, updatesService } from '../services/api';
import { motion } from 'framer-motion';
import Modal from '../components/common/Modal';

const Dashboard: React.FC = () => {
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);

    const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: dashboardService.getOverviewMetrics }) as any;
    const { data: repos, isLoading: isReposLoading } = useQuery({ queryKey: ['repositories'], queryFn: repositoryService.getAllConnected }) as any;
    const { data: updates, isLoading: isUpdatesLoading } = useQuery({ queryKey: ['updates'], queryFn: updatesService.getRecentSyncHistory }) as any;

    const triggerSyncMutation = useMutation({
        mutationFn: repositoryService.triggerSyncProtocol,
        onSuccess: () => {
            setIsAnalyzeModalOpen(false);
        }
    });

    const handleRepoClick = (repo: any) => {
        setSelectedRepo(repo);
        setIsAnalyzeModalOpen(true);
    };

    const repoMap: Record<string, any> = {};
    (repos || []).forEach((r: any) => {
        if (r.id) repoMap[r.id] = r;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 pb-12"
        >
            {/* Header section with glass background */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-surface to-background p-10 border border-white/5 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-purple/10 blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
                                <span className="glow-text">DCE</span> DASHBOARD
                            </h1>
                            <p className="mt-4 text-lg text-foreground/50 font-medium leading-relaxed max-w-xl">
                                Intelligent documentation orchestration for your scale‑up. Monitor drift, generate updates, and maintain codebase consistency automatically.
                            </p>
                        </motion.div>
                    </div>

                    {/* Removed 'Core Team Active' section to declutter UI */}
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    title="CONNECTED ASSETS"
                    value={metrics?.active_repositories || '0'}
                    icon={Database}
                    trend="+12%"
                    color="cyan"
                    delay={0.3}
                />
                <StatCard
                    title="DEPLOYED UPDATES"
                    value={metrics?.prs_created_30d || '0'}
                    icon={Zap}
                    trend="+25%"
                    color="purple"
                    delay={0.4}
                />
                <StatCard
                    title="TRUST SCORE"
                    value={`${metrics?.acceptance_rate || '0'}%`}
                    icon={ShieldCheck}
                    trend="+2.4%"
                    color="neon"
                    delay={0.5}
                />
                <StatCard
                    title="SYNCHRONICITY"
                    value={`${metrics?.avg_confidence || '0'}%`}
                    icon={Activity}
                    trend="Optimal"
                    color="cyan"
                    delay={0.6}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Repositories section */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Database size={18} className="text-accent-cyan" />
                            <h2 className="text-xs font-black tracking-[0.2em] text-foreground/40 uppercase">Managed Repositories</h2>
                        </div>
                        <button className="text-[10px] font-black uppercase text-accent-cyan hover:text-accent-neon transition-colors tracking-widest">
                            View All Assets &rarr;
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {isReposLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-40 glass-card animate-pulse bg-white/5" />
                            ))
                        ) : (repos || []).map((repo: any, i: number) => (
                            <RepoCard key={repo.id || i} repo={repo} onClick={() => handleRepoClick(repo)} delay={i * 0.1} />
                        ))}

                        {(repos || []).length === 0 && !isReposLoading && (
                            <div className="col-span-full py-16 glass-card flex flex-col items-center justify-center text-foreground/40 border-dashed border-2 border-white/10">
                                <Database size={48} className="mb-4 opacity-10" />
                                <p className="font-bold text-lg">No assets detected</p>
                                <p className="text-xs mt-1 opacity-60">Connect a GitHub repository to begin synchronization.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity section */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <Clock size={18} className="text-accent-purple" />
                        <h2 className="text-xs font-black tracking-[0.2em] text-foreground/40 uppercase">Real‑time Flow</h2>
                    </div>

                    <div className="glass-card overflow-hidden flex flex-col">
                        <div className="p-1 max-h-[600px] overflow-y-auto space-y-1 custom-scrollbar">
                            {isUpdatesLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-16 w-full glass-card animate-pulse bg-white/5 mb-1" />
                                ))
                            ) : (updates || []).map((update: any, i: number) => (
                                <ActivityItem
                                    key={update.id || i}
                                    update={update}
                                    repo={repoMap[update.repository_id]}
                                    delay={i * 0.05}
                                />
                            ))}

                            {(updates || []).length === 0 && !isUpdatesLoading && (
                                <div className="py-20 flex flex-col items-center justify-center text-foreground/20 italic">
                                    <Activity size={32} className="mb-4 opacity-10" />
                                    <p className="text-sm">Listening for signals...</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Live Stream Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analyze Modal */}
            <Modal
                isOpen={isAnalyzeModalOpen}
                onClose={() => setIsAnalyzeModalOpen(false)}
                title="Initialize Sync Protocol"
            >
                {selectedRepo && (
                    <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-br from-accent-cyan/5 to-accent-purple/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/10 blur-3xl group-hover:bg-accent-neon/20 transition-all duration-700" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-cyan mb-2">Target Asset</p>
                            <h3 className="text-2xl font-black tracking-tight mb-2 truncate">{selectedRepo.full_name}</h3>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-xs font-mono text-foreground/50 bg-background/50 px-2.5 py-1 rounded-lg border border-white/5">
                                    <GitBranch size={12} className="text-accent-purple" />
                                    {selectedRepo.default_branch}
                                </span>
                                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${selectedRepo.is_private ? 'text-amber-400' : 'text-accent-neon'}`}>
                                    {selectedRepo.is_private ? <Lock size={12} /> : <Globe size={12} />}
                                    {selectedRepo.is_private ? 'Private' : 'Public'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-accent-neon/10 flex items-center justify-center text-accent-neon shrink-0">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold mb-1">Drift Analysis</p>
                                    <p className="text-xs text-foreground/40 leading-relaxed">The AI will scan recent changes, identify mapping gaps, and prepare documentation patches.</p>
                                </div>
                            </div>

                            <button
                                onClick={() => triggerSyncMutation.mutate(selectedRepo.id)}
                                disabled={triggerSyncMutation.isPending}
                                className="w-full py-4 bg-accent-cyan text-background font-black rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-accent-cyan/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {triggerSyncMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="fill-current" />}
                                EXECUTE SYNC
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
};

// Sub-components
const StatCard = ({ title, value, icon: Icon, trend, color, delay }: any) => {
    const accents: any = {
        cyan: 'from-accent-cyan/10 to-transparent border-accent-cyan/30 text-accent-cyan',
        purple: 'from-accent-purple/10 to-transparent border-accent-purple/30 text-accent-purple',
        neon: 'from-accent-neon/10 to-transparent border-accent-neon/30 text-accent-neon',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={`relative overflow-hidden glass-card p-6 border-l-4 ${accents[color].split(' ')[2]} group hover:bg-white/5 transition-all`}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accents[color].split(' ').slice(0, 2).join(' ')} blur-3xl group-hover:opacity-100 opacity-50 transition-opacity`} />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-surface border border-white/5 ${accents[color].split(' ')[3]}`}>
                        <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-black text-accent-neon tracking-widest">{trend}</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black tracking-tight">{value}</p>
                </div>
            </div>
        </motion.div>
    );
};

const RepoCard = ({ repo, onClick, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.4 }}
        onClick={onClick}
        className="relative group cursor-pointer"
    >
        <div className="absolute -inset-0.5 bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
        <div className="relative glass-card p-5 h-full flex flex-col hover:border-accent-cyan/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan group-hover:scale-110 group-hover:bg-accent-cyan/20 transition-all duration-500">
                        <Database size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-black text-foreground group-hover:text-accent-cyan transition-colors truncate tracking-tight">{repo.full_name || 'owner/repository'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-foreground/30 font-mono flex items-center gap-1 uppercase">
                                <GitBranch size={10} className="text-accent-purple" />
                                {repo.default_branch || 'main'}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-white/5 rounded border border-white/5 ${repo.is_private ? 'text-amber-400' : 'text-accent-neon'}`}>
                                {repo.is_private ? 'Private' : 'Public'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse shadow-[0_0_8px_#ccff00]" />
                    <span className="text-[8px] font-black text-foreground/20 leading-none">LIVE</span>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-foreground/30 uppercase tracking-widest leading-none">Health</span>
                        <div className="flex gap-0.5 mt-1.5">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-3 h-1 rounded-full ${i < 5 ? 'bg-accent-neon' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-foreground/30 uppercase tracking-widest leading-none">PR Success</span>
                    <p className="text-sm font-black font-mono tracking-tighter mt-1">{repo.total_prs_created || 0} DEPLOYED</p>
                </div>
            </div>

            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-accent-cyan text-background rounded-md">
                <ArrowUpRight size={14} />
            </div>
        </div>
    </motion.div>
);

const ActivityItem = ({ update, repo, delay }: { update: any; repo: any; delay: number }) => {
    const repoName = repo?.full_name || update.repository_id?.slice(0, 8) || 'System';
    const isSuccess = update.status === 'completed' || update.status === 'merged';

    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="flex items-start gap-3 p-3 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all group"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isSuccess ? 'bg-accent-neon/5 border-accent-neon/20 text-accent-neon' : 'bg-accent-cyan/5 border-accent-cyan/20 text-accent-cyan'}`}>
                {isSuccess ? <CheckCircle size={18} /> : <Zap size={18} />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <p className="text-xs font-black truncate tracking-tight">{repoName}</p>
                    <span className="text-[10px] text-foreground/20 font-mono whitespace-nowrap">
                        {update.created_at ? new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>

                <p className="text-[11px] text-foreground/40 mt-1 line-clamp-1 leading-tight">
                    {update.affected_files?.length || 0} files sync complete.
                </p>

                <div className="flex items-center gap-2 mt-2">
                    <div className={`text-[9px] font-black uppercase tracking-widest ${isSuccess ? 'text-accent-neon' : 'text-accent-cyan'}`}>
                        {update.status}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-foreground/10" />
                    <div className="text-[9px] font-black font-mono text-foreground/40">
                        CONF {update.confidence_score || 0}%
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
