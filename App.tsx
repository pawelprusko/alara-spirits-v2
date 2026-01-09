import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GameEngine } from './GameEngine';
import { WorkshopScreen } from './WorkshopScreen';
import { RiftGameEngine } from './RiftGameEngine';
import { AssetManager } from './components/AssetManager';
import { GameStatus, LevelConfig, GameStats, GeneralStats, GameEngineHandle, Essence, MetaState, Quest, CapturedSpirit, AssetMap, ClassType, QuestType } from './types';
import { INITIAL_LEVEL_CONFIG, THEMES, CLASS_CONFIGS, DEFAULT_ASSETS } from './constants';

// MEMOIZED GAME ENGINE WRAPPER TO PREVENT RE-RENDERS ON STAT UPDATES
const MemoizedGameEngine = React.memo(GameEngine);
const MemoizedRiftEngine = React.memo(RiftGameEngine);

const EssenceCard: React.FC<{ essence: Essence, compareTo: Essence, onSelect: () => void, assets: AssetMap }> = ({ essence, compareTo, onSelect, assets }) => {
    const getDiff = (val: number, base: number) => {
        const diff = val - base;
        if (diff === 0) return null;
        const percent = ((diff / base) * 100).toFixed(0);
        const color = diff > 0 ? 'text-green-400' : 'text-red-400';
        return <span className={`text-[10px] font-bold ${color} ml-1`}>{diff > 0 ? '+' : ''}{percent}%</span>;
    };

    const getSpeedDiff = (val: number, base: number) => {
         const diff = val - base;
         if (Math.abs(diff) < 0.01) return null;
         const percent = ((diff / base) * 100).toFixed(0);
         const color = diff > 0 ? 'text-green-400' : 'text-red-400';
         return <span className={`text-[10px] font-bold ${color} ml-1`}>{diff > 0 ? '+' : ''}{percent}%</span>;
    };

    const getChanceDiff = (val: number, base: number) => {
         const diff = val - base;
         const absDiff = Math.abs(diff);
         const displayVal = (absDiff * 100).toFixed(0);
         const isNegative = diff < -0.005; 
         const sign = isNegative ? '-' : '+';
         const color = isNegative ? 'text-red-400' : 'text-green-400';
         return <span className={`text-[10px] font-bold ${color} ml-1`}>({sign}{displayVal}%)</span>;
    };

    const chanceValue = (essence.stats.specialChance * 100).toFixed(0);
    const abilityNameMatch = essence.specialDescription.match(/<b>(.*?)<\/b>/);
    const abilityName = abilityNameMatch ? abilityNameMatch[1] : 'ABILITY';
    const cleanDesc = essence.specialDescription.replace(/<b>.*?<\/b>:\s*/, '');

    return (
        <div className={`bg-slate-900/95 border border-slate-600 rounded-xl p-2 flex flex-col gap-1 shadow-xl relative overflow-hidden transition-all hover:border-[#a855f7]/50 w-full flex-1 min-h-0`}>
            {/* Header: Icon + Name + Desc */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="w-10 h-10 relative flex items-center justify-center shrink-0 bg-slate-800 rounded-lg border border-slate-600 overflow-hidden shadow-inner">
                     <img src={assets[essence.spriteKeyBody]} className="w-full h-full object-contain scale-125" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-gothic font-bold text-sm text-slate-100 truncate tracking-wide">{essence.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight" dangerouslySetInnerHTML={{ __html: essence.description }}></p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="bg-slate-950/60 rounded-lg p-1.5 flex justify-between items-center border border-white/10 shrink-0 shadow-sm">
                 <div className="text-center flex-1">
                      <div className="text-sm font-black font-gothic leading-none text-slate-100 mb-0.5">
                          {essence.stats.damage}
                          {getDiff(essence.stats.damage, compareTo.stats.damage)}
                      </div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">DMG</div>
                 </div>
                 <div className="text-center flex-1 border-l border-white/10">
                      <div className="text-sm font-black font-gothic leading-none text-slate-100 mb-0.5">
                          {essence.stats.range}
                          {getDiff(essence.stats.range, compareTo.stats.range)}
                      </div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">RNG</div>
                 </div>
                 <div className="text-center flex-1 border-l border-white/10">
                      <div className="text-sm font-black font-gothic leading-none text-slate-100 mb-0.5">
                          {essence.stats.speed}
                          {getSpeedDiff(essence.stats.speed, compareTo.stats.speed)}
                      </div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">SPD</div>
                 </div>
            </div>

            {/* Ability Section */}
            <div className="bg-slate-950/40 rounded-lg p-1 border border-white/10 flex flex-col gap-0.5 shrink-0">
                 <div className="flex items-center justify-between border-b border-white/10 pb-0.5 mb-0.5">
                     <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{abilityName}</span>
                     <div className="text-[10px] font-mono text-[#a855f7] font-bold">
                         {chanceValue}%
                         {getChanceDiff(essence.stats.specialChance, compareTo.stats.specialChance)}
                     </div>
                 </div>
                 <p className="text-[10px] text-slate-300 leading-snug line-clamp-2" dangerouslySetInnerHTML={{ __html: cleanDesc }} />
            </div>

            {/* Button - Now closer to content */}
            <button 
                onClick={onSelect}
                className="w-full bg-[#1e293b] hover:bg-[#a855f7] hover:text-white text-emerald-400 font-bold py-2 rounded-lg border border-emerald-500/30 hover:border-transparent uppercase tracking-[0.15em] text-xs transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 group mt-auto"
            >
                <span className="group-hover:text-white">SELECT FORM</span>
            </button>
        </div>
    );
};

const SplashScreen = ({ assets, isFading }: { assets: AssetMap, isFading: boolean }) => {
    return (
        <div className={`absolute inset-0 z-[2000] bg-[#020617] flex items-center justify-center transition-all duration-1000 ease-in-out ${isFading ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <img 
                src={assets.splash_screen} 
                className="w-full h-full object-cover object-top animate-in fade-in zoom-in duration-1000"
                alt="Splash Screen"
            />
            {/* VERSION INDICATOR */}
            <div className="absolute bottom-12 left-0 right-0 text-center z-10 pointer-events-none">
                <span className="text-[10px] font-mono text-purple-300/40 tracking-[0.3em] uppercase">v1.3.6 FULLSCREEN</span>
            </div>
        </div>
    );
};

// --- TUTORIAL OVERLAY ---
const TutorialOverlay = ({ step, onNext, onDismiss }: { step: number, onNext: () => void, onDismiss: () => void }) => {
    if (step === 1) {
        return (
            <div className="absolute inset-0 z-[1500] bg-black/70 animate-in fade-in duration-300 pointer-events-auto">
                <div className="absolute bottom-[74px] right-[38px] pointer-events-none">
                     <div className="relative flex items-center justify-center w-12 h-12">
                         <div className="absolute inset-0 rounded-full border-4 border-[#a855f7] animate-ping opacity-50"></div>
                         <div className="absolute inset-0 rounded-full border-2 border-[#a855f7] shadow-[0_0_30px_#a855f7] bg-transparent"></div>
                     </div>
                </div>
                <div className="absolute bottom-[160px] right-4 left-4 md:left-auto md:w-[280px] bg-[#2e1065] border border-[#a855f7] p-4 rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.6)] flex flex-col items-center text-center animate-[bounce_3s_infinite]">
                    <div className="absolute -bottom-2 right-12 w-4 h-4 bg-[#2e1065] border-b border-r border-[#a855f7] rotate-45"></div>
                    <h3 className="text-[#a855f7] font-bold uppercase tracking-widest text-xs mb-1">Spirit Compass</h3>
                    <p className="text-white text-xs leading-relaxed mb-3">
                        This device resonates with energy. <br/>
                        <span className="text-[#d8b4fe] font-bold">Follow the arrow</span> to find the ghost.
                    </p>
                    <button onClick={onNext} className="bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-lg transition-transform active:scale-95 border border-white/20">
                        Next
                    </button>
                </div>
            </div>
        );
    }
    // STEP 2: WORKSHOP
    if (step === 2) {
        return (
            <div className="absolute inset-0 z-[1500] bg-black/70 animate-in fade-in duration-300 pointer-events-auto">
                <div className="absolute top-[16px] right-[16px] pointer-events-none">
                     <div className="relative flex items-center justify-center w-14 h-14">
                         <div className="absolute inset-0 rounded-full border-4 border-[#a855f7] animate-ping opacity-50"></div>
                         <div className="absolute inset-0 rounded-full border-2 border-[#a855f7] shadow-[0_0_30px_#a855f7] bg-transparent"></div>
                     </div>
                </div>
                <div className="absolute top-[90px] right-4 left-4 md:left-auto md:w-[280px] bg-[#2e1065] border border-[#a855f7] p-4 rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.6)] flex flex-col items-center text-center animate-[bounce_3s_infinite]">
                    <div className="absolute -top-2 right-6 w-4 h-4 bg-[#2e1065] border-t border-l border-[#a855f7] rotate-45"></div>
                    <h3 className="text-[#a855f7] font-bold uppercase tracking-widest text-xs mb-1">Hero's Workshop</h3>
                    <p className="text-white text-xs leading-relaxed mb-3">
                        Tap here to teleport to the <span className="text-[#d8b4fe] font-bold">Menu</span>.<br/>
                        Upgrade spirits and craft items there.
                    </p>
                    <button onClick={onDismiss} className="bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-lg transition-transform active:scale-95 border border-white/20">
                        Let's Go!
                    </button>
                </div>
            </div>
        );
    }
    return null;
};

const EctoIcon = ({ className }: { className?: string }) => (
    <div className={`rounded-full bg-purple-900 border border-purple-400 flex items-center justify-center relative overflow-hidden shadow-[0_0_10px_#a855f7] ${className || 'w-6 h-6'}`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 to-fuchsia-500 opacity-80"></div>
        <div className="w-[40%] h-[40%] bg-white rounded-full blur-[1px] shadow-[0_0_5px_white]"></div>
    </div>
);

// --- HUD COMPONENT ---
// ZMIANA: Dodano `pt-[max(1rem,env(safe-area-inset-top))]`, aby interfejs odsunął się od góry telefonu (notcha)
const TopHUD = ({ score, ectoplasm, levelConfig, onWorkshopClick, assets, quests, isRift, riftCaptured, riftTarget }: { score: number, ectoplasm: number, levelConfig: LevelConfig, onWorkshopClick: () => void, assets: AssetMap, quests: Quest[], isRift: boolean, riftCaptured: number, riftTarget: number }) => (
    <div className="absolute top-0 left-0 right-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] z-[100] flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto">
            {!isRift && (
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg">
                    <EctoIcon className="w-5 h-5" />
                    <span className="font-gothic font-bold text-lg text-white">{ectoplasm}</span>
                </div>
            )}
        </div>

        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 top-4 pt-[env(safe-area-inset-top)] w-full max-w-[200px]">
            <h1 className={`font-gothic text-lg tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-90 text-center leading-none mb-1 truncate w-full ${isRift ? 'text-red-500 font-bold' : 'text-slate-200'}`}>
                {isRift ? "Secret Dimension" : levelConfig.theme.name}
            </h1>
            <div className="flex justify-center gap-2 w-full">
                {isRift ? (
                     <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-red-500 bg-red-950/80 transition-colors shadow-[0_0_10px_red]">
                        <span className="text-sm">👻</span>
                        <span className="text-[10px] font-bold text-red-100 uppercase tracking-widest mr-1">CAPTURED:</span>
                        <span className="font-mono font-bold text-white text-xs">{riftCaptured}/{riftTarget}</span>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-1">
                        {quests.map(q => (
                            <div key={q.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${q.completed ? 'bg-green-900/80 border-green-500' : 'bg-slate-950/80 border-slate-700'} backdrop-blur-sm`}>
                                <span className="text-xs">
                                    {q.type === 'KILL_COUNT' && '⚔️'}
                                    {q.type === 'COLLECT_ECTO' && <EctoIcon className="w-2.5 h-2.5" />}
                                    {q.type === 'CATCH_GHOST' && '👻'}
                                </span>
                                <span className={`text-[9px] font-bold font-mono ${q.completed ? 'text-green-100' : 'text-slate-300'}`}>
                                    {q.progress}/{q.target}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
            {!isRift && (
                <button 
                    onClick={onWorkshopClick}
                    className="bg-[#0f172a]/80 backdrop-blur-md w-14 h-14 flex items-center justify-center rounded-full hover:bg-[#1e293b] transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 group cursor-pointer relative overflow-hidden" 
                    aria-label="Open Workshop"
                >
                    <div className="absolute inset-0 rounded-full border border-white/20 shadow-[0_0_10px_rgba(168,85,247,0.4)]"></div>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="group-hover:drop-shadow-[0_0_8px_#a855f7] transition-all relative z-10 scale-110">
                        <path d="M6 21H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M7 21V8H17V21" fill="#a855f7" stroke="white" strokeWidth="1.5"/> 
                        <path d="M5 8V4H8V6H10V4H14V6H16V4H19V8H5Z" fill="#a855f7" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                        <rect x="10.5" y="11" width="3" height="5" rx="1.5" fill="#334155" stroke="white" strokeWidth="1"/>
                    </svg>
                </button>
            )}
        </div>
    </div>
);

// --- FIXED LOADING SCREEN ---
const LoadingScreen = ({ isRift = false, levelConfig, quests, assets, progress, riftConfig }: { isRift?: boolean, levelConfig: LevelConfig, quests: Quest[], assets: AssetMap, progress: number, riftConfig?: any }) => {
    const reward = isRift ? 200 : 30 + (levelConfig.levelNumber * 2);
    const totalPlayers = isRift ? riftConfig.players : 1;
    const playersFound = Math.min(totalPlayers, 1 + Math.floor((progress / 100) * totalPlayers));
    
    // IMPORTANT: bg-slate-950 and Z-index ensure this covers the game during loading
    return (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950 text-[#f0f9ff] p-6 overflow-hidden w-full h-full">
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${isRift ? 'from-red-900/40' : 'from-slate-800'} to-slate-950 opacity-100`}></div>
            
            <div className="w-32 h-32 mb-6 opacity-100 animate-[bounce_3s_infinite] relative z-10">
                <img src={isRift ? assets.spiritRed : assets.loadingGhost} className={`w-full h-full object-contain ${isRift ? 'drop-shadow-[0_0_20px_red]' : ''}`} />
            </div>

            <h2 className={`text-3xl font-gothic mb-2 uppercase tracking-[0.25em] text-center relative z-10 drop-shadow-md ${isRift ? 'text-red-500' : 'text-[#a855f7]'}`}>
                {isRift ? "Secret Dimension" : (levelConfig.theme?.name || "Unknown Realm")}
            </h2>
            
            <div className={`relative z-10 bg-slate-900/80 border p-4 rounded-xl mb-4 w-full max-w-xs backdrop-blur-sm ${isRift ? 'border-red-900' : 'border-slate-700'}`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center border-b border-slate-700 pb-2">Mission Goals</h3>
                <div className="space-y-2">
                    {isRift ? (
                        <div className="text-center text-sm text-slate-300">
                            Push <span className="text-red-400 font-bold">{riftConfig.target} Spirits</span> into the Tesla Coil to stabilize the rift.
                        </div>
                    ) : (
                        quests.map(q => (
                            <div key={q.id} className="flex items-center justify-between text-sm">
                                <span className="text-slate-300 flex items-center gap-2">
                                    {q.type === 'KILL_COUNT' && '⚔️'}
                                    {q.type === 'COLLECT_ECTO' && <EctoIcon className="w-3 h-3" />}
                                    {q.type === 'CATCH_GHOST' && '👻'}
                                    {q.description}
                                </span>
                                <span className={`font-mono ${isRift ? 'text-red-400' : 'text-[#a855f7]'}`}>{q.target}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isRift && (
                <div className="relative z-10 w-full max-w-xs mb-4">
                     <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Waiting for other players to join...</h3>
                     <div className="flex justify-center gap-4">
                        {Array.from({ length: totalPlayers }).map((_, i) => {
                            const isFound = i < playersFound;
                            const colors = ['#ef4444', '#22d3ee', '#facc15']; 
                            const color = colors[i % 3];
                            return (
                                <div key={i} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isFound ? `border-[${color}] bg-slate-800` : 'border-slate-800 bg-slate-950 opacity-50'}`} style={{borderColor: isFound ? color : '#1e293b'}}>
                                    {isFound ? (
                                        <span className="text-xl animate-pulse" style={{color: color}}>
                                            {i === 0 ? '👤' : (i===1 ? '🛡️' : '⚡')}
                                        </span>
                                    ) : (
                                        <span className="text-slate-700 text-xs">...</span>
                                    )}
                                </div>
                            );
                        })}
                     </div>
                </div>
            )}

            <div className={`relative z-10 p-3 rounded-lg w-full max-w-xs flex items-center justify-between backdrop-blur-sm ${isRift ? 'bg-red-950/60 border border-red-500/50' : 'bg-[#2e1065]/60 border border-[#a855f7]/50'}`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${isRift ? 'text-red-200' : 'text-[#d8b4fe]'}`}>Potential Reward</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xl font-gothic drop-shadow-[0_0_5px] ${isRift ? 'text-white shadow-red-500' : 'text-white shadow-[#a855f7]'}`}>{reward}</span>
                    <EctoIcon className="w-5 h-5" />
                </div>
            </div>
            
            <div className={`w-64 h-2 bg-[#1e293b] relative mt-8 overflow-hidden rounded-full border z-10 ${isRift ? 'border-red-900' : 'border-[#a855f7]/30'}`}>
                <div 
                    className={`h-full bg-gradient-to-r shadow-[0_0_15px] transition-all duration-75 ease-out ${isRift ? 'from-red-900 to-red-500 shadow-red-500' : 'from-[#6b21a8] to-[#d8b4fe] shadow-[#a855f7]'}`} 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    );
};

const EssenceSelectionScreen = ({ options, onSelect, assets, caughtSpiritName, currentEssence, quests, levelNumber }: { options: [Essence, Essence] | null, onSelect: (e: Essence) => void, assets: AssetMap, caughtSpiritName: string, currentEssence: Essence, quests: Quest[], levelNumber: number }) => {
    const sideQuestsDone = quests
        .filter(q => q.type !== 'CATCH_GHOST')
        .every(q => q.progress >= q.target);

    const isSuccess = sideQuestsDone;
    
    let calculatedReward = 0;
    if (isSuccess) {
        const questRewards = quests.reduce((acc, q) => acc + q.reward, 0);
        const levelBonus = 30 + (levelNumber * 2);
        calculatedReward = questRewards + levelBonus;
    }

    return (
        <div className="absolute inset-0 z-50 bg-[#020617]/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden pt-[env(safe-area-inset-top)]">
            <div className="flex-none mb-2 px-4 mt-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-[#1e293b] border border-[#a855f7] flex items-center justify-center shadow-[0_0_15px_#a855f7]">
                        <img src={assets.loadingGhost} className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-[#d8b4fe] tracking-[0.2em] uppercase block">Spirit Contained</span>
                        <h1 className="text-2xl font-gothic font-bold text-white drop-shadow-[0_0_10px_#a855f7] leading-none">{caughtSpiritName}</h1>
                    </div>
                </div>
                
                <div className="bg-[#1e1b4b]/60 border border-blue-500/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-100 leading-tight">
                        <span className="font-bold text-blue-400 block mb-1 uppercase tracking-widest text-[10px]">Instability Detected</span>
                        Current vessel cannot contain this power. <span className="text-[#a855f7] font-bold">Choose a new form.</span>
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 min-h-0 justify-center px-4 pb-2">
                {options?.map((opt) => (
                     <EssenceCard key={opt.id} essence={opt} compareTo={currentEssence} onSelect={() => onSelect(opt)} assets={assets} />
                 ))}
            </div>

            <div className="shrink-0 bg-gradient-to-r from-purple-900/80 to-slate-900/90 border-t border-purple-500/30 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-between items-center shadow-[0_-5px_30px_rgba(168,85,247,0.3)]">
                <div>
                    <h3 className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5 ${!isSuccess ? 'text-orange-300' : 'text-purple-200'}`}>Mission Status</h3>
                    <div className="flex items-center gap-2">
                         {isSuccess ? (
                             <span className="text-emerald-400 font-bold text-[10px] bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-500/30">READY FOR TRANSFER</span>
                         ) : (
                             <span className="text-orange-400 font-bold text-[10px] bg-orange-900/30 px-2 py-0.5 rounded border border-orange-500/30">OBJECTIVES PENDING</span>
                         )}
                    </div>
                </div>
                
                {isSuccess ? (
                    <div className="text-right">
                         <div className="text-[10px] text-purple-200 uppercase tracking-widest font-bold">Total Bounty</div>
                         <div className="text-xl font-gothic text-white drop-shadow-[0_0_5px_#a855f7] flex items-center justify-end gap-1">
                             +{calculatedReward} <EctoIcon className="w-5 h-5" />
                         </div>
                    </div>
                ) : (
                    <div className="text-right opacity-50">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Bounty Locked</div>
                        <div className="text-xs text-slate-500 font-mono">Complete Quests</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const App: React.FC = () => {
    // STATE
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.SPLASH);
    const [assets, setAssets] = useState<AssetMap>(DEFAULT_ASSETS);
    const [metaState, setMetaState] = useState<MetaState>(() => {
        try {
            const saved = localStorage.getItem('alara_meta');
            return saved ? JSON.parse(saved) : { ectoplasm: 0, inventory: [], unlockedRecipes: [] };
        } catch (e) {
            return { ectoplasm: 0, inventory: [], unlockedRecipes: [] };
        }
    });
    
    // GAME CONFIG STATE
    const [levelConfig, setLevelConfig] = useState<LevelConfig>(INITIAL_LEVEL_CONFIG);
    const [currentEssence, setCurrentEssence] = useState<Essence>(CLASS_CONFIGS.SCIENTIST);
    const [quests, setQuests] = useState<Quest[]>([]);
    
    // STATS
    const [gameStats, setGameStats] = useState<GameStats>({
        ghostHealth: 3000, maxGhostHealth: 3000, compassAngle: 0, timeRemaining: 60, totalTime: 60, isCapturing: false
    });
    const [generalStats, setGeneralStats] = useState<GeneralStats>({
        catcherPower: 100, essencePower: 100, dropChance: 10, dimensionRift: 5
    });
    
    // UI FLAGS
    const [showAssetManager, setShowAssetManager] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [caughtSpiritName, setCaughtSpiritName] = useState("Unknown Spirit");
    const [essenceOptions, setEssenceOptions] = useState<[Essence, Essence] | null>(null);
    const [floatingMessages, setFloatingMessages] = useState<{id: number, text: string, icon?: string}[]>([]);

    // RIFT STATE
    const [riftStats, setRiftStats] = useState({ time: 0, captured: 0, totalTime: 60 });

    // REFS
    const gameEngineRef = useRef<GameEngineHandle>(null);

    // Initial Load & Splash Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setGameStatus(GameStatus.MENU);
            if (!localStorage.getItem('alara_tutorial_done')) {
                setTutorialStep(1);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Persist Meta State
    useEffect(() => {
        localStorage.setItem('alara_meta', JSON.stringify(metaState));
    }, [metaState]);

    const showFloatingMessage = useCallback((text: string, icon?: string, duration: number = 2000) => {
        const id = Math.random();
        setFloatingMessages(prev => [...prev, { id, text, icon }]);
        setTimeout(() => {
            setFloatingMessages(prev => prev.filter(m => m.id !== id));
        }, duration);
    }, []);

    // Helpers
    const generateQuests = (level: number): Quest[] => {
        return [
            { id: 'q1', type: 'CATCH_GHOST', target: 1, progress: 0, completed: false, description: "Capture the Spirit", reward: 50 + level * 10 },
            { id: 'q2', type: 'KILL_COUNT', target: 3 + Math.floor(level/2), progress: 0, completed: false, description: "Banish Minions", reward: 30 + level * 5 },
            { id: 'q3', type: 'COLLECT_ECTO', target: 5 + level, progress: 0, completed: false, description: "Collect Ectoplasm", reward: 20 + level * 5 }
        ];
    };

    const startGame = () => {
        setGameStatus(GameStatus.LOADING);
        setLoadingProgress(0);
        
        // Setup Level
        const newLevelConfig = { ...levelConfig }; 
        // Pick random theme that isn't DIMENSION
        const validThemes = THEMES.filter(t => t.type !== 'DIMENSION');
        newLevelConfig.theme = validThemes[Math.floor(Math.random() * validThemes.length)];
        setLevelConfig(newLevelConfig);
        setQuests(generateQuests(newLevelConfig.levelNumber));

        // Simulate Loading
        const interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setGameStatus(GameStatus.PLAYING);
                    if (tutorialStep === 1) setTutorialStep(0); 
                    return 100;
                }
                return prev + 5;
            });
        }, 50);
    };

    const handleLevelComplete = (success: boolean) => {
        if (success) {
            setCaughtSpiritName("Volatile Spirit");
            // Generate options based on randomness
            const keys = Object.keys(CLASS_CONFIGS) as ClassType[];
            const opt1 = CLASS_CONFIGS[keys[Math.floor(Math.random() * keys.length)]];
            const opt2 = CLASS_CONFIGS[keys[Math.floor(Math.random() * keys.length)]];
            setEssenceOptions([opt1, opt2]);
            setGameStatus(GameStatus.ESSENCE_SELECTION);
        } else {
            // Failed, return to workshop
            setGameStatus(GameStatus.WORKSHOP);
        }
    };

    const handleEssenceSelect = (newEssence: Essence) => {
        setCurrentEssence(newEssence);
        
        // Calculate total rewards
        const totalReward = quests.reduce((acc, q) => acc + (q.completed ? q.reward : 0), 0) + 100;
        
        setMetaState(prev => ({
             ...prev,
             ectoplasm: prev.ectoplasm + totalReward,
             inventory: [...prev.inventory, { 
                 id: Date.now().toString(), 
                 tier: 1, 
                 name: caughtSpiritName, 
                 powerValue: 50, 
                 dateCaught: Date.now() 
             }]
        }));
        
        // Advance Level
        setLevelConfig(prev => ({
            ...prev,
            levelNumber: prev.levelNumber + 1,
            monsterCount: Math.min(20, prev.monsterCount + 1)
        }));
        
        setGameStatus(GameStatus.WORKSHOP);
    };

    const handleQuestProgress = (type: QuestType, amount: number = 1) => {
        setQuests(prev => prev.map(q => {
            if (q.type === type && !q.completed) {
                const newProgress = Math.min(q.target, q.progress + amount);
                return { ...q, progress: newProgress, completed: newProgress >= q.target };
            }
            return q;
        }));
    };

    const handleRiftComplete = (success: boolean) => {
        if (success) {
            setMetaState(prev => ({
                ...prev,
                ectoplasm: prev.ectoplasm + 500, // Big reward
                inventory: [...prev.inventory, {
                    id: `rift-${Date.now()}`,
                    tier: 3, // Reward a tier 3 spirit
                    name: "Rift Walker",
                    powerValue: 300,
                    dateCaught: Date.now()
                }]
            }));
            showFloatingMessage("RIFT CLOSED - REWARD CLAIMED", "🌌");
        } else {
            showFloatingMessage("RIFT COLLAPSED", "💀");
        }
        setGameStatus(GameStatus.WORKSHOP);
    };

    const handleOpenAssetManager = () => {
        setShowAssetManager(true);
    };

    const handleSaveAssets = (newAssets: AssetMap) => {
        setAssets(newAssets);
    };

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#0f172a]">
            {/* GLOBAL UI LAYERS */}
            {gameStatus === GameStatus.SPLASH && (
                <SplashScreen assets={assets} isFading={false} />
            )}

            {gameStatus === GameStatus.LOADING && (
                <LoadingScreen 
                    levelConfig={levelConfig} 
                    quests={quests} 
                    assets={assets} 
                    progress={loadingProgress} 
                />
            )}

            {gameStatus === GameStatus.ESSENCE_SELECTION && (
                <EssenceSelectionScreen 
                    options={essenceOptions} 
                    onSelect={handleEssenceSelect} 
                    assets={assets}
                    caughtSpiritName={caughtSpiritName}
                    currentEssence={currentEssence}
                    quests={quests}
                    levelNumber={levelConfig.levelNumber}
                />
            )}

            {gameStatus === GameStatus.WORKSHOP && (
                <>
                    {showAssetManager && (
                        <AssetManager 
                            currentAssets={assets} 
                            onSaveAssets={handleSaveAssets} 
                            onClose={() => setShowAssetManager(false)} 
                        />
                    )}
                    <WorkshopScreen 
                        metaState={metaState}
                        onUpdateMeta={setMetaState}
                        onExit={() => setGameStatus(GameStatus.SPLASH)} 
                        onPlay={startGame}
                        assets={assets}
                        onOpenAssetManager={handleOpenAssetManager}
                        showFloatingMessage={showFloatingMessage}
                        currentEssence={currentEssence}
                        generalStats={generalStats}
                    />
                </>
            )}

            {/* GAME ENGINES */}
            {gameStatus === GameStatus.PLAYING && (
                <>
                    <TopHUD 
                        score={0} 
                        ectoplasm={metaState.ectoplasm}
                        levelConfig={levelConfig}
                        onWorkshopClick={() => gameEngineRef.current?.triggerWorkshopTransition()}
                        assets={assets}
                        quests={quests}
                        isRift={false}
                        riftCaptured={0}
                        riftTarget={0}
                    />
                    <TutorialOverlay 
                        step={tutorialStep} 
                        onNext={() => setTutorialStep(2)} 
                        onDismiss={() => {
                            setTutorialStep(0);
                            localStorage.setItem('alara_tutorial_done', 'true');
                        }} 
                    />
                    <MemoizedGameEngine
                        ref={gameEngineRef}
                        gameStatus={gameStatus}
                        levelConfig={levelConfig}
                        generalStats={generalStats}
                        onStatsUpdate={setGameStats}
                        onLevelComplete={handleLevelComplete}
                        onGhostCaught={() => {}}
                        onItemCollect={() => {
                            setMetaState(prev => ({...prev, ectoplasm: prev.ectoplasm + 10}));
                            handleQuestProgress('COLLECT_ECTO', 1);
                        }}
                        showFloatingMessage={showFloatingMessage}
                        onWorkshopOpen={() => setGameStatus(GameStatus.WORKSHOP)}
                        onEnterRift={() => {
                            setGameStatus(GameStatus.RIFT_INTRO);
                            setTimeout(() => setGameStatus(GameStatus.RIFT), 2000); // Fake load
                        }}
                        currentEssence={currentEssence}
                        onQuestProgress={handleQuestProgress}
                        assets={assets}
                        paused={tutorialStep > 0}
                    />
                </>
            )}

            {gameStatus === GameStatus.RIFT_INTRO && (
                 <LoadingScreen 
                    isRift={true}
                    levelConfig={levelConfig} 
                    quests={[]} 
                    assets={assets} 
                    progress={100} 
                    riftConfig={{ target: 20, players: 1 }}
                />
            )}

            {gameStatus === GameStatus.RIFT && (
                <>
                    <TopHUD 
                        score={0}
                        ectoplasm={metaState.ectoplasm}
                        levelConfig={levelConfig}
                        onWorkshopClick={() => {}}
                        assets={assets}
                        quests={[]}
                        isRift={true}
                        riftCaptured={riftStats.captured}
                        riftTarget={20}
                    />
                    <MemoizedRiftEngine
                        onComplete={handleRiftComplete}
                        showFloatingMessage={showFloatingMessage}
                        currentEssence={currentEssence}
                        onStatsUpdate={setRiftStats}
                        targetScore={20}
                        playerCount={1}
                        assets={assets}
                    />
                </>
            )}
            
            {/* FLOATING MESSAGES CONTAINER */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 pointer-events-none z-[9999] flex flex-col gap-2">
                {floatingMessages.map(msg => (
                    <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-slate-900/90 text-white px-4 py-2 rounded-full border border-slate-700 shadow-xl flex items-center gap-2">
                        {msg.icon && <span className="text-xl">{msg.icon}</span>}
                        <span className="font-gothic font-bold text-sm tracking-wide">{msg.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
