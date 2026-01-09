import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameEngine } from './GameEngine';
import { WorkshopScreen } from './WorkshopScreen';
import { RiftGameEngine } from './RiftGameEngine';
import { AssetManager } from './components/AssetManager';
import { GameStatus, LevelConfig, GameStats, GeneralStats, GameEngineHandle, Essence, MetaState, Quest, CapturedSpirit, AssetMap, ClassType } from './types';
import { INITIAL_LEVEL_CONFIG, POINTS_PER_GHOST, THEMES, CLASS_CONFIGS, DEFAULT_ASSETS, LEVEL_ADJECTIVES, LEVEL_NOUNS } from './constants';

const MemoizedGameEngine = React.memo(GameEngine);
const MemoizedRiftEngine = React.memo(RiftGameEngine);

// --- COMPONENTS ---

const EssenceCard: React.FC<{ essence: Essence, compareTo: Essence, onSelect: () => void, assets: AssetMap }> = ({ essence, compareTo, onSelect, assets }) => {
    const getDiff = (val: number, base: number) => {
        const diff = val - base;
        if (diff === 0) return null;
        const percent = ((diff / base) * 100).toFixed(0);
        const color = diff > 0 ? 'text-green-400' : 'text-red-400';
        return <span className={`text-[10px] font-bold ${color} ml-1`}>{diff > 0 ? '+' : ''}{percent}%</span>;
    };

    const abilityName = essence.specialDescription.match(/<b>(.*?)<\/b>/)?.[1] || 'ABILITY';
    const cleanDesc = essence.specialDescription.replace(/<b>.*?<\/b>:\s*/, '');

    return (
        <div className="bg-slate-900/95 border border-slate-600 rounded-xl p-2 flex flex-col gap-1.5 shadow-xl w-full flex-1 min-h-0">
            <div className="flex items-center gap-2 shrink-0">
                <div className="w-10 h-10 relative flex items-center justify-center shrink-0 bg-slate-800 rounded-lg border border-slate-600 overflow-hidden">
                     <img src={assets[essence.spriteKeyBody]} className="w-full h-full object-contain scale-125" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-gothic font-bold text-sm text-slate-100 truncate">{essence.name}</h4>
                    <p className="text-[10px] text-slate-400 leading-tight" dangerouslySetInnerHTML={{ __html: essence.description }}></p>
                </div>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-1.5 flex justify-between items-center border border-white/10 shrink-0">
                 <div className="text-center flex-1">
                      <div className="text-sm font-black font-gothic text-slate-100">{essence.stats.damage}{getDiff(essence.stats.damage, compareTo.stats.damage)}</div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold">DMG</div>
                 </div>
                 <div className="text-center flex-1 border-l border-white/10">
                      <div className="text-sm font-black font-gothic text-slate-100">{essence.stats.range}{getDiff(essence.stats.range, compareTo.stats.range)}</div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold">RNG</div>
                 </div>
                 <div className="text-center flex-1 border-l border-white/10">
                      <div className="text-sm font-black font-gothic text-slate-100">{essence.stats.speed}</div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold">SPD</div>
                 </div>
            </div>
            <div className="bg-slate-950/40 rounded-lg p-1.5 border border-white/10 flex flex-col gap-0.5 shrink-0">
                 <div className="flex justify-between items-center border-b border-white/10 pb-0.5">
                     <span className="text-[10px] text-slate-300 font-bold uppercase">{abilityName}</span>
                     <span className="text-[10px] font-mono text-[#a855f7] font-bold">{(essence.stats.specialChance * 100).toFixed(0)}%</span>
                 </div>
                 <p className="text-[10px] text-slate-300 leading-snug line-clamp-2" dangerouslySetInnerHTML={{ __html: cleanDesc }} />
            </div>
            <button onClick={onSelect} className="w-full bg-[#1e293b] hover:bg-[#a855f7] text-emerald-400 font-bold py-2.5 rounded-lg border border-emerald-500/30 uppercase text-xs mt-auto">
                SELECT FORM
            </button>
        </div>
    );
};

