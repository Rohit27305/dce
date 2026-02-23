import React, { useState } from 'react';
import { Database, GitPullRequest, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardService, repositoryService, updatesService } from '../services/api';
import Modal from '../components/common/Modal';

const Dashboard: React.FC = () => {
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);

    const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: dashboardService.getOverviewMetrics }) as any;
    const { data: repos } = useQuery({ queryKey: ['repositories'], queryFn: repositoryService.getAllConnected }) as any;
    const { data: updates } = useQuery({ queryKey: ['updates'], queryFn: updatesService.getRecentSyncHistory }) as any;

    const triggerSyncMutation = useMutation({
        mutationFn: repositoryService.triggerSyncProtocol,
        onSuccess: () => {
            setIsAnalyzeModalOpen(false);
            alert('Synchronization protocol initiated successfully!');
        }
    });

    const handleRepoClick = (repo: any) => {
        setSelectedRepo(repo);
        setIsAnalyzeModalOpen(true);
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="max-w-4xl">
                <h1 className="text-5xl font-extrabold tracking-tight glow-text">
                    COMMAND HUB
                </h1>
                <p className="mt-4 text-xl text-foreground/60 leading-relaxed">
                    Real-time documentation orchestration. Powered by advanced AI agents
                    monitoring your codebase for consistency and accuracy.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Nodes" value={metrics?.active_repositories || '0'} icon={Database} color="cyan" />
                <StatCard title="Sync Ops" value={metrics?.prs_created_30d || '0'} icon={Zap} color="magenta" />
                <StatCard title="Acceptance" value={`${metrics?.acceptance_rate || '0'}%`} icon={CheckCircle} color="neon" />
                <StatCard title="Confidence" value={`${metrics?.avg_confidence || '0'}%`} icon={GitPullRequest} color="cyan" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Repo List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-sm font-bold tracking-widest text-accent-cyan uppercase">Repository Streams</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(repos || []).map((repo: any, i: number) => (
                            <RepoCard key={repo.id || i} repo={repo} index={i} onClick={() => handleRepoClick(repo)} />
                        ))}
                        {(!repos || repos.length === 0) && (
                            <div className="col-span-full py-12 glass-card flex flex-col items-center justify-center text-foreground/40 border-dashed border-2 border-white/10">
                                <Database size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">NO ACTIVE NODES DETECTED</p>
                                <p className="text-xs mt-1 underline cursor-pointer hover:text-accent-cyan">Go to Archive Nodes to connect</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Stream */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold tracking-widest text-accent-magenta uppercase">Activity Log</h2>
                    <div className="glass-card h-[600px] p-4 flex flex-col gap-4 overflow-y-auto">
                        {(updates || []).map((update: any, i: number) => (
                            <ActivityItem key={update.id || i} update={update} />
                        ))}
                        {(!updates || updates.length === 0) && (
                            <div className="h-full flex flex-col items-center justify-center text-foreground/40 italic">
                                <p>No recent activity pulses...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Analyze Repository Modal */}
            <Modal
                isOpen={isAnalyzeModalOpen}
                onClose={() => setIsAnalyzeModalOpen(false)}
                title="Node Synchronization"
            >
                {selectedRepo && (
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Protocol Interface</p>
                            <p className="text-lg font-bold">{selectedRepo.full_name}</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                            <p className="text-sm text-foreground/70">Initiate a synchronization event to ensure documentation parity.</p>
                            <button
                                onClick={() => triggerSyncMutation.mutate(selectedRepo.id)}
                                disabled={triggerSyncMutation.isPending}
                                className="w-full py-3 bg-accent-cyan text-background font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-accent-neon transition-colors"
                            >
                                {triggerSyncMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                                Trigger Sync Protocol
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colorMap: any = {
        cyan: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
        magenta: 'text-accent-magenta bg-accent-magenta/10 border-accent-magenta/20',
        neon: 'text-accent-neon bg-accent-neon/10 border-accent-neon/20',
    };

    return (
        <div
            className={`glass-card p-6 border-l-4 ${colorMap[color] || colorMap.cyan} hover:-translate-y-1 hover:scale-[1.02] transition-transform`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">{title}</p>
                    <p className="text-4xl font-extrabold">{value}</p>
                </div>
                <Icon className="w-10 h-10 opacity-40" />
            </div>
        </div>
    );
};

const RepoCard = ({ repo, onClick }: any) => (
    <div
        onClick={onClick}
        className="glass-card p-5 group cursor-pointer hover:scale-[1.02] hover:bg-white/10 transition-all"
    >
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan group-hover:scale-110 transition-transform">
                    <Database size={20} />
                </div>
                <div>
                    <p className="font-bold text-foreground/90">{repo.full_name || 'owner/repository'}</p>
                    <p className="text-xs text-foreground/40 font-mono">ID: {repo.id?.slice(0, 8) || 'AE-3094'}</p>
                </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-accent-neon animate-pulse shadow-[0_0_10px_#ccff00]" />
        </div>

        <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-8 h-1.5 rounded-full bg-accent-cyan/20 bg-gradient-to-r from-accent-cyan/40 to-transparent" />
                ))}
            </div>
            <span className="text-[10px] font-bold text-accent-cyan/60 uppercase tracking-tighter">Active Sync</span>
        </div>
    </div>
);

const ActivityItem = ({ update }: any) => (
    <div className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group">
        <div className={`w-1.5 h-auto rounded-full group-hover:opacity-100 transition-colors ${update.status === 'completed' || update.status === 'merged' ? 'bg-accent-neon opacity-50' : 'bg-accent-cyan opacity-50'
            }`} />
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">Sync Protocol #{update.id?.slice(0, 4) || '72A'}</p>
            <p className="text-xs text-foreground/40 mt-1">
                {update.affected_files?.length || 0} files synchronized
                {update.affected_files?.length > 0 && `: ${update.affected_files[0]}`}
            </p>
            <div className="flex items-center gap-2 mt-2">
                <div className="px-2 py-0.5 rounded text-[10px] bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 font-bold uppercase">
                    Confidence: {update.confidence_score || 0}%
                </div>
                <div className="text-[10px] text-foreground/30 font-mono">
                    {update.created_at ? new Date(update.created_at).toLocaleTimeString() : ''}
                </div>
            </div>
        </div>
    </div>
);

export default Dashboard;
