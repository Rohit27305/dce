import React, { useState } from 'react';
import { Search, Filter, Plus, Database, ExternalLink, Loader2, Zap, CheckCircle, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositoryService } from '../services/api';
import Modal from '../components/common/Modal';

const RepositoriesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [repositoryUrl, setRepositoryUrl] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [newRepo, setNewRepo] = useState({
        github_repo_id: '',
        full_name: '',
        owner: '',
        name: '',
        default_branch: 'main'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const { data: repos, isLoading } = useQuery({
        queryKey: ['repositories'],
        queryFn: repositoryService.getAllConnected
    }) as any;

    const connectRepoMutation = useMutation({
        mutationFn: repositoryService.connectRepository,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            setIsAddModalOpen(false);
            setNewRepo({ github_repo_id: '', full_name: '', owner: '', name: '', default_branch: 'main' });
            setRepositoryUrl('');
        }
    });

    const triggerSyncMutation = useMutation({
        mutationFn: repositoryService.triggerSyncProtocol,
        onSuccess: () => {
            setIsAnalyzeModalOpen(false);
            showToast('Analysis sync initiated! Check Updates for PR progress.');
        },
        onError: (err: any) => {
            showToast(`Sync failed: ${err}`, 'error');
        }
    });

    const fetchGitHubInfoMutation = useMutation({
        mutationFn: repositoryService.getGitHubInfo,
        onSuccess: (data: any) => {
            setNewRepo({
                github_repo_id: data.github_repo_id.toString(),
                full_name: data.full_name,
                owner: data.owner,
                name: data.name,
                default_branch: data.default_branch || 'main'
            });
        },
        onError: (error: any) => {
            alert(`Failed to retrieve repository details: ${error}`);
        }
    });

    const disconnectRepoMutation = useMutation({
        mutationFn: repositoryService.disconnectRepository,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            showToast('Repository disconnected successfully');
        },
        onError: (err: any) => showToast(`Disconnect failed: ${err}`, 'error')
    });

    const handleAddRepo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRepo.github_repo_id) {
            alert('Please retrieve repository info first or fill in the ID');
            return;
        }
        connectRepoMutation.mutate({
            ...newRepo,
            github_repo_id: newRepo.github_repo_id
        });
    };

    const handleFetchGitHubInfo = () => {
        if (!repositoryUrl) return;
        fetchGitHubInfoMutation.mutate(repositoryUrl);
    };

    return (
        <div className="space-y-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border font-bold text-sm transition-all ${toast.type === 'success'
                    ? 'bg-accent-neon/10 border-accent-neon/30 text-accent-neon'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <ExternalLink size={18} />}
                    {toast.message}
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight glow-text uppercase">Archive Nodes</h1>
                    <p className="text-foreground/60 mt-2">Manage and monitor your decentralized repository network.</p>
                </div>
                <button
                    onClick={() => {
                        setNewRepo({ github_repo_id: '', full_name: '', owner: '', name: '', default_branch: 'main' });
                        setRepositoryUrl('');
                        setIsAddModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-accent-cyan text-background font-bold rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:scale-105 active:scale-95 transition-transform"
                >
                    <Plus size={20} />
                    <span>Connect Repository</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                    <input
                        type="text"
                        placeholder="Search protocol ID or name..."
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-xl focus:outline-none focus:border-accent-cyan transition-colors"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-white/10 rounded-xl text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors">
                    <Filter size={20} />
                    <span>Filter</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <Loader2 className="w-12 h-12 text-accent-cyan animate-spin" />
                    </div>
                ) : (repos || []).map((repo: any, i: number) => (
                    <div
                        key={repo?.id || i}
                        className="glass-card p-6 group hover:border-accent-cyan/30 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
                                <Database size={24} />
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-accent-neon/10 text-accent-neon border border-accent-neon/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse" />
                                {repo.enabled ? 'Monitoring' : 'Disabled'}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold group-hover:text-accent-cyan transition-colors truncate">
                            {repo?.full_name || 'documentation-enforcer/core'}
                        </h3>
                        <p className="text-sm text-foreground/40 mt-1 mb-6">ID: {repo.id?.slice(0, 8)}</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] uppercase font-bold text-foreground/40 mb-1">Total PRs</p>
                                <p className="text-lg font-bold">{repo.total_prs_created || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] uppercase font-bold text-foreground/40 mb-1">Confidence</p>
                                <p className="text-lg font-bold text-accent-neon">{repo.average_confidence_score || 0}%</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setSelectedRepo(repo);
                                    setIsAnalyzeModalOpen(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-surface border border-white/10 rounded-lg text-xs font-bold hover:bg-accent-cyan/10 hover:border-accent-cyan/30 hover:text-accent-cyan transition-all"
                            >
                                <RefreshCw size={13} />
                                Sync Docs
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to disconnect this node?')) {
                                        disconnectRepoMutation.mutate(repo.id);
                                    }
                                }}
                                className="p-2 bg-surface border border-white/10 rounded-lg text-foreground/60 hover:text-red-500 hover:border-red-500/50 transition-all"
                                title="Disconnect Node"
                            >
                                <ExternalLink size={18} className="rotate-45" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Repository Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Connect New Node"
            >
                <form onSubmit={handleAddRepo} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60">GitHub Repository URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={repositoryUrl}
                                onChange={e => setRepositoryUrl(e.target.value)}
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-cyan"
                                placeholder="https://github.com/owner/repo"
                            />
                            <button
                                type="button"
                                onClick={handleFetchGitHubInfo}
                                disabled={fetchGitHubInfoMutation.isPending}
                                className="px-4 py-2 bg-surface border border-white/10 rounded-xl font-bold hover:bg-surface-hover disabled:opacity-50"
                            >
                                {fetchGitHubInfoMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Fetch'}
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase opacity-40">Repo ID</label>
                                <p className="font-mono text-sm">{newRepo.github_repo_id || '---'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase opacity-40">Branch</label>
                                <p className="font-mono text-sm">{newRepo.default_branch || '---'}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-40">Full Name</label>
                            <p className="font-bold text-accent-cyan">{newRepo.full_name || 'No repository selected'}</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={connectRepoMutation.isPending || !newRepo.github_repo_id}
                        className="w-full py-4 bg-accent-cyan text-background font-bold rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {connectRepoMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        Confirm Connection
                    </button>
                </form>
            </Modal>

            {/* Analyze Repository Modal */}
            <Modal
                isOpen={isAnalyzeModalOpen}
                onClose={() => setIsAnalyzeModalOpen(false)}
                title="Node Settings"
            >
                {selectedRepo && (
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Target Stream</p>
                            <p className="text-lg font-bold">{selectedRepo.full_name}</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                            <p className="text-sm text-foreground/70">Trigger a manual documentation scan to synchronize nodes.</p>
                            <button
                                onClick={() => triggerSyncMutation.mutate(selectedRepo.id)}
                                disabled={triggerSyncMutation.isPending}
                                className="w-full py-3 bg-white text-background font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-accent-neon transition-colors"
                            >
                                {triggerSyncMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                                Initiate Analysis Sync
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RepositoriesPage;