const SplashScreen = ({ assets, isFading }: { assets: AssetMap, isFading: boolean }) => (
    <div className={`absolute inset-0 z-[2000] bg-[#020617] flex items-center justify-center transition-all duration-1000 ease-in-out ${isFading ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}>
        <img src={assets.splash_screen} className="w-full h-full object-cover object-top" alt="Splash Screen" />
        <div className="absolute bottom-12 left-0 right-0 text-center z-10 pointer-events-none">
            <span className="text-[10px] font-mono text-purple-300/40 tracking-[0.3em] uppercase">v1.4.3 FINAL FIX</span>
        </div>
    </div>
);

const TutorialOverlay = ({ step, onNext, onDismiss }: { step: number, onNext: () => void, onDismiss: () => void }) => {
    if (step === 1) return (
        <div className="absolute inset-0 z-[1500] bg-black/70 animate-in fade-in pointer-events-auto">
            <div className="absolute bottom-[160px] right-4 left-4 bg-[#2e1065] border border-[#a855f7] p-4 rounded-xl flex flex-col items-center text-center">
                <h3 className="text-[#a855f7] font-bold uppercase text-xs mb-1">Spirit Compass</h3>
                <p className="text-white text-xs mb-3">Follow the arrow to find the ghost.</p>
                <button onClick={onNext} className="bg-[#a855f7] text-white text-xs font-bold px-6 py-2 rounded-full uppercase">Next</button>
            </div>
        </div>
    );
    if (step === 2) return (
        <div className="absolute inset-0 z-[1500] bg-black/70 animate-in fade-in pointer-events-auto">
            <div className="absolute top-[90px] right-4 left-4 bg-[#2e1065] border border-[#a855f7] p-4 rounded-xl flex flex-col items-center text-center">
                <h3 className="text-[#a855f7] font-bold uppercase text-xs mb-1">Hero's Workshop</h3>
                <p className="text-white text-xs mb-3">Tap top-right to upgrade spirits.</p>
                <button onClick={onDismiss} className="bg-[#a855f7] text-white text-xs font-bold px-6 py-2 rounded-full uppercase">Let's Go!</button>
            </div>
        </div>
    );
    return null;
};

const TopHUD = ({ score, ectoplasm, levelConfig, onWorkshopClick, quests, isRift, riftCaptured, riftTarget }: any) => (
    <div className="absolute top-0 left-0 right-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] z-[100] flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
            {!isRift && (
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700 rounded-full px-3 py-1.5 backdrop-blur-md">
                    <span className="font-gothic font-bold text-lg text-white text-shadow-sm">{ectoplasm} 🟣</span>
                </div>
            )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-4 pt-[env(safe-area-inset-top)] flex flex-col items-center">
            <h1 className={`font-gothic text-lg tracking-wider drop-shadow-md text-center leading-none mb-1 ${isRift ? 'text-red-500 font-bold' : 'text-slate-200'}`}>
                {isRift ? "Secret Dimension" : levelConfig.theme.name}
            </h1>
            <div className="flex justify-center gap-1">
                {isRift ? (
                     <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-red-500 bg-red-950/80">
                        <span className="font-mono font-bold text-white text-xs">Captured: {riftCaptured}/{riftTarget}</span>
                    </div>
                ) : (
                    quests.map((q: Quest) => (
                        <div key={q.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${q.completed ? 'bg-green-900/80 border-green-500' : 'bg-slate-950/80 border-slate-700'}`}>
                            <span className={`text-[9px] font-bold font-mono ${q.completed ? 'text-green-100' : 'text-slate-300'}`}>{q.progress}/{q.target}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
        <div className="pointer-events-auto">
            {!isRift && (
                <button onClick={onWorkshopClick} className="bg-[#0f172a]/80 w-12 h-12 flex items-center justify-center rounded-full border border-slate-600 shadow-lg">
                    <span className="text-xl">🏰</span>
                </button>
            )}
        </div>
    </div>
);

