import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  Film,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Scissors,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  MultiReelComparison,
  ReelAnalysisResult,
  DirectorChatMessage,
  DirectorChatHistoryItem,
  DirectorChatResponse,
} from '../types';

interface AskDirectorChatProps {
  comparison?: MultiReelComparison | null;
  activeReel?: ReelAnalysisResult | null;
  userNiche?: string;
  onSeekToTimestamp?: (seconds: number) => void;
  className?: string;
  initialOpen?: boolean;
}

const STARTER_QUESTIONS = [
  'Why did the winning Reel win?',
  'Which Reel has the strongest hook?',
  'What should I fix first?',
  'Compare my top 2 Reels.',
  'Is my opening strong enough?',
  'Should I trim any shots?',
];

export const AskDirectorChat: React.FC<AskDirectorChatProps> = ({
  comparison,
  activeReel,
  userNiche = 'High-Street Minimal & Luxury Fashion',
  onSeekToTimestamp,
  className = '',
}) => {
  const [messages, setMessages] = useState<DirectorChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Allow creator to switch focus among reels in the current comparison
  const availableReels = comparison?.reels || (activeReel ? [activeReel] : []);
  const defaultSelectedId = activeReel?.id || comparison?.reels.find((r) => r.isWinner)?.id || comparison?.reels[0]?.id;
  const [focusedReelId, setFocusedReelId] = useState<string | undefined>(defaultSelectedId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep focusedReelId in sync if props change
  useEffect(() => {
    if (activeReel?.id) {
      setFocusedReelId(activeReel.id);
    } else if (comparison?.winnerId && !focusedReelId) {
      setFocusedReelId(comparison.winnerId);
    }
  }, [activeReel, comparison]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const currentlyFocusedReel = availableReels.find((r) => r.id === focusedReelId) || availableReels[0];

  // Send message to /api/director/chat
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setErrorState(null);
    setInputText('');

    const userMessage: DirectorChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedReelNumber: currentlyFocusedReel?.reelNumber,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build conversation history for context continuity (last 8 messages)
      const historyPayload: DirectorChatHistoryItem[] = updatedMessages
        .slice(-8, -1) // all except the current message which goes in `message`
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const response = await fetch('/api/director/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          currentReelId: currentlyFocusedReel?.id,
          activeComparison: comparison || undefined,
          history: historyPayload,
          userNiche,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || 'Failed to get Director response.');
      }

      const data: DirectorChatResponse = await response.json();

      const directorReply: DirectorChatMessage = {
        id: `msg-${Date.now()}-director`,
        sender: 'director',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedReelNumber: currentlyFocusedReel?.reelNumber,
      };

      setMessages((prev) => [...prev, directorReply]);
    } catch (err: any) {
      console.error('AskDirectorChat error:', err);
      setErrorState(err.message || 'Could not connect to Reel Director. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetConversation = () => {
    setMessages([]);
    setErrorState(null);
  };

  // Helper to parse timestamp clicks e.g. "00:02.4"
  const handleTimestampClick = (timeStr: string) => {
    if (!onSeekToTimestamp) return;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseFloat(parts[0]);
      const seconds = parseFloat(parts[1]);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        onSeekToTimestamp(minutes * 60 + seconds);
      }
    }
  };

  // Simple formatter for Director responses: handles bolding, bullet points, and timestamp detection
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-zinc-200">
        {lines.map((line, lIdx) => {
          if (!line.trim()) {
            return <div key={lIdx} className="h-1.5" />;
          }

          // Render bullet list lines cleanly
          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\.\s/.test(line.trim());

          // Highlight timestamps and bold text
          const parts = line.split(/(\*\*.*?\*\*|\b\d{2}:\d{2}(?:\.\d+)?\b)/g);

          return (
            <div
              key={lIdx}
              className={`${isBullet ? 'pl-3 relative before:content-[""] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-purple-400' : ''}`}
            >
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-white tracking-wide">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }

                if (/^\d{2}:\d{2}(\.\d+)?$/.test(part)) {
                  return (
                    <button
                      key={pIdx}
                      onClick={() => handleTimestampClick(part)}
                      title={onSeekToTimestamp ? `Seek player to ${part}` : `Timestamp ${part}`}
                      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-bold ${
                        onSeekToTimestamp
                          ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 cursor-pointer border border-purple-500/40'
                          : 'bg-zinc-800 text-purple-300 border border-white/10'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{part}</span>
                    </button>
                  );
                }

                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      id="ask-reel-director"
      className={`rounded-3xl bg-[#12131d] border border-purple-500/20 shadow-2xl overflow-hidden flex flex-col ${className}`}
    >
      {/* 1. Header with Context Badge */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-[#191929] to-[#12131d] border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight font-['Syne']">
                  Ask Your Reel Director
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Context Live</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Your AI creative director knows your Reels, scores, edits and timeline.
              </p>
            </div>
          </div>
        </div>

        {/* Reel Focus Selector Pills */}
        {availableReels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium">Focus:</span>
            {availableReels.map((reel) => {
              const isSelected = reel.id === focusedReelId;
              return (
                <button
                  key={reel.id}
                  onClick={() => setFocusedReelId(reel.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>Reel #{reel.reelNumber}</span>
                  {reel.isWinner && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-black font-extrabold">
                      WINNER
                    </span>
                  )}
                </button>
              );
            })}
            {messages.length > 0 && (
              <button
                onClick={handleResetConversation}
                title="Reset conversation"
                className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.08] ml-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Messages & Empty State Container */}
      <div className="flex-1 p-4 sm:p-6 min-h-[260px] max-h-[440px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="py-6 sm:py-8 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Film className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm sm:text-base font-bold text-white font-['Syne']">
                Direct Creative Advice on Your Uploaded Takes
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The Director has evaluated {availableReels.length} Reel variation{availableReels.length === 1 ? '' : 's'} across 13 performance metrics. Ask why a specific variation won, query exact timestamps (e.g. "00:05 wala shot hata du?"), or challenge the scoring verdict.
              </p>
            </div>

            {/* Starter Quick Questions */}
            <div className="w-full pt-2">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
                Quick Director Prompts
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {STARTER_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-1.5 rounded-full bg-[#181926] hover:bg-purple-900/30 border border-white/[0.08] hover:border-purple-500/40 text-xs text-zinc-300 hover:text-white transition-all text-left flex items-center space-x-1.5 group cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-purple-600/30">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-4.5 ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-tr-sm shadow-lg shadow-purple-600/20'
                        : 'bg-[#181928] border border-purple-500/20 text-zinc-200 rounded-tl-sm shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between space-x-3 mb-1.5 pb-1 border-b border-white/[0.06]">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                        {isUser ? 'You' : 'Reel Director'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{msg.timestamp}</span>
                    </div>

                    {isUser ? (
                      <p className="text-xs sm:text-sm text-white leading-relaxed font-medium">
                        {msg.text}
                      </p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5 border border-white/10 font-bold text-xs">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start space-x-3 justify-start animate-fadeIn">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-purple-600/30 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#181928] border border-purple-500/20 rounded-2xl rounded-tl-sm p-3.5 text-xs text-zinc-400 flex items-center space-x-2.5">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-zinc-300 font-medium">
                    Director is reviewing keyframes, cut pacing, and subscores...
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorState && (
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorState}</span>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-white font-semibold text-[11px]"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Quick Follow-Up Chips when messages exist */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 sm:px-6 py-2 bg-[#0e0f17] border-t border-white/[0.04] flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold shrink-0">Quick ask:</span>
          {STARTER_QUESTIONS.slice(0, 4).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-purple-900/20 border border-white/[0.08] hover:border-purple-500/30 text-zinc-300 hover:text-white whitespace-nowrap text-[11px] transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 4. Chat Input Bar */}
      <div className="p-3 sm:p-4 bg-[#10111a] border-t border-white/[0.08]">
        <div className="relative flex items-center bg-[#181926] rounded-2xl border border-white/[0.1] focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all p-1.5 sm:p-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              currentlyFocusedReel
                ? `Ask about Reel #${currentlyFocusedReel.reelNumber} ("00:05 wala shot hata du?", "Why this score?")...`
                : 'Ask why a reel won, compare takes, or query a timestamp...'
            }
            className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none px-2 py-1 max-h-24"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
              inputText.trim() && !isLoading
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-zinc-500">
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for newline</span>
          <span>Powered by Reel Director AI Context Engine</span>
        </div>
      </div>
    </div>
  );
};
