import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, CheckCircle, XCircle, GitPullRequest, ExternalLink,
    ChevronDown, FileText, AlertTriangle, RefreshCw, Loader2,
    Trash2, GitMerge, Zap, Shield
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updatesService, repositoryService } from '../services/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'PENDING', color: 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10', icon: Clock },
    approved: { label: 'APPROVED', color: 'text-accent-neon border-accent-neon/30 bg-accent-neon/10', icon: CheckCircle },
    merged: { label: 'MERGED', color: 'text-accent-neon border-accent-neon/30 bg-accent-neon/10', icon: GitMerge },
    completed: { label: 'COMPLETED', color: 'text-accent-neon border-accent-neon/30 bg-accent-neon/10', icon: CheckCircle },
    rejected: { label: 'REJECTED', color: 'text-red-400 border-red-400/30 bg-red-400/10', icon: XCircle },
    failed: { label: 'FAILED', color: 'text-red-400 border-red-400/30 bg-red-400/10', icon: AlertTriangle },
};

function confidenceColor(score: number) {
    if (score >= 85) return 'bg-accent-neon';
    if (score >= 70) return 'bg-yellow-400';
    return 'bg-red-400';
}

const UpdateCard: React.FC<{ update: any; index: number; repoName: string; onDelete: (id: string) => void; isDeleting: boolean }> = ({ update, index, repoName, onDelete, isDeleting }) => {
    const [expanded, setExpanded] = useState(false);
    const status = statusConfig[update?.status?.toLowerCase()] || statusConfig['pending'];
    const StatusIcon = status.icon;
    const score = update?.confidence_score || 0;
    const files: string[] = update?.affected_files || [];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            layout
            className="group relative"
        >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-cyan/10 to-accent-purple/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative glass-card overflow-hidden transition-all duration-300 group-hover:border-white/20">
                {/* Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
                    {/* Left: Indicator */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black ${status.color}`}>
                            <StatusIcon size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-foreground/80 tracking-tight">{repoName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-foreground/30 px-1.5 py-0.5 bg-white/5 rounded">#{update?.id?.slice(0, 8)}</span>
                                <span className="text-[10px] text-foreground/20 font-bold">•</span>
                                <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">{update?.agent_role || 'orchestrator'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Title/Activity */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate group-hover:text-accent-cyan transition-colors">
                            {update?.trigger_commit_message || 'Documentation Synchronization Event'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 text-foreground/40 text-[10px] font-bold tracking-widest uppercase">
                                <Clock size={12} className="text-accent-purple" />
                                {update?.created_at ? new Date(update.created_at).toLocaleDateString() : '---'}
                                <span className="ml-1 opacity-50">{update?.created_at ? new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="flex items-center gap-1.5 text-foreground/40 text-[10px] font-bold tracking-widest uppercase">
                                <FileText size={12} className="text-accent-cyan" />
                                {files.length} ASSETS AFFECTED
                            </div>
                        </div>
                    </div>

                    {/* Right: Score + PR + Actions */}
                    <div className="flex items-center gap-4 flex-shrink-0 flex-wrap sm:flex-nowrap">
                        {/* Confidence Bar */}
                        <div className="hidden md:flex flex-col items-end gap-1.5 pr-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30 leading-none">Trust Factor</span>
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score}%` }}
                                        transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${confidenceColor(score)}`}
                                    />
                                </div>
                                <span className="text-xs font-black font-mono tracking-tighter text-foreground/60">{score}%</span>
                            </div>
                        </div>

                        {/* Status + PR Button */}
                        <div className="flex items-center gap-2">
                            {update?.pr_url ? (
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    href={update.pr_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 hover:bg-accent-cyan hover:text-background border border-accent-cyan/30 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all"
                                >
                                    <GitPullRequest size={14} />
                                    Review PR
                                    <ExternalLink size={10} className="ml-0.5 opacity-50" />
                                </motion.a>
                            ) : (
                                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black tracking-widest border border-white/10 bg-white/[0.02] text-foreground/30`}>
                                    <Zap size={14} />
                                    PROCESSING
                                </div>
                            )}

                            <button
                                onClick={() => onDelete(update.id)}
                                disabled={isDeleting}
                                className="w-10 h-10 flex items-center justify-center text-foreground/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-50 border border-transparent hover:border-red-400/20"
                            >
                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>

                            <button
                                onClick={() => setExpanded(!expanded)}
                                className={`w-8 h-8 flex items-center justify-center text-foreground/30 hover:text-foreground transition-all ${expanded ? 'bg-white/5 rounded-lg' : ''}`}
                            >
                                <ChevronDown size={18} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Expanded Section */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/5"
                        >
                            <div className="p-6 bg-white/[0.01]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-4 flex items-center gap-2">
                                            <Shield size={12} className="text-accent-cyan" />
                                            Analysis Report
                                        </h4>
                                        <div className="p-4 bg-background/50 rounded-xl border border-white/5 font-mono text-[11px] text-foreground/60 leading-relaxed whitespace-pre-wrap">
                                            {update.changes_summary || "Automated consistency check performed. No issues detected in protocol."}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-4 flex items-center gap-2">
                                            <FileText size={12} className="text-accent-purple" />
                                            Target Path Objects
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {files.map((file, fi) => (
                                                <div key={fi} className="flex items-center justify-between group/item p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all">
                                                    <div className="flex items-center gap-2.5 truncate">
                                                        <FileText size={14} className="text-accent-cyan shrink-0" />
                                                        <span className="text-xs font-mono truncate">{file}</span>
                                                    </div>
                                                    <CheckCircle size={14} className="text-accent-neon opacity-40 group-hover/item:opacity-100 transition-opacity" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const DocumentationUpdatesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const { data: updates, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['updates'],
        queryFn: updatesService.getRecentSyncHistory,
        refetchInterval: 10000,
    }) as any;

    const { data: repos } = useQuery({
        queryKey: ['repositories'],
        queryFn: repositoryService.getAllConnected,
    }) as any;

    const repoMap: Record<string, string> = {};
    (repos || []).forEach((r: any) => {
        if (r.id) repoMap[r.id] = r.full_name;
    });

    const deleteUpdateMutation = useMutation({
        mutationFn: updatesService.deleteUpdate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['updates'] });
            setDeletingId(null);
            showToast('Sync event removed');
        },
        onError: (err: any) => {
            setDeletingId(null);
            showToast(`Removal failed: ${err}`, 'error');
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: updatesService.deleteAllUpdates,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['updates'] });
            showToast('All sync history cleared');
        },
        onError: (err: any) => showToast(`Clear failed: ${err}`, 'error')
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Remove this event from history?')) return;
        setDeletingId(id);
        deleteUpdateMutation.mutate(id);
    };

    const list: any[] = updates || [];

    return (
        <div className="space-y-10 pb-20">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border font-black text-xs tracking-widest uppercase ${toast.type === 'success'
                            ? 'bg-accent-neon/10 border-accent-neon/30 text-accent-neon'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-xl">
                    <h1 className="text-5xl font-black tracking-tighter leading-none glow-text uppercase">SYNC EVENTS</h1>
                    <p className="text-foreground/50 mt-4 font-medium">History of AI‑triggered documentation updates and pull requests. Monitor the evolution of your project documentation in real‑time.</p>
                </div>
                <div className="flex items-center gap-3">
                    {list.length > 0 && (
                        <button
                            onClick={() => {
                                if (window.confirm('Wipe all history?')) deleteAllMutation.mutate();
                            }}
                            className="px-5 py-3 hover:bg-red-500/10 border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground/30 hover:text-red-400 hover:border-red-400/20 transition-all"
                        >
                            CLEAR STREAM
                        </button>
                    )}
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="px-5 py-3 bg-surface border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-surface-hover transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                        REFRESH
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <AnimatePresence mode="wait">
                {list.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        {[
                            { label: 'Total Events', value: list.length, color: 'text-foreground' },
                            { label: 'In Queue', value: list.filter(u => u.status === 'PENDING').length, color: 'text-accent-cyan' },
                            { label: 'Deployed', value: list.filter(u => ['merged', 'completed'].includes(u.status.toLowerCase())).length, color: 'text-accent-neon' },
                            { label: 'Stability', value: `${Math.round(list.reduce((s, u) => s + (u.confidence_score || 0), 0) / list.length)}%`, color: 'text-accent-purple' },
                        ].map(stat => (
                            <div key={stat.label} className="glass-card p-5 border-b-2 border-white/5 group hover:border-accent-cyan/30 transition-all">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-2">{stat.label}</p>
                                <p className={`text-3xl font-black font-mono tracking-tighter ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="w-12 h-12 text-accent-cyan animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 animate-pulse">Syncing Event Logs</p>
                </div>
            ) : list.length === 0 ? (
                <div className="py-32 glass-card flex flex-col items-center justify-center text-foreground/10 border-dashed border-2 border-white/5 mx-auto max-w-2xl">
                    <GitMerge size={64} className="mb-6" />
                    <p className="text-xl font-black uppercase tracking-[0.2em] text-foreground/20">Quiet Protocol</p>
                    <p className="text-xs text-center mt-2 opacity-50 px-8">No documentation drift detected. All systems are currently synchronized.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence initial={false}>
                        {list.map((update: any, i: number) => (
                            <UpdateCard
                                key={update?.id || i}
                                update={update}
                                index={i}
                                repoName={repoMap[update.repository_id] || 'Unknown Origin'}
                                onDelete={handleDelete}
                                isDeleting={deletingId === update?.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default DocumentationUpdatesPage;