const LoadingScreen = ({ isRift = false, levelConfig, quests, assets, progress, riftConfig }: any) => (
    <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950 text-[#f0f9ff] p-6">
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${isRift ? 'from-red-900/40' : 'from-slate-800'} to-slate-950`}></div>
        <div className="w-32 h-32 mb-6 animate-bounce relative z-10">
            <img src={isRift ? assets.spiritRed : assets.loadingGhost} className="w-full h-full object-contain" />
        </div>
        <h2 className={`text-2xl font-gothic mb-2 uppercase tracking-widest relative z-10 ${isRift ? 'text-red-500' : 'text-[#a855f7]'}`}>
            {isRift ? "Secret Dimension" : levelConfig.theme?.name}
        </h2>
        <div className="w-64 h-2 bg-[#1e293b] relative mt-8 rounded-full border border-white/10 z-10">
            <div className={`h-full bg-gradient-to-r ${isRift ? 'from-red-900 to-red-500' : 'from-[#6b21a8] to-[#d8b4fe]'}`} style={{ width: `${progress}%` }} />
        </div>
    </div>
);

const EssenceSelectionScreen = ({ options, onSelect, assets, caughtSpiritName, currentEssence, quests, levelNumber }: any) => {
    const sideQuestsDone = quests.filter((q: any) => q.type !== 'CATCH_GHOST').every((q: any) => q.progress >= q.target);
    const reward = sideQuestsDone ? quests.reduce((acc: number, q: any) => acc + q.reward, 0) + 30 + (levelNumber * 2) : 0;

    return (
        <div className="absolute inset-0 z-50 bg-[#020617]/95 backdrop-blur-md flex flex-col animate-in fade-in pt-[env(safe-area-inset-top)]">
            <div className="flex-none py-4 border-b border-purple-500/20 bg-slate-900/50 text-center">
                <span className="text-[10px] font-bold text-[#d8b4fe] tracking-[0.2em] uppercase block">Spirit Contained</span>
                <h1 className="text-2xl font-gothic font-bold text-white">{caughtSpiritName}</h1>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center px-4 py-4 overflow-y-auto">
                {options?.map((opt: Essence) => (
                     <EssenceCard key={opt.id} essence={opt} compareTo={currentEssence} onSelect={() => onSelect(opt)} assets={assets} />
                 ))}
            </div>
            <div className="p-4 bg-slate-900 border-t border-purple-500/30 flex justify-between items-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <div className="text-white font-gothic text-lg">{sideQuestsDone ? 'SUCCESS' : 'PARTIAL SUCCESS'}</div>
                {sideQuestsDone && <div className="text-2xl font-bold text-white">+{reward} 🟣</div>}
            </div>
        </div>
    );
};

const BottomPanel = ({ stats, levelConfig, isRift }: any) => {
    const rotationDeg = (stats.compassAngle * 180 / Math.PI) + 90;
    const maxTime = stats.totalTime || (isRift ? 30 : levelConfig.timeLimit);
    const timePercentage = Math.max(0, Math.min(100, (stats.timeRemaining / maxTime) * 100));

    return (
      <div className="absolute bottom-8 left-4 right-4 h-auto flex items-end justify-center z-20 pointer-events-none pb-[env(safe-area-inset-bottom)]">
          <div className="w-full backdrop-blur-md p-4 rounded-3xl border border-white/10 bg-[#0f172a]/80 shadow-2xl flex items-center gap-4">
              <div className="flex-1 flex flex-col gap-2">
                  <span className={`text-[10px] font-gothic tracking-widest ${isRift ? 'text-red-400' : 'text-slate-200'}`}>DIMENSION COLLAPSE</span>
                  <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#020617] rounded-full overflow-hidden border border-white/10">
                          <div className={`h-full bg-gradient-to-r ${isRift ? 'from-red-600 to-orange-500' : 'from-amber-500 to-yellow-400'}`} style={{ width: `${timePercentage}%` }}></div>
                      </div>
                      <span className="text-[10px] w-8 text-right text-white font-mono">{Math.ceil(stats.timeRemaining)}s</span>
                  </div>
              </div>
              {!isRift && (
                  <>
                      <div className="w-px h-10 bg-white/10"></div>
                      <div className="flex flex-col items-center w-12">
                          <div className="w-10 h-10 relative flex items-center justify-center border rounded-full border-teal-500/30">
                              <div className="w-full h-full flex items-center justify-center transition-transform duration-100" style={{ transform: `rotate(${rotationDeg}deg)` }}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 21L12 17L20 21L12 2Z" fill="#a855f7" stroke="white" strokeWidth="1"/></svg>
                              </div>
                          </div>
                      </div>
                  </>
              )}
          </div>
      </div>
    );
};

export const App = () => {
  const [assets, setAssets] = useState<AssetMap>(DEFAULT_ASSETS);
  const [showAssetManager, setShowAssetManager] = useState(false);

  useEffect(() => {
      const stored = localStorage.getItem('custom_game_assets');
      if (stored) {
          try {
              setAssets({ ...DEFAULT_ASSETS, ...JSON.parse(stored) });
          } catch (e) { console.error("Failed to load assets", e); }
      }
  }, []);

  const handleUpdateAssets = (newAssets: AssetMap) => {
      const customs: AssetMap = {};
      Object.keys(newAssets).forEach(k => { if (newAssets[k] !== DEFAULT_ASSETS[k]) customs[k] = newAssets[k]; });
      localStorage.setItem('custom_game_assets', JSON.stringify(customs));
      setAssets(newAssets);
  };

  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.SPLASH);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(INITIAL_LEVEL_CONFIG);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState<{text: string, icon?: string, id: number} | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const engineRef = useRef<GameEngineHandle>(null);
  const loadingIntervalRef = useRef<any>(null); 
  const lastThemeTypeRef = useRef<string | null>(null); 
  
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
      const seen = localStorage.getItem('alara_tutorial_seen');
      if (seen) setHasSeenTutorial(true);
  }, []);

  const handleDismissTutorial = () => {
      setTutorialStep(0);
      setHasSeenTutorial(true);
      localStorage.setItem('alara_tutorial_seen', 'true');
  };

  const [riftWinState, setRiftWinState] = useState<'WIN' | 'LOSS' | null>(null);
  const [riftConfig, setRiftConfig] = useState({ target: 10, players: 3 });
  const [metaState, setMetaState] = useState<MetaState>({ ectoplasm: 0, inventory: [], unlockedRecipes: [] });
  const [quests, setQuests] = useState<Quest[]>([]);
  const questsRef = useRef<Quest[]>(quests);
  
  useEffect(() => { questsRef.current = quests; }, [quests]);

  const [caughtSpiritName, setCaughtSpiritName] = useState<string>("Unknown Entity");
  const [currentEssence, setCurrentEssence] = useState<Essence>(CLASS_CONFIGS.SCIENTIST);
  const [pendingOptions, setPendingOptions] = useState<[Essence, Essence] | null>(null);
  const [generalStats, setGeneralStats] = useState<GeneralStats>({ catcherPower: 120, essencePower: 88, dropChance: 75, dimensionRift: 25 });
  const [stats, setStats] = useState<GameStats>({ ghostHealth: 1, maxGhostHealth: 1, compassAngle: 0, timeRemaining: 0, totalTime: 45, isCapturing: false });
  const [riftCapturedCount, setRiftCapturedCount] = useState(0);

  const showFloatingMessage = (text: string, icon?: string) => {
    setMessage({ text, icon, id: Date.now() });
    setTimeout(() => setMessage(c => (c && c.text === text ? null : c)), 2500);
  };

  const handleQuestProgress = useCallback((type: any, amount = 1) => {
      setQuests(prev => {
          const next = prev.map(q => {
              if (q.type === type) {
                  const newProg = Math.min(q.target, q.progress + amount);
                  return { ...q, progress: newProg, completed: newProg >= q.target };
              }
              return q;
          });
          questsRef.current = next;
          return next;
      });
  }, []);

  const handleItemCollect = useCallback(() => {
     handleQuestProgress('COLLECT_ECTO', 1);
     setMetaState(p => ({ ...p, ectoplasm: p.ectoplasm + 10 }));
     showFloatingMessage("+10 Ecto", "🟣");
  }, [handleQuestProgress]);

  const generateQuests = (level: number): Quest[] => {
      return [
          { id: 'q1', type: 'KILL_COUNT', target: 5 + Math.floor(level/2), progress: 0, completed: false, description: 'Purge Monsters', reward: 15 },
          { id: 'q2', type: 'COLLECT_ECTO', target: 3 + Math.floor(level/3), progress: 0, completed: false, description: 'Gather Essence', reward: 20 },
          { id: 'q3', type: 'CATCH_GHOST', target: 1, progress: 0, completed: false, description: 'Capture Spirit', reward: 50 }
      ];
  };

  useEffect(() => { setQuests(generateQuests(INITIAL_LEVEL_CONFIG.levelNumber)); }, []);

  const startLevelLoad = useCallback(() => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setRiftWinState(null);
      setGameStatus(GameStatus.LOADING); 
      setLoadingProgress(0);
      setPendingOptions(null);
      setRiftCapturedCount(0);
      setMessage(null);
      
      const availableThemes = THEMES.filter(t => t.type !== 'DIMENSION');
      let candidates = availableThemes.filter(t => t.type !== lastThemeTypeRef.current);
      if (candidates.length === 0) candidates = availableThemes;
      const nextTheme = candidates[Math.floor(Math.random() * candidates.length)];
      lastThemeTypeRef.current = nextTheme.type;
      
      const randomName = `${LEVEL_ADJECTIVES[Math.floor(Math.random() * LEVEL_ADJECTIVES.length)]} ${LEVEL_NOUNS[Math.floor(Math.random() * LEVEL_NOUNS.length)]}`;
      
      setLevelConfig(prev => ({
          ...prev,
          theme: { ...nextTheme, name: randomName },
          levelNumber: prev.levelNumber + 1,
          monsterCount: Math.min(50, prev.monsterCount + 3), 
          timeLimit: 45,
      }));
      setQuests(generateQuests(levelConfig.levelNumber + 1));
      
      let prog = 0;
      loadingIntervalRef.current = setInterval(() => {
          prog += 2; 
          setLoadingProgress(prog);
          if (prog >= 100) {
              clearInterval(loadingIntervalRef.current);
              loadingIntervalRef.current = null;
              setGameStatus(GameStatus.PLAYING);
              if (!hasSeenTutorial && !localStorage.getItem('alara_tutorial_seen')) {
                  setTimeout(() => setTutorialStep(1), 1000); 
              }
          }
      }, 30);
  }, [levelConfig.levelNumber, hasSeenTutorial]);

  useEffect(() => {
      if (gameStatus === GameStatus.SPLASH) {
          const waitTimer = setTimeout(() => {
              // DIRECTLY TRIGGER LOAD AFTER SPLASH
              startLevelLoad(); 
              setSplashFading(true);
              setTimeout(() => setShowSplash(false), 1000);
          }, 2000); 
          return () => clearTimeout(waitTimer);
      }
  }, [gameStatus, startLevelLoad]);

  const handleGhostCaught = () => {
      handleQuestProgress('CATCH_GHOST', 1);
      setCaughtSpiritName("Volatile Spirit");
      const opt1 = { ...CLASS_CONFIGS.SCIENTIST, id: 'opt1' }; 
      const opt2 = { ...CLASS_CONFIGS.MONK, id: 'opt2' };
      setPendingOptions([opt1, opt2]);
      setGameStatus(GameStatus.ESSENCE_SELECTION);
  };

  const handleLevelComplete = useCallback((success: boolean) => {
    if (success) {
        setScore(prev => prev + POINTS_PER_GHOST);
        startLevelLoad();
    } else {
        startLevelLoad();
    }
  }, [startLevelLoad]);

  const handleEssenceChoice = (selectedEssence: Essence) => {
      setCurrentEssence(selectedEssence);
      engineRef.current?.triggerTransformation();
      engineRef.current?.triggerLevelTransition(); 
      setGameStatus(GameStatus.PLAYING);
  };

  const handleRiftComplete = useCallback((success: boolean) => {
      setMessage(null); 
      setRiftWinState(success ? 'WIN' : 'LOSS');
  }, []);

  const handleEnterRift = useCallback(() => {
      setGameStatus(GameStatus.RIFT_INTRO);
      setLoadingProgress(0);
      setRiftConfig({ players: 3, target: 15 });
      let prog = 0;
      const interval = setInterval(() => {
          prog += 2;
          setLoadingProgress(prog);
          if (prog >= 100) {
              clearInterval(interval);
              setGameStatus(GameStatus.RIFT);
          }
      }, 40); 
  }, []);

  return (
    // FIX: Using fixed inset-0 ensures full screen coverage on mobile
    <div className="fixed inset-0 w-full h-full bg-[#0f172a] font-sans select-none overflow-hidden touch-none">
        <div className="w-full h-full relative">
            {/* Top HUD */}
            {gameStatus !== GameStatus.LOADING && gameStatus !== GameStatus.RIFT_INTRO && gameStatus !== GameStatus.WORKSHOP && gameStatus !== GameStatus.SPLASH && !showSplash &&
              <TopHUD 
                score={score} 
                ectoplasm={metaState.ectoplasm} 
                levelConfig={levelConfig} 
                onWorkshopClick={() => engineRef.current?.triggerWorkshopTransition()}
                assets={assets}
                quests={quests}
                isRift={gameStatus === GameStatus.RIFT}
                riftCaptured={riftCapturedCount}
                riftTarget={riftConfig.target}
              />
            }
            
            {message && !riftWinState && (
              <div className="absolute top-24 left-0 right-0 text-center z-[300] pointer-events-none flex justify-center">
                  <span className="inline-flex items-center gap-2 text-xs font-gothic text-white px-6 py-2 shadow-lg uppercase tracking-widest rounded-full border border-white/20 animate-bounce backdrop-blur-md bg-[#a855f7]/90">
                      {message.text}
                  </span>
              </div>
            )}
            
            {tutorialStep > 0 && <TutorialOverlay step={tutorialStep} onNext={() => setTutorialStep(2)} onDismiss={handleDismissTutorial} />}

            {/* Game Canvas Layer */}
            <div className="absolute inset-0 w-full h-full bg-[#0f172a]">
                {gameStatus === GameStatus.RIFT ? (
                    <MemoizedRiftEngine 
                        onComplete={handleRiftComplete}
                        showFloatingMessage={showFloatingMessage}
                        currentEssence={currentEssence}
                        onStatsUpdate={(s: any) => { setStats(prev => ({...prev, timeRemaining: s.time})); setRiftCapturedCount(s.captured); }}
                        targetScore={riftConfig.target}
                        playerCount={riftConfig.players}
                        assets={assets}
                    />
                ) : (
                    // Always render Engine to keep context alive, overlay hides it during loading
                    <MemoizedGameEngine 
                        ref={engineRef}
                        gameStatus={gameStatus} 
                        levelConfig={levelConfig}
                        generalStats={generalStats}
                        onStatsUpdate={setStats}
                        onLevelComplete={handleLevelComplete}
                        onGhostCaught={handleGhostCaught}
                        onItemCollect={handleItemCollect}
                        showFloatingMessage={showFloatingMessage}
                        onWorkshopOpen={() => setGameStatus(GameStatus.WORKSHOP)} 
                        onEnterRift={handleEnterRift}
                        currentEssence={currentEssence}
                        onQuestProgress={handleQuestProgress}
                        assets={assets}
                        paused={tutorialStep > 0 || gameStatus !== GameStatus.PLAYING}
                    />
                )}
            </div>

            {/* UI Overlays */}
            {showSplash && <SplashScreen assets={assets} isFading={splashFading} />}
            
            {(gameStatus === GameStatus.LOADING || gameStatus === GameStatus.SPLASH) && (
                <LoadingScreen levelConfig={levelConfig} quests={quests} assets={assets} progress={loadingProgress} />
            )}
            
            {gameStatus === GameStatus.RIFT_INTRO && <LoadingScreen isRift={true} levelConfig={levelConfig} quests={quests} assets={assets} progress={loadingProgress} riftConfig={riftConfig} />}
            
            {gameStatus === GameStatus.WORKSHOP && (
                <WorkshopScreen 
                    metaState={metaState}
                    onUpdateMeta={setMetaState}
                    onExit={() => startLevelLoad()} 
                    onPlay={startLevelLoad}
                    assets={assets}
                    onOpenAssetManager={() => setShowAssetManager(true)}
                    showFloatingMessage={showFloatingMessage}
                    currentEssence={currentEssence}
                    generalStats={generalStats}
                />
            )}
            
            {gameStatus === GameStatus.ESSENCE_SELECTION && 
              <EssenceSelectionScreen 
                options={pendingOptions} 
                onSelect={handleEssenceChoice} 
                assets={assets} 
                caughtSpiritName={caughtSpiritName}
                currentEssence={currentEssence}
                quests={quests}
                levelNumber={levelConfig.levelNumber}
              />
            }
            
            {/* Rift Modals */}
            {riftWinState === 'WIN' && (
                <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6">
                    <h2 className="text-3xl font-gothic text-red-500 mb-4">VICTORY</h2>
                    <button onClick={() => { setMetaState(p => ({...p, ectoplasm: p.ectoplasm + 200})); setRiftWinState(null); startLevelLoad(); }} className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold uppercase">Claim Reward</button>
                </div>
            )}
            {riftWinState === 'LOSS' && (
                <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6">
                    <h2 className="text-3xl font-gothic text-slate-500 mb-4">DEFEAT</h2>
                    <button onClick={() => startLevelLoad()} className="bg-slate-700 text-white px-8 py-4 rounded-xl font-bold uppercase">Run Away</button>
                </div>
            )}
            
            {showAssetManager && (
                <AssetManager 
                    currentAssets={assets} 
                    onSaveAssets={handleUpdateAssets} 
                    onClose={() => setShowAssetManager(false)} 
                />
            )}
            
            {/* Bottom Panel */}
            {gameStatus !== GameStatus.LOADING && 
             gameStatus !== GameStatus.RIFT_INTRO &&
             gameStatus !== GameStatus.WORKSHOP && 
             !showSplash &&
             <BottomPanel stats={stats} levelConfig={levelConfig} isRift={gameStatus === GameStatus.RIFT} />
            }
        </div>
    </div>
  );
}
