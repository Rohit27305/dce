import React, { useState } from 'react';
import { Search, Filter, Plus, Database, Loader2, Zap, CheckCircle, RefreshCw, Trash2, ChevronDown, Lock, Globe, GitBranch, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositoryService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/common/Modal';

const RepositoriesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [repositoryUrl, setRepositoryUrl] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [fetchedBranches, setFetchedBranches] = useState<string[]>([]);
    const [isPrivateRepo, setIsPrivateRepo] = useState(false);
    const [repoDescription, setRepoDescription] = useState('');
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
            queryClient.invalidateQueries({ queryKey: ['metrics'] });
            setIsAddModalOpen(false);
            setNewRepo({ github_repo_id: '', full_name: '', owner: '', name: '', default_branch: 'main' });
            setRepositoryUrl('');
            setFetchedBranches([]);
            setIsPrivateRepo(false);
            setRepoDescription('');
            showToast('Repository connected successfully!');
        },
        onError: (err: any) => showToast(`Connection failed: ${err}`, 'error')
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
            setFetchedBranches(data.branches || []);
            setIsPrivateRepo(data.private || false);
            setRepoDescription(data.description || '');
        },
        onError: (error: any) => {
            showToast(`Failed to retrieve repo: ${error}`, 'error');
        }
    });

    const disconnectRepoMutation = useMutation({
        mutationFn: repositoryService.disconnectRepository,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            queryClient.invalidateQueries({ queryKey: ['metrics'] });
            showToast('Repository disconnected successfully');
        },
        onError: (err: any) => showToast(`Disconnect failed: ${err}`, 'error')
    });

    const handleAddRepo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRepo.github_repo_id) {
            showToast('Please retrieve repository info first or fill in the ID', 'error');
            return;
        }
        connectRepoMutation.mutate({
            ...newRepo,
            github_repo_id: parseInt(newRepo.github_repo_id),
            is_private: Boolean(isPrivateRepo)
        });
    };

    const handleFetchGitHubInfo = () => {
        if (!repositoryUrl) return;
        fetchGitHubInfoMutation.mutate(repositoryUrl);
    };

    return (
        <div className="space-y-8">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border font-bold text-sm transition-all ${toast.type === 'success'
                            ? 'bg-accent-neon/10 border-accent-neon/30 text-accent-neon'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight glow-text uppercase">Repositories</h1>
                    <p className="text-foreground/60 mt-2">Manage and monitor your connected GitHub repositories.</p>
                </div>
                <button
                    onClick={() => {
                        setNewRepo({ github_repo_id: '', full_name: '', owner: '', name: '', default_branch: 'main' });
                        setRepositoryUrl('');
                        setFetchedBranches([]);
                        setIsPrivateRepo(false);
                        setRepoDescription('');
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
                        placeholder="Search by name..."
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-xl focus:outline-none focus:border-accent-cyan transition-colors"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-white/10 rounded-xl text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors">
                    <Filter size={20} />
                    <span>Filter</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-12 h-12 text-accent-cyan animate-spin" />
                </div>
            ) : (repos || []).length === 0 ? (
                <div className="py-16 glass-card flex flex-col items-center justify-center text-foreground/40 border-dashed border-2 border-white/10">
                    <Database size={56} className="mb-4 opacity-20" />
                    <p className="text-xl font-bold uppercase tracking-widest mb-2">No Repositories Connected</p>
                    <p className="text-sm text-center max-w-xs">Click "Connect Repository" to add your first GitHub repo for monitoring.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {repos?.map((repo: any, i: number) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            key={repo?.id || i}
                            className="relative group"
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                            <div className="relative glass-card p-6 flex flex-col h-full hover:border-accent-cyan/40 transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan shadow-inner">
                                        <Database size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase text-foreground/50">
                                            {repo.is_private ? <Lock size={12} className="text-amber-400" /> : <Globe size={12} />}
                                            {repo.is_private ? 'Private' : 'Public'}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-neon/10 text-accent-neon border border-accent-neon/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse" />
                                            {repo.enabled ? 'Live' : 'Off'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6 flex-grow">
                                    <h3 className="text-xl font-black group-hover:text-accent-cyan transition-colors truncate tracking-tight">
                                        {repo?.full_name || 'owner/repository'}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2 text-xs font-mono font-medium text-foreground/40">
                                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">ID: {repo.id?.slice(0, 8)}</span>
                                        <span className="flex items-center gap-1.5 text-accent-cyan/60">
                                            <GitBranch size={12} />
                                            {repo.default_branch || 'main'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-center">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-foreground/30 mb-1">Status</p>
                                        <p className="text-lg font-bold font-mono">STANDBY</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-center">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-foreground/30 mb-1">Confidence</p>
                                        <p className="text-lg font-bold font-mono text-accent-neon">{repo.average_confidence_score || 0}%</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedRepo(repo);
                                            setIsAnalyzeModalOpen(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-accent-cyan/10 hover:border-accent-cyan/30 hover:text-accent-cyan transition-all group/btn"
                                    >
                                        <RefreshCw size={14} className="group-hover/btn:rotate-180 transition-transform duration-700" />
                                        Sync Protocol
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Delete "${repo.full_name}" and all associated data? This cannot be undone.`)) {
                                                disconnectRepoMutation.mutate(repo.id);
                                            }
                                        }}
                                        disabled={disconnectRepoMutation.isPending}
                                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-foreground/30 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30 transition-all disabled:opacity-50"
                                        title="Delete Repository"
                                    >
                                        {disconnectRepoMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Repository Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Connect Repository"
            >
                <form onSubmit={handleAddRepo} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60">GitHub Repository URL</label>
                        <p className="text-[11px] text-foreground/40">Works with both public and private repos (if your token has access).</p>
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
                                disabled={fetchGitHubInfoMutation.isPending || !repositoryUrl}
                                className="px-5 py-2 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan rounded-xl font-bold hover:bg-accent-cyan/20 disabled:opacity-50 transition-colors"
                            >
                                {fetchGitHubInfoMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Fetch'}
                            </button>
                        </div>
                    </div>

                    {newRepo.full_name && (
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-accent-cyan text-lg">{newRepo.full_name}</p>
                                    {repoDescription && <p className="text-xs text-foreground/50 mt-1 line-clamp-2">{repoDescription}</p>}
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${isPrivateRepo
                                    ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                                    : 'text-accent-neon bg-accent-neon/10 border-accent-neon/30'
                                    }`}>
                                    {isPrivateRepo ? <Lock size={10} /> : <Globe size={10} />}
                                    {isPrivateRepo ? 'Private' : 'Public'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase opacity-40">Repo ID</label>
                                    <p className="font-mono text-sm">{newRepo.github_repo_id || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase opacity-40">Owner</label>
                                    <p className="font-mono text-sm">{newRepo.owner || '---'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase opacity-40 flex items-center gap-1.5">
                                    <GitBranch size={12} />
                                    Target Branch
                                </label>
                                {fetchedBranches.length > 0 ? (
                                    <div className="relative">
                                        <select
                                            value={newRepo.default_branch}
                                            onChange={e => setNewRepo({ ...newRepo, default_branch: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-cyan appearance-none cursor-pointer text-sm"
                                        >
                                            {fetchedBranches.map(branch => (
                                                <option key={branch} value={branch} className="bg-gray-900 text-white">{branch}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={newRepo.default_branch}
                                        onChange={e => setNewRepo({ ...newRepo, default_branch: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-cyan text-sm"
                                        placeholder="main"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={connectRepoMutation.isPending || !newRepo.github_repo_id}
                        className="w-full py-4 bg-accent-cyan text-background font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] transition-all"
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
                title="Analyze Repository"
            >
                {selectedRepo && (
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Repository</p>
                            <p className="text-lg font-bold">{selectedRepo.full_name}</p>
                            <p className="text-xs text-foreground/40 mt-1 flex items-center gap-1.5">
                                <GitBranch size={12} />
                                Branch: <span className="text-accent-magenta font-mono">{selectedRepo.default_branch}</span>
                            </p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                            <p className="text-sm text-foreground/70">Run a full documentation analysis on this repository.</p>
                            <button
                                onClick={() => triggerSyncMutation.mutate(selectedRepo.id)}
                                disabled={triggerSyncMutation.isPending}
                                className="w-full py-3 bg-white text-background font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-accent-neon transition-colors"
                            >
                                {triggerSyncMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                                Start Analysis
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RepositoriesPage;
