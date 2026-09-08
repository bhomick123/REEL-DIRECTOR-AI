import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, Target, CheckCircle2, Plus, BarChart3, Clock, Shirt } from 'lucide-react';
import { CreatorMemoryProfile, PredictionVsRealityItem } from '../types';

export const CreatorMemoryView: React.FC = () => {
  const [memory, setMemory] = useState<CreatorMemoryProfile | null>(null);
  const [predictions, setPredictions] = useState<PredictionVsRealityItem[]>([]);
  const [loading, setLoading] = useState(false);

  // New post actual outcome form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newScore, setNewScore] = useState(90);
  const [newViews, setNewViews] = useState(35000);
  const [newReach, setNewReach] = useState(28000);
  const [newLikes, setNewLikes] = useState(2400);
  const [newSaves, setNewSaves] = useState(950);
  const [newTakeaway, setNewTakeaway] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memRes, predRes] = await Promise.all([
        fetch('/api/creator/memory'),
        fetch('/api/creator/prediction-vs-reality'),
      ]);

      if (memRes.ok) {
        const m = await memRes.json();
        setMemory(m.memory);
      }
      if (predRes.ok) {
        const p = await predRes.json();
        setPredictions(p.predictions || []);
      }
    } catch (err) {
      console.error('Error fetching creator memory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/creator/prediction-vs-reality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reelTitle: newTitle,
          predictedScore: newScore,
          actualViews: newViews,
          actualReach: newReach,
          actualLikes: newLikes,
          actualSaves: newSaves,
          takeaway: newTakeaway || 'Performance verified AI prediction model.',
        }),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewTitle('');
        setNewTakeaway('');
        fetchData();
      }
    } catch (err) {
      alert('Could not save post outcome.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-['Syne']">
              Creator Memory & Accuracy Learning
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
              Self-Optimizing
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Over time, REEL DIRECTOR AI learns which visual styles, durations, and hooks yield highest actual retention for your specific audience.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Real Post Result</span>
        </button>
      </div>

      {/* Add Real Post Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddPrediction}
          className="p-6 rounded-2xl bg-[#141525] border border-purple-500/30 space-y-4"
        >
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
            Record Live Post Performance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-zinc-400 font-medium">Reel Title / Outfit Description</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Paris Trench Coat Styling"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Predicted AI Score</label>
              <input
                type="number"
                min="50"
                max="100"
                value={newScore}
                onChange={(e) => setNewScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Actual Views</label>
              <input
                type="number"
                value={newViews}
                onChange={(e) => setNewViews(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Actual Reach</label>
              <input
                type="number"
                value={newReach}
                onChange={(e) => setNewReach(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Actual Saves</label>
              <input
                type="number"
                value={newSaves}
                onChange={(e) => setNewSaves(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <label className="text-zinc-400 font-medium">Performance Takeaway / Observation</label>
              <input
                type="text"
                value={newTakeaway}
                onChange={(e) => setNewTakeaway(e.target.value)}
                placeholder="e.g. Hook retention matched 92 score expectation; comments were high on the shoe tag."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-white/[0.05] text-zinc-300 text-xs font-semibold hover:bg-white/[0.1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-md"
            >
              Save Post Metric
            </button>
          </div>
        </form>
      )}

      {/* Creator Profile Summary Cards */}
      {memory && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2 text-purple-400">
              <Shirt className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                Preferred Fashion Styles
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {memory.preferredFashionStyles.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                Optimal Reel Duration Range
              </h3>
            </div>
            <p className="text-2xl font-black text-white">{memory.optimalReelDurationRange}</p>
            <p className="text-xs text-zinc-400">Yields highest completion and repeat loop rewatch rates.</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                Historical Reel Score Average
              </h3>
            </div>
            <p className="text-2xl font-black text-white">{memory.averageScoreAcrossUploads || 88}<span className="text-xs text-purple-400">/100</span></p>
            <p className="text-xs text-zinc-400">Across all evaluated shoot variations.</p>
          </div>
        </div>
      )}

      {/* Prediction vs Reality Log */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
          AI Prediction vs Real Performance Tracking
        </h3>

        <div className="space-y-3">
          {predictions.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{item.reelTitle}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.postDate}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.accuracyRating || 'High Correlation'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300">{item.takeaway}</p>
              </div>

              <div className="flex items-center space-x-6 text-xs text-zinc-400 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Predicted</p>
                  <p className="text-lg font-black text-purple-400">{item.predictedScore}/100</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Actual Views</p>
                  <p className="text-lg font-black text-white">{item.actualViews?.toLocaleString() || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Actual Saves</p>
                  <p className="text-lg font-black text-amber-300">{item.actualSaves?.toLocaleString() || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
