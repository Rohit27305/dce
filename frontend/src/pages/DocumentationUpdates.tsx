import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, CheckCircle, XCircle, GitPullRequest, ExternalLink,
    ChevronDown, ChevronUp, FileText, AlertTriangle, RefreshCw, Loader2,
    Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updatesService } from '../services/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pending Review', color: 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10', icon: Clock },
    approved: { label: 'Approved', color: 'text-accent-neon border-accent-neon/30 bg-accent-neon/10', icon: CheckCircle },
    merged: { label: 'Merged', color: 'text-accent-neon border-accent-neon/30 bg-accent-neon/10', icon: CheckCircle },
    completed: { label: 'Completed', color: 'text-accent-neon border-accent-neon/30 bg-accent-neon/10', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'text-red-400 border-red-400/30 bg-red-400/10', icon: XCircle },
    failed: { label: 'Failed', color: 'text-red-400 border-red-400/30 bg-red-400/10', icon: AlertTriangle },
};

function confidenceColor(score: number) {
    if (score >= 85) return 'bg-accent-neon shadow-[0_0_10px_rgba(57,255,20,0.4)]';
    if (score >= 70) return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]';
    return 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.4)]';
}

const UpdateCard: React.FC<{ update: any; index: number; onDelete: (id: string) => void; isDeleting: boolean }> = ({ update, index, onDelete, isDeleting }) => {
    const [expanded, setExpanded] = useState(false);
    const status = statusConfig[update?.status?.toLowerCase()] || statusConfig['pending'];
    const StatusIcon = status.icon;
    const score = update?.confidence_score || 0;
    const files: string[] = update?.affected_files || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            layout
            className="glass-card overflow-hidden hover:border-white/20 transition-colors duration-300"
        >
            {/* Header */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left: Icon + ID */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-magenta/10 border border-accent-magenta/20 flex items-center justify-center text-accent-magenta font-black text-xs italic">
                        {update?.id?.slice(0, 2)?.toUpperCase() || 'PR'}
                    </div>
                    <div>
                        <p className="font-mono text-xs text-foreground/40">Protocol</p>
                        <p className="font-mono text-sm font-bold">#{update?.id?.slice(0, 8) || '--------'}</p>
                    </div>
                </div>

                {/* Middle: Summary */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground/90 truncate">
                        {update?.trigger_commit_message || update?.changes_summary?.split('\n')[0] || 'Manual Documentation Sync'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-foreground/40 text-xs">
                        <Clock size={11} />
                        <span>{update?.created_at ? new Date(update.created_at).toLocaleString() : '---'}</span>
                        {files.length > 0 && (
                            <>
                                <span className="text-foreground/20">·</span>
                                <FileText size={11} />
                                <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Confidence + Status + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                    {/* Confidence */}
                    <div className="hidden sm:flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase font-bold text-foreground/40">Confidence</span>
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
                                    className={`h-full rounded-full ${confidenceColor(score)}`}
                                />
                            </div>
                            <span className="text-xs font-bold text-foreground/70">{score}%</span>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${status.color}`}>
                        <StatusIcon size={10} />
                        {status.label}
                    </span>

                    {/* PR Link */}
                    {update?.pr_url ? (
                        <a
                            href={update.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan rounded-lg text-xs font-bold transition-colors"
                            title={`Open PR #${update.pr_number}`}
                        >
                            <GitPullRequest size={13} />
                            PR #{update.pr_number}
                            <ExternalLink size={11} />
                        </a>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-foreground/30 rounded-lg text-xs font-bold">
                            <GitPullRequest size={13} />
                            No PR
                        </div>
                    )}

                    {/* Delete Button */}
                    <button
                        onClick={() => onDelete(update.id)}
                        disabled={isDeleting}
                        className="p-1.5 text-foreground/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                        title="Delete this update"
                    >
                        {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>

                    {/* Expand */}
                    {files.length > 0 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 text-foreground/40 hover:text-foreground transition-colors"
                        >
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded: File list */}
            <AnimatePresence>
                {expanded && files.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-white/5"
                    >
                        <div className="px-5 py-4 bg-white/[0.02]">
                            <p className="text-[10px] uppercase font-bold text-foreground/40 mb-3">Affected Documentation Files</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {files.map((file: string, fi: number) => (
                                    <div key={fi} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                                        <FileText size={12} className="text-accent-cyan flex-shrink-0" />
                                        <span className="font-mono text-xs truncate" title={file}>{file}</span>
                                    </div>
                                ))}
                            </div>
                            {update?.pr_branch && (
                                <p className="mt-3 text-[10px] text-foreground/30 font-mono">
                                    Branch: <span className="text-accent-magenta">{update.pr_branch}</span>
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const DocumentationUpdatesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const { data: updates, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['updates'],
        queryFn: updatesService.getRecentSyncHistory,
        refetchInterval: 15000,
    }) as any;

    const deleteUpdateMutation = useMutation({
        mutationFn: updatesService.deleteUpdate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['updates'] });
            setDeletingId(null);
            showToast('Update deleted successfully');
        },
        onError: (err: any) => {
            setDeletingId(null);
            showToast(`Delete failed: ${err}`, 'error');
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: updatesService.deleteAllUpdates,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['updates'] });
            showToast('All updates cleared');
        },
        onError: (err: any) => showToast(`Clear all failed: ${err}`, 'error')
    });

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete this sync protocol entry?')) return;
        setDeletingId(id);
        deleteUpdateMutation.mutate(id);
    };

    const handleDeleteAll = () => {
        if (!window.confirm('Are you sure you want to delete ALL sync protocol entries? This cannot be undone.')) return;
        deleteAllMutation.mutate();
    };

    const list: any[] = updates || [];

    return (
        <div className="space-y-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border font-bold text-sm transition-all ${toast.type === 'success'
                        ? 'bg-accent-neon/10 border-accent-neon/30 text-accent-neon'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight glow-text uppercase">Sync Protocols</h1>
                    <p className="text-foreground/60 mt-2">AI-generated documentation PRs — click any card to expand files.</p>
                </div>
                <div className="flex items-center gap-3">
                    {list.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={deleteAllMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                            {deleteAllMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            Clear All
                        </button>
                    )}
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-xl text-sm font-bold hover:bg-surface-hover transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            {list.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: list.length, color: 'text-foreground' },
                        { label: 'Pending', value: list.filter(u => u.status === 'PENDING' || u.status === 'pending').length, color: 'text-accent-cyan' },
                        { label: 'Merged', value: list.filter(u => ['merged', 'completed', 'MERGED', 'COMPLETED'].includes(u.status)).length, color: 'text-accent-neon' },
                        { label: 'Avg Confidence', value: `${Math.round(list.reduce((s, u) => s + (u.confidence_score || 0), 0) / list.length)}%`, color: 'text-accent-magenta' },
                    ].map(stat => (
                        <div key={stat.label} className="glass-card p-4 text-center">
                            <p className="text-[10px] uppercase font-bold text-foreground/40 mb-1">{stat.label}</p>
                            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-10 h-10 text-accent-cyan animate-spin" />
                </div>
            ) : list.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card py-24 flex flex-col items-center justify-center text-foreground/30 border-dashed border-2 border-white/10"
                >
                    <GitPullRequest size={56} className="mb-6 opacity-20" />
                    <p className="text-xl font-bold uppercase tracking-widest mb-2">No Sync Protocols Found</p>
                    <p className="text-sm text-center max-w-xs">
                        Add a repository and trigger an analysis to generate your first documentation PR.
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {list.map((update: any, i: number) => (
                            <UpdateCard
                                key={update?.id || i}
                                update={update}
                                index={i}
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
