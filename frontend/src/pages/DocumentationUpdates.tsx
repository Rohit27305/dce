import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { updatesService } from '../services/api';

const DocumentationUpdatesPage: React.FC = () => {
    const { data: updates } = useQuery({ queryKey: ['updates'], queryFn: updatesService.list });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight glow-text uppercase">Sync Protocols</h1>
                <p className="text-foreground/60 mt-2">Historical log of AI-generated documentation synchronizations.</p>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-[10px] uppercase font-bold tracking-widest text-foreground/40 border-b border-white/10">
                                <th className="px-6 py-4">Protocol ID</th>
                                <th className="px-6 py-4">Trigger Event</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Confidence</th>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(updates || Array.from({ length: 8 })).map((update: any, i: number) => (
                                <motion.tr
                                    key={update?.id || i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="hover:bg-white/[0.02] group transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-accent-magenta/10 flex items-center justify-center text-accent-magenta border border-accent-magenta/20 italic font-black text-xs">
                                                {update?.id?.slice(0, 2) || 'LX'}
                                            </div>
                                            <span className="font-mono text-xs">#{update?.id?.slice(0, 8) || 'AE-3094A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        Refactor: Core database schema update
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-2 px-2 py-1 rounded bg-accent-neon/10 text-accent-neon border border-accent-neon/20 text-[10px] font-bold uppercase w-fit">
                                            <CheckCircle size={10} /> Merged
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '94%' }}
                                                    className="h-full bg-accent-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-accent-cyan">94%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-foreground/40 text-xs">
                                            <Clock size={12} />
                                            {new Date().toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-foreground/60 hover:text-accent-cyan transition-colors">
                                            <ExternalLink size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DocumentationUpdatesPage;
