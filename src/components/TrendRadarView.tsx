import React, { useState, useEffect } from 'react';
import { Radio, Sparkles, TrendingUp, ShieldCheck, RefreshCw, Calendar, Flame, Music, Scissors, Shirt } from 'lucide-react';
import { TrendRadarItem } from '../types';

export const TrendRadarView: React.FC = () => {
  const [trends, setTrends] = useState<TrendRadarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [updatedAt, setUpdatedAt] = useState<string>('');

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reels/trends');
      if (res.ok) {
        const data = await res.json();
        setTrends(data.trends || []);
        setUpdatedAt(data.updatedAt || new Date().toISOString());
      }
    } catch (err) {
      console.error('Error loading trends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const categories = ['All', 'Fashion Format', 'Editing Style', 'Audio Direction', 'Seasonal Aesthetic'];

  const filteredTrends = selectedCategory === 'All'
    ? trends
    : trends.filter((t) => t.category === selectedCategory);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-['Syne']">
              Fashion Trend Radar
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>Live Creator Signals</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Grounded intelligence on current short-form fashion editing formats, audio directions, and pacing benchmarks.
          </p>
        </div>

        <button
          onClick={fetchTrends}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trend Signals</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.06]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTrends.map((trend) => {
          return (
            <div
              key={trend.id}
              className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/[0.05] text-purple-300 border border-white/[0.08] uppercase">
                  {trend.category}
                </span>

                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    trend.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {trend.confidence} Confidence
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-['Syne']">
                  {trend.topic}
                </h3>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  {trend.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.05] space-y-1.5 text-[11px]">
                <p className="text-purple-300">
                  <strong>Creator Impact:</strong> {trend.relevanceToCreator}
                </p>
                <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                  <span>Source: {trend.sourceOrigin}</span>
                  <span>Detected: {trend.detectedDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
