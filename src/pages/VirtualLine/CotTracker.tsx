import { motion } from "framer-motion";
import {
    PlayCircle,
    PauseCircle,
    Filter,
    Download,
    Activity,
    User,
    Hash,
    ArrowUpRight,
    TrendingUp,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CotTracker() {
    const lineDetails = [
        { name: "Live Production Line #04", status: "Active", target: "1200", current: "892", eff: "74.3%", color: "indigo" },
        { name: "Live Production Line #07", status: "Active", target: "850", current: "412", eff: "48.5%", color: "rose" },
        { name: "Live Production Line #12", status: "Idle", target: "1500", current: "0", eff: "0.0%", color: "slate" },
    ];

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Search and Global Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="flex-1 relative max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Activity size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search production line, style number, or operator..."
                        className="w-full h-14 pl-14 pr-6 text-sm font-medium focus:outline-none placeholder:text-slate-400 text-slate-700"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-14 rounded-2xl gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm px-6">
                        <Filter size={18} />
                        Advanced Filtering
                    </Button>
                    <Button className="h-14 rounded-2xl gap-2 bg-indigo-600 hover:bg-primary shadow-lg px-8">
                        <Download size={18} />
                        Export Live Report
                    </Button>
                </div>
            </div>

            {/* Main Grid for Tracking */}
            <div className="grid grid-cols-1 gap-8">
                {lineDetails.map((line, idx) => (
                    <motion.div
                        key={line.name}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.15 }}
                    >
                        <Card className="rounded-[40px] border-0 shadow-xl overflow-hidden group bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 lg:grid-cols-12">

                                    {/* Info Header Area */}
                                    <div className={`lg:col-span-4 p-10 bg-gradient-to-br transition-all duration-500 ${line.color === 'indigo' ? 'from-indigo-600 to-violet-700' :
                                            line.color === 'rose' ? 'from-rose-500 to-pink-600' :
                                                'from-[#475569] to-[#1e293b]'
                                        } text-white flex flex-col justify-between`}>
                                        <div className="flex flex-col gap-8">
                                            <Badge className="w-fit bg-white/20 backdrop-blur-md text-white border-0 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider">
                                                {line.status}
                                            </Badge>
                                            <div>
                                                <h3 className="text-3xl font-extrabold font-heading mb-2 leading-tight">{line.name}</h3>
                                                <div className="flex items-center gap-3 mt-4 text-white/70">
                                                    <Clock size={16} />
                                                    <span className="text-sm font-semibold">Running for 6h 42m</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 flex flex-col gap-6">
                                            <div className="flex items-center gap-4 group/btn cursor-pointer">
                                                <Button size="icon" className="w-14 h-14 rounded-3xl bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-none transition-all duration-700">
                                                    {line.status === 'Active' ? <PauseCircle /> : <PlayCircle />}
                                                </Button>
                                                <span className="font-bold text-sm tracking-wide group-hover/btn:translate-x-1 transition-transform uppercase">
                                                    {line.status === 'Active' ? 'Pause Stream' : 'Initialize Stream'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operational Data Area */}
                                    <div className="lg:col-span-8 p-10 flex flex-col justify-between bg-white relative overflow-hidden">
                                        {/* Background Graphic */}
                                        <div className="absolute right-0 bottom-0 opacity-[0.03] rotate-12 scale-150 pointer-events-none">
                                            <Activity size={240} className="text-slate-900" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                            {[
                                                { label: "Current Output", val: line.current, icon: Activity, detail: `Target: ${line.target}` },
                                                { label: "Working Efficiency", val: line.eff, icon: TrendingUp, detail: "Weighted Avg 1h" },
                                                { label: "Active Operators", val: line.current === '0' ? '0' : '42', icon: User, detail: "Synchronized" }
                                            ].map((stat) => (
                                                <div key={stat.label} className="group/stat">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover/stat:bg-indigo-50 group-hover/stat:text-indigo-600 transition-colors shadow-sm border border-slate-100">
                                                            <stat.icon size={18} />
                                                        </span>
                                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-4xl font-extrabold text-slate-900 tracking-tighter mb-2 group-hover/stat:scale-105 transition-transform origin-left duration-300">
                                                            {stat.val}
                                                        </span>
                                                        <span className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                                                            {stat.detail}
                                                            <ArrowUpRight size={14} className="text-indigo-500 opacity-0 group-hover/stat:opacity-100" />
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-14 pt-10 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1 max-w-md">
                                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                                    <span>Output Progress</span>
                                                    <span>{Math.round((parseInt(line.current) / parseInt(line.target) * 100) || 0)}%</span>
                                                </div>
                                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-50">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(parseInt(line.current) / parseInt(line.target) * 100) || 0}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className={`h-full ${line.color === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-violet-600' :
                                                                line.color === 'rose' ? 'bg-gradient-to-r from-rose-400 to-pink-500' :
                                                                    'bg-slate-400'
                                                            } shadow-sm`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Button variant="ghost" className="rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 font-bold px-6">View Historical Data</Button>
                                                <Button className="rounded-2xl shadow-indigo-200 bg-slate-900 hover:bg-black text-white shadow-xl px-10">Launch 3D Monitor</Button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
