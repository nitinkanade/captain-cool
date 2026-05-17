"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, Trophy, Volume2, Info, Loader2, Play } from "lucide-react";
import { playerStats } from "@/lib/playerStats";

export default function Home() {
  const [debate, setDebate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finalDecision, setFinalDecision] = useState("");
  const [finalDecisionHindi, setFinalDecisionHindi] = useState("");
  const [lang, setLang] = useState('en');
  const endOfMessagesRef = useRef(null);

  const [formData, setFormData] = useState({
    innings: "2",
    over: "16",
    ball: "0",
    score: "148",
    wickets: "4",
    battingTeam: "CSK",
    bowlingTeam: "MI",
    striker: "Ravindra Jadeja",
    nonStriker: "MS Dhoni",
    bowlers: "Jasprit Bumrah:3, Hardik Pandya:2, Yuzvendra Chahal:3",
    pitch: "Two-paced",
    dew: "7",
    venue: "Wankhede",
    target: "192",
    impactPlayer: true,
  });

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [debate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const loadDemo = () => {
    setFormData({
      innings: "2",
      over: "16",
      ball: "0",
      score: "148",
      wickets: "4",
      battingTeam: "CSK",
      bowlingTeam: "MI",
      striker: "Ravindra Jadeja",
      nonStriker: "MS Dhoni",
      bowlers: "Jasprit Bumrah:3, Hardik Pandya:2, Yuzvendra Chahal:3",
      pitch: "Two-paced",
      dew: "7",
      venue: "Wankhede",
      target: "192",
      impactPlayer: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDebate([]);
    setFinalDecision("");
    setFinalDecisionHindi("");
    setLang('en');

    try {
      // Parse bowlers "Name:oversUsed, Name:oversUsed" into structured array
      const bowlersStructured = formData.bowlers.split(',').map(s => {
        const [name, overs] = s.split(':').map(x => x?.trim());
        const used = Number(overs);
        return {
          name,
          oversUsed: Number.isFinite(used) ? used : 0,
          oversRemaining: Math.max(0, 4 - (Number.isFinite(used) ? used : 0)),
        };
      }).filter(b => b.name);

      // Derive phase from over number (T20)
      const overNum = Number(formData.over);
      const phase = overNum < 6 ? "powerplay" : overNum >= 16 ? "death" : "middle";

      // Compute RRR for 2nd innings
      const ballsBowled = overNum * 6 + Number(formData.ball);
      const ballsRemaining = Math.max(0, 120 - ballsBowled);
      const runsNeeded = Number(formData.target) - Number(formData.score);
      const requiredRunRate = formData.innings === "2" && ballsRemaining > 0
        ? ((runsNeeded * 6) / ballsRemaining).toFixed(2)
        : null;

      const matchState = {
        ...formData,
        bowlers: bowlersStructured,
        phase,
        ballsRemaining,
        runsNeeded: formData.innings === "2" ? runsNeeded : null,
        requiredRunRate,
      };

      const res = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchState),
      });

      if (!res.ok) {
        let errStr = "Failed to fetch debate";
        try {
          const errData = await res.json();
          if (errData.error) errStr = errData.error;
        } catch(e) {}
        throw new Error(errStr);
      }

      const data = await res.json();
      
      // Animate debate bubbles appearing
      const revealDebate = async (debateData) => {
        for (let i = 0; i < debateData.length; i++) {
          await new Promise(r => setTimeout(r, 1000));
          setDebate(prev => [...prev, debateData[i]]);
        }
        setFinalDecision(data.finalDecision);
        setFinalDecisionHindi(data.finalDecisionHindi);
      };
      
      revealDebate(data.debate);

    } catch (error) {
      let friendlyMessage = error.message;
      if (friendlyMessage.includes("429") || friendlyMessage.includes("Quota exceeded")) {
        friendlyMessage = "Google Gemini API Rate Limit Exceeded (Free Tier limits 15-20 requests/minute). Please wait 60 seconds and try again!";
      }

      setDebate([{ 
        agent: "system", 
        name: "System Error", 
        emoji: "⚠️", 
        message: friendlyMessage 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const playVoice = () => {
    if (lang === 'en' && !finalDecision) return;
    if (lang === 'hi' && !finalDecisionHindi) return;
    const textToSpeak = lang === 'hi' ? finalDecisionHindi : finalDecision;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const voices = speechSynthesis.getVoices();
    const targetLang = lang === 'hi' ? "hi-IN" : "en-IN";
    const langVoices = voices.filter(v => v.lang.includes(targetLang));
    
    const femaleNames = ['female', 'zira', 'swara', 'aditi', 'kalpana', 'neerja', 'hazel'];
    const maleNames = ['male', 'david', 'ravi', 'hemant', 'mark', 'george', 'ryan', 'brian'];
    
    let selectedVoice = langVoices.find(v => maleNames.some(m => v.name.toLowerCase().includes(m))) 
                     || langVoices.find(v => !femaleNames.some(f => v.name.toLowerCase().includes(f))) 
                     || langVoices[0] 
                     || null;

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes("en") && maleNames.some(m => v.name.toLowerCase().includes(m))) || voices[0] || null;
    }

    utterance.voice = selectedVoice;
    utterance.rate = 1.0; 
    utterance.pitch = 0.9; 
    speechSynthesis.speak(utterance);
  };

  const battersList = Object.keys(playerStats.batters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white font-sans selection:bg-orange-500 selection:text-white">
      <header className="px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Trophy className="text-orange-400 w-8 h-8" />
          <div>
            <h1 className="text-2xl font-black tracking-tight">Captain Cool <span className="text-orange-400">🏏</span></h1>
            <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">Your AI Cricket Brain Trust</p>
          </div>
        </div>
        <button 
          onClick={loadDemo}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition px-4 py-2 rounded-full text-sm font-semibold border border-white/10"
        >
          <Play className="w-4 h-4 text-orange-400" />
          Load Demo Scenario
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-80px)]">
        
        {/* LEFT PANEL - Form */}
        <div className="lg:col-span-5 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Innings</label>
                <select name="innings" value={formData.innings} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition">
                  <option value="1">1st Innings</option>
                  <option value="2">2nd Innings</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-blue-200 font-semibold uppercase">Over</label>
                  <input type="number" name="over" value={formData.over} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-blue-200 font-semibold uppercase">Ball</label>
                  <input type="number" name="ball" value={formData.ball} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Score</label>
                <input type="text" name="score" value={formData.score} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition font-mono text-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Wickets</label>
                <input type="text" name="wickets" value={formData.wickets} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition font-mono text-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Target</label>
                <input type="text" name="target" value={formData.target} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition font-mono text-lg" disabled={formData.innings === "1"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Batting Team</label>
                <input type="text" name="battingTeam" value={formData.battingTeam} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Bowling Team</label>
                <input type="text" name="bowlingTeam" value={formData.bowlingTeam} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition" />
              </div>
            </div>

            <div className="space-y-4 p-4 bg-blue-950/30 rounded-2xl border border-blue-900/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-blue-200 font-semibold uppercase">Batter on Strike</label>
                  <select name="striker" value={formData.striker} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition">
                    {battersList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-blue-200 font-semibold uppercase">Non-Striker</label>
                  <select name="nonStriker" value={formData.nonStriker} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition">
                    {battersList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Bowlers Available <span className="text-white/40 normal-case">(format: <code>Name:oversUsed</code>, comma separated)</span></label>
                <input type="text" name="bowlers" value={formData.bowlers} onChange={handleInputChange} placeholder="Bumrah:3, Hardik:2, Chahal:3" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Venue</label>
                <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase">Pitch Condition</label>
                <select name="pitch" value={formData.pitch} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition">
                  <option>Flat</option>
                  <option>Turning</option>
                  <option>Two-paced</option>
                  <option>Green</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-blue-200 font-semibold uppercase flex justify-between">
                  <span>Dew Factor</span> 
                  <span className="text-orange-400">{formData.dew}/10</span>
                </label>
                <input type="range" min="0" max="10" name="dew" value={formData.dew} onChange={handleInputChange} className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer mt-3 accent-orange-500" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5">
              <span className="text-sm font-semibold">Impact Player Available?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="impactPlayer" checked={formData.impactPlayer} onChange={handleInputChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-lg py-4 rounded-2xl transition transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Brain className="w-6 h-6" />}
              {loading ? "Analyzing..." : "Ask the Captain 🧠"}
            </button>
          </form>
        </div>

        {/* RIGHT PANEL - Debate Arena */}
        <div className="lg:col-span-7 bg-black/20 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col overflow-hidden relative">
          
          {debate.length === 0 && !loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
              <Trophy className="w-24 h-24 mb-4 text-white/20" />
              <h2 className="text-2xl font-bold mb-2">The War Room is Empty</h2>
              <p className="max-w-md">Set the match state and click "Ask the Captain" to let the AI brain trust analyze the situation and debate the next move.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {debate.map((msg, idx) => (
                <div key={idx} className={`flex flex-col max-w-[85%] animate-in slide-in-from-bottom-4 fade-in duration-500 ${msg.agent === 'ravi' ? 'self-end items-end' : 'self-start'}`}>
                  
                  <div className={`flex items-center gap-2 mb-1 px-1 ${msg.agent === 'ravi' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-2xl bg-white/10 p-2 rounded-full border border-white/5 shadow-sm">{msg.emoji}</span>
                    <span className="font-bold text-sm tracking-wide text-white/80">{msg.name}</span>
                    {msg.isFinal && <span className="bg-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ml-2">Final Call</span>}
                  </div>

                  <div className={`p-5 rounded-2xl shadow-lg border relative ${
                    msg.agent === 'numbers' ? 'bg-slate-900/90 border-blue-500/30 text-blue-50 font-mono text-sm' :
                    msg.agent === 'captain' ? (msg.isFinal ? 'bg-gradient-to-br from-indigo-900 to-blue-900 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)] text-white text-lg' : 'bg-blue-950/80 border-blue-400/20 text-white') :
                    'bg-red-950/80 border-red-500/30 text-rose-50 italic text-lg' // Ravi
                  } ${msg.agent === 'ravi' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                    
                    {msg.toolCallsMade && msg.toolCallsMade.length > 0 && (
                      <div className="mb-3 p-3 bg-black/40 rounded-lg border border-white/10 font-sans text-xs flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-blue-300 font-bold mb-1">
                          <Info className="w-3 h-3" /> Tools Used
                        </div>
                        {msg.toolCallsMade.map((tc, i) => (
                          <div key={i} className="text-white/60">
                            <span className="text-green-400">{tc.name}</span>(<span className="text-white/40">{Object.entries(tc.args).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('/') : v}`).join(', ')}</span>)
                            {tc.result?.winProbability !== undefined && (
                              <span className="ml-2 text-orange-300">→ win prob {Math.round(tc.result.winProbability * 100)}%</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.isFinal && lang === 'hi' ? msg.messageHindi : msg.message}
                    </div>

                    {msg.isFinal && (msg.confidence !== null && msg.confidence !== undefined) && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 rounded-lg border border-emerald-500/30 font-sans text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-emerald-300 font-bold uppercase tracking-wider">Confidence</span>
                          <span className="text-emerald-200 font-mono text-base font-black">{Math.round(msg.confidence * 100)}%</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden mb-3">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: `${Math.round(msg.confidence * 100)}%` }}></div>
                        </div>
                        {msg.counterfactual && (
                          <div className="text-white/70">
                            <span className="text-amber-300 font-bold">Counterfactual: </span>
                            <span className="italic">{msg.counterfactual.alternative}</span>
                            {msg.counterfactual.delta && <span className="text-white/50"> — {msg.counterfactual.delta}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.searchQueries && msg.searchQueries.length > 0 && (
                      <div className="mt-3 p-3 bg-black/40 rounded-lg border border-white/10 font-sans text-xs">
                        <div className="flex items-center gap-1 text-orange-300 font-bold mb-1">
                          <Info className="w-3 h-3" /> Grounded via Google Search
                        </div>
                        <div className="text-white/60 italic mb-1">
                          Queries: {msg.searchQueries.join(' · ')}
                        </div>
                        {msg.groundingSources && msg.groundingSources.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {msg.groundingSources.slice(0, 4).map((src, i) => (
                              <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline truncate max-w-[200px]">
                                {src.title || src.uri}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && debate.length < 4 && (
                <div className="flex flex-col max-w-[85%] self-start animate-pulse">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-2xl bg-white/10 p-2 rounded-full border border-white/5 shadow-sm">🤔</span>
                    <span className="font-bold text-sm tracking-wide text-white/50">Thinking...</span>
                  </div>
                  <div className="p-5 rounded-2xl rounded-tl-sm shadow-lg bg-white/5 border border-white/10 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          )}

          {finalDecision && (
             <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between backdrop-blur-xl animate-in slide-in-from-bottom flex-shrink-0">
               <div className="flex items-center gap-4">
                 <button onClick={playVoice} className="bg-orange-500 hover:bg-orange-400 text-black p-3 rounded-full transition transform hover:scale-110 active:scale-95">
                   <Volume2 className="w-5 h-5" />
                 </button>
                 <div>
                   <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">Listen to Final Call</p>
                   <p className="text-sm text-white/70">"Captain Cool" voice output</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                 <button type="button" onClick={() => setLang('en')} className={`px-3 py-1 rounded text-sm font-bold ${lang === 'en' ? 'bg-orange-500 text-black' : 'text-white/60 hover:text-white'}`}>EN</button>
                 <button type="button" onClick={() => setLang('hi')} className={`px-3 py-1 rounded text-sm font-bold ${lang === 'hi' ? 'bg-orange-500 text-black' : 'text-white/60 hover:text-white'}`}>HI</button>
               </div>

               <div className="text-right">
                 <div className="text-xs text-white/50 mb-1">Captain's Confidence</div>
                 <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-orange-500 to-amber-300 w-[85%]"></div>
                 </div>
               </div>
             </div>
          )}
        </div>

      </main>
    </div>
  );
}
