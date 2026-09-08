import React from 'react';
import { X, ShieldCheck, Instagram, AlertTriangle, LogOut, CheckCircle2 } from 'lucide-react';
import { UserProfile, InstagramConnection } from '../types';

interface PrivacyModalProps {
  user: UserProfile;
  instagram: InstagramConnection;
  onClose: () => void;
  onDisconnectInstagram: () => Promise<void>;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  user,
  instagram,
  onClose,
  onDisconnectInstagram,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-[#0f1019] rounded-3xl border border-white/[0.1] shadow-2xl overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-['Syne']">
              Connected Data & Privacy Controls
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Info */}
        <div className="p-4 rounded-2xl bg-[#141525] border border-white/[0.06] flex items-center space-x-4">
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt={user.name}
            className="w-12 h-12 rounded-xl object-cover border border-purple-500/30"
          />
          <div>
            <h3 className="text-sm font-bold text-white">{user.name}</h3>
            <p className="text-xs text-zinc-400">{user.brandNiche}</p>
          </div>
        </div>

        {/* Meta Permissions breakdown */}
        <div className="space-y-3 text-xs">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-['Syne']">
            Instagram API Permission Boundary
          </h4>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
              <span className="font-semibold">Reel Media & Metric Insights</span>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 px-2 py-0.5 rounded">Granted</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
              <span className="font-semibold">Professional Profile Information</span>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 px-2 py-0.5 rounded">Granted</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 flex items-center justify-between">
              <span>Direct Messages (DMs)</span>
              <span className="text-[10px] uppercase font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Never Requested</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 flex items-center justify-between">
              <span>Account Passwords</span>
              <span className="text-[10px] uppercase font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Never Touched</span>
            </div>
          </div>
        </div>

        {/* Instagram Disconnect Option if connected */}
        {instagram.isConnected && (
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Disconnect @{instagram.username}</p>
              <p className="text-[11px] text-zinc-400">Revoke token and delete stored insights</p>
            </div>
            <button
              onClick={async () => {
                await onDisconnectInstagram();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
