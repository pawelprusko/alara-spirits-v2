
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GameEngine } from './GameEngine';
import { WorkshopScreen } from './WorkshopScreen';
import { RiftGameEngine } from './RiftGameEngine';
import { AssetManager } from './components/AssetManager';
import { GameStatus, LevelConfig, GameStats, GeneralStats, GameEngineHandle, Essence, MetaState, Quest, CapturedSpirit, AssetMap, ClassType } from './types';
import { INITIAL_LEVEL_CONFIG, POINTS_PER_GHOST, THEMES, CLASS_CONFIGS, DEFAULT_ASSETS, LEVEL_ADJECTIVES, LEVEL_NOUNS } from './constants';

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
        <div className={`bg-slate-900/95 border border-slate-600 rounded-xl p-3 flex flex-col gap-2 shadow-xl relative overflow-hidden transition-all hover:border-[#a855f7]/50 w-full flex-1 min-h-0`}>
            {/* Header: Icon + Name + Desc */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="w-12 h-12 relative flex items-center justify-center shrink-0 bg-slate-800 rounded-lg border border-slate-600 overflow-hidden shadow-inner">
                     <img src={assets[essence.spriteKeyBody]} className="w-full h-full object-contain scale-125" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-gothic font-bold text-base text-slate-100 truncate tracking-wide">{essence.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight" dangerouslySetInnerHTML={{ __html: essence.description }}></p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="bg-slate-950/60 rounded-lg p-2 flex justify-between items-center border border-white/10 shrink-0 shadow-sm">
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
            <div className="bg-slate-950/40 rounded-lg p-2 border border-white/10 flex flex-col gap-1 shrink-0">
                 <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-0.5">
                     <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{abilityName}</span>
                     <div className="text-[10px] font-mono text-[#a855f7] font-bold">
                         {chanceValue}%
                         {getChanceDiff(essence.stats.specialChance, compareTo.stats.specialChance)}
                     </div>
                 </div>
                 <p className="text-[10px] text-slate-300 leading-snug line-clamp-2" dangerouslySetInnerHTML={{ __html: cleanDesc }} />
            </div>

            {/* Button - Modern Flat Style (No Outline) */}
            <button 
                onClick={onSelect}
                className="w-full bg-[#0f172a] hover:bg-[#a855f7] hover:text-white text-emerald-400 font-bold py-3 rounded-lg uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 group mt-1"
            >
                <span className="group-hover:text-white transition-colors">SELECT FORM</span>
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
                <span className="text-[10px] font-mono text-purple-300/40 tracking-[0.3em] uppercase">v1.4.7 UI TWEAK</span>
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
                    className="bg-[#0f172a]/80 backdrop-blur-md w-14 h-14 flex items-center justify-center rounded-full hover:bg-[#1e293b] transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 group cursor-pointer relative overflow-hidden border border-white/20" 
                    aria-label="Open Workshop"
                >
                    {/* RESTORED PURPLE TOWER SVG ICON */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="group-hover:drop-shadow-[0_0_8px_#a855f7] transition-all relative z-10 scale-110">
                        <path d="M4 21H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M6 21V8H18V21" fill="#a855f7" stroke="white" strokeWidth="1.5"/>
                        <path d="M4 8V4H7V6H9V4H12V6H15V4H17V6H20V8H4Z" fill="#a855f7" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                        <rect x="10" y="12" width="4" height="5" rx="1" fill="#1e293b" stroke="white" strokeWidth="1.5"/>
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
            <div className="flex-none flex flex-col items-center justify-center py-2 mb-1 border-b border-[#a855f7]/20 bg-slate-900/50">
                <span className="text-[10px] font-bold text-[#d8b4fe] tracking-[0.2em] uppercase mb-1">Spirit Contained</span>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e293b] border border-[#a855f7] flex items-center justify-center shadow-[0_0_15px_#a855f7]">
                        <img src={assets.loadingGhost} className="w-7 h-7 object-contain" />
                    </div>
                    <h1 className="text-2xl font-gothic font-bold text-white drop-shadow-[0_0_10px_#a855f7]">{caughtSpiritName}</h1>
                </div>
            </div>
            
            <div className="flex-none mb-1 px-4 text-center">
                {/* Cleaned up Instability Section - No BG, No Border */}
                <p className="text-xs text-blue-200/80 leading-tight">
                    <span className="font-bold text-blue-400 block mb-0.5 uppercase tracking-widest text-[10px]">Instability Detected</span>
                    Current vessel cannot contain this power. <span className="text-[#a855f7] font-bold">Choose a new form.</span>
                </p>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 min-h-0 justify-center px-4 pb-2">
                {options?.map((opt) => (
                     <EssenceCard key={opt.id} essence={opt} compareTo={currentEssence} onSelect={() => onSelect(opt)} assets={assets} />
                 ))}
            </div>

            {/* EXPANDED MISSION STATUS PANEL - UPDATED MAGIC STYLE - COMPACT */}
            <div className="shrink-0 bg-gradient-to-r from-[#2e1065] to-[#4c1d95] border-t border-[#a855f7]/50 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-4 shadow-[0_-10px_40px_rgba(168,85,247,0.6)] z-20">
                <div className="flex items-center justify-center mb-1.5 relative">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#d8b4fe]/50 to-transparent flex-1"></div>
                    <h3 className="mx-4 text-[10px] font-bold text-[#e9d5ff] uppercase tracking-[0.3em] drop-shadow-md">Mission Status</h3>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#d8b4fe]/50 to-transparent flex-1"></div>
                </div>
                
                <div className="flex justify-between items-center pb-2">
                    {/* Status Text - Smaller font */}
                    <div className="flex flex-col">
                         <div className={`text-base font-gothic font-black uppercase tracking-wide ${isSuccess ? 'text-[#a7f3d0] drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'text-amber-300'}`}>
                             {isSuccess ? 'COMPLETE SUCCESS' : 'PARTIAL SUCCESS'}
                         </div>
                         <p className="text-[9px] text-[#ddd6fe] opacity-80">
                             {isSuccess ? 'All objectives completed.' : 'Some objectives were missed.'}
                         </p>
                    </div>

                    {/* Reward Box - Compact */}
                    <div className="flex flex-col items-end">
                         <span className="text-[8px] uppercase tracking-widest text-[#d8b4fe] font-bold mb-0.5">Reward</span>
                         <div className={`bg-[#1e1b4b]/60 border ${isSuccess ? 'border-[#d8b4fe]/50' : 'border-slate-500/30'} px-2 py-1 rounded-lg flex items-center gap-2 shadow-inner`}>
                             <span className={`text-lg font-bold font-gothic ${isSuccess ? 'text-white' : 'text-slate-400'}`}>
                                 {isSuccess ? `+${calculatedReward}` : '0'}
                             </span>
                             <EctoIcon className={`w-4 h-4 ${!isSuccess && 'grayscale opacity-50'}`} />
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BottomPanel = ({ stats, levelConfig, isRift }: { stats: GameStats, levelConfig: LevelConfig, isRift: boolean }) => {
    const rotationDeg = (stats.compassAngle * 180 / Math.PI) + 90;
    const spiritProgress = Math.max(0, Math.min(100, (1 - (stats.ghostHealth / stats.maxGhostHealth)) * 100));
    
    const maxTime = stats.totalTime || (isRift ? 30 : levelConfig.timeLimit);
    const timePercentage = Math.max(0, Math.min(100, (stats.timeRemaining / maxTime) * 100));

    // KEY FIX: Use env(safe-area-inset-bottom) to handle iPhone Home Bar vs Android correctly
    // Android: env() is 0px -> bottom is 1rem (16px)
    // iPhone: env() is ~34px -> bottom is 1rem + 34px (50px)
    // This allows the panel to 'jump' over the home indicator on iOS but stay compact on Android.
    return (
      <div 
        className="absolute left-4 right-4 h-auto flex items-end justify-center z-20 pointer-events-none"
        style={{ bottom: '10px' }}
      >
          <div className={`w-full backdrop-blur-md p-4 rounded-3xl border shadow-[0_0_30px_rgba(0,0,0,0.6)] flex items-center gap-4 ${isRift ? 'bg-[#0f172a]/60 border-white/10' : 'bg-[#0f172a]/60 border-white/10'}`}>
              <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-gothic tracking-widest drop-shadow-md ml-1 ${isRift ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                          DIMENSION COLLAPSE
                      </span>
                      <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#020617]/60 rounded-full overflow-hidden relative border border-white/5">
                              {/* Removed transition-all duration-100 to fix stuttering/rubber-banding */}
                              <div className={`h-full bg-gradient-to-r shadow-[0_0_10px] ${isRift ? 'from-red-600 to-orange-500 shadow-red-500' : 'from-[#f59e0b] to-[#fbbf24] shadow-[#f59e0b]'}`} style={{ width: `${timePercentage}%` }}></div>
                          </div>
                          <span className={`text-[10px] font-gothic tracking-widest w-8 text-right ${isRift ? 'text-red-200' : 'text-slate-200'}`}>{Math.ceil(stats.timeRemaining)}s</span>
                      </div>
                  </div>
                  {!isRift && (
                      <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-gothic text-slate-200 tracking-widest drop-shadow-md ml-1">SPIRIT ESSENCE</span>
                          <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-[#020617]/60 rounded-full overflow-hidden relative border border-white/5">
                                  <div className="h-full bg-gradient-to-r from-[#9333ea] to-[#d8b4fe] shadow-[0_0_10px_#a855f7] transition-all duration-300 ease-linear" style={{ width: `${spiritProgress}%` }}></div>
                              </div>
                              <span className="text-[10px] font-gothic text-slate-200 tracking-widest w-8 text-right">{Math.floor(spiritProgress)}%</span>
                          </div>
                      </div>
                  )}
              </div>
              {!isRift && (
                  <>
                      <div className="w-px h-12 bg-white/10"></div>
                      <div className="flex flex-col items-center justify-center shrink-0 w-16">
                          <div className="w-12 h-12 relative flex items-center justify-center mb-1">
                              <div className="absolute inset-0 rounded-full border border-[#5eead4]/30 shadow-[0_0_10px_rgba(94,234,212,0.2)]"></div>
                              <div className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out" style={{ transform: `rotate(${rotationDeg}deg)` }}>
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_0_5px_#a855f7]"><path d="M12 2L4 21L12 17L20 21L12 2Z" fill="#a855f7" stroke="#fff" strokeWidth="1.5"/></svg>
                              </div>
                          </div>
                          <div className="flex flex-col items-center leading-none mt-1">
                              <span className="text-[10px] font-gothic text-slate-200 tracking-widest drop-shadow-md">SPIRIT</span>
                              <span className="text-[10px] font-gothic text-slate-200 tracking-widest drop-shadow-md">DIRECTION</span>
                          </div>
                      </div>
                  </>
              )}
          </div>
      </div>
    );
};

export default function App() {
  const [assets, setAssets] = useState<AssetMap>(DEFAULT_ASSETS);
  const [showAssetManager, setShowAssetManager] = useState(false);

  useEffect(() => {
      const stored = localStorage.getItem('custom_game_assets');
      if (stored) {
          try {
              setAssets({ ...DEFAULT_ASSETS, ...JSON.parse(stored) });
          } catch (e) { console.error("Failed to load custom assets", e); }
      }
  }, []);

  // --- DYNAMIC APP ICON & MANIFEST UPDATE ---
  useEffect(() => {
      const iconUrl = assets['app_icon'];
      if (!iconUrl) return;

      // 1. Update Favicon
      const linkIcon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (linkIcon) linkIcon.href = iconUrl;

      // 2. Update Apple Touch Icon (iOS)
      const linkApple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (linkApple) linkApple.href = iconUrl;

      // 3. Update Manifest (Android PWA)
      const linkManifest = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (linkManifest) {
          const dynamicManifest = {
              name: "Alara Spirits",
              short_name: "Alara Spirits",
              start_url: "/",
              scope: "/",
              display: "standalone",
              background_color: "#0f172a",
              theme_color: "#0f172a",
              orientation: "portrait",
              icons: [
                  {
                      src: iconUrl,
                      sizes: "192x192",
                      type: "image/png", 
                      purpose: "any maskable"
                  },
                  {
                      src: iconUrl,
                      sizes: "512x512",
                      type: "image/png",
                      purpose: "any maskable"
                  }
              ]
          };
          const stringManifest = JSON.stringify(dynamicManifest);
          const blob = new Blob([stringManifest], {type: 'application/json'});
          const manifestURL = URL.createObjectURL(blob);
          linkManifest.href = manifestURL;
      }
  }, [assets]); // Updates whenever assets change (initially or via AssetManager)

  const handleUpdateAssets = (newAssets: AssetMap) => {
      const customs: AssetMap = {};
      Object.keys(newAssets).forEach(k => {
          if (newAssets[k] !== DEFAULT_ASSETS[k]) customs[k] = newAssets[k];
      });
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
  const lastThemeTypeRef = useRef<string | null>(null); // To prevent repeat levels
  
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

  const handleNextTutorial = () => {
      setTutorialStep(prev => prev + 1);
  };
  
  const [riftWinState, setRiftWinState] = useState<'WIN' | 'LOSS' | null>(null);
  const [riftConfig, setRiftConfig] = useState({ target: 10, players: 3 });
  
  const [metaState, setMetaState] = useState<MetaState>({ 
      ectoplasm: 0, 
      inventory: [], 
      unlockedRecipes: [] 
  });
  
  const [quests, setQuests] = useState<Quest[]>([]);
  // Use Ref to track quests for fresh access in callbacks
  const questsRef = useRef<Quest[]>(quests);
  
  // NOTE: This effect is fine for initial mount, but we need synchronous updates in handleQuestProgress
  useEffect(() => { questsRef.current = quests; }, [quests]);

  const [caughtSpiritName, setCaughtSpiritName] = useState<string>("Unknown Entity");
  const [currentEssence, setCurrentEssence] = useState<Essence>(() => {
      const base = CLASS_CONFIGS.SCIENTIST;
      return { ...base, stats: { ...base.stats, specialChance: 0.25 } };
  });
  const [pendingOptions, setPendingOptions] = useState<[Essence, Essence] | null>(null);
  const [generalStats, setGeneralStats] = useState<GeneralStats>({ catcherPower: 120, essencePower: 88, dropChance: 75, dimensionRift: 25 });
  const [stats, setStats] = useState<GameStats>({ ghostHealth: 1, maxGhostHealth: 1, compassAngle: 0, timeRemaining: 0, totalTime: 45, isCapturing: false });
  const [riftCapturedCount, setRiftCapturedCount] = useState(0);
  
  // Removed lastMissionReward state as it's now calculated in render
  
  const showFloatingMessage = (text: string, icon?: string, duration: number = 2500) => {
    setMessage({ text, icon, id: Date.now() });
    setTimeout(() => setMessage(current => (current && current.text === text ? null : current)), duration);
  };

  const handleQuestProgress = useCallback((type: 'KILL_COUNT' | 'COLLECT_ECTO' | 'CATCH_GHOST', amount: number = 1) => {
      setQuests(prev => {
          const nextQuests = prev.map(q => {
              if (q.type === type) {
                  // Simply increment and clamp to target. Removed toast & instant reward.
                  const newProg = Math.min(q.target, q.progress + amount);
                  return { ...q, progress: newProg, completed: newProg >= q.target };
              }
              return q;
          });
          questsRef.current = nextQuests;
          return nextQuests;
      });
  }, []);

  const handleItemCollect = useCallback(() => {
     // 50% chance for CLASS BOOST, 50% chance for MASTERY BOOST
     const roll = Math.random();
     
     if (roll < 0.5) {
         // CLASS STATS
         const stats = ['damage', 'range', 'speed'];
         const chosenStat = stats[Math.floor(Math.random() * stats.length)] as keyof Essence['stats'];
         let boost = 0;
         let label = '';

         if (chosenStat === 'damage') { boost = 5; label = 'DMG'; }
         else if (chosenStat === 'range') { boost = 5; label = 'RNG'; }
         else if (chosenStat === 'speed') { boost = 0.05; label = 'SPD'; }

         setCurrentEssence(prev => {
             const newStats = { ...prev.stats };
             if (chosenStat === 'speed') newStats[chosenStat] = parseFloat((newStats[chosenStat] + boost).toFixed(2));
             else newStats[chosenStat] += boost;
             return { ...prev, stats: newStats };
         });
         showFloatingMessage(`${label} +${chosenStat === 'speed' ? (boost*100).toFixed(0) + '%' : boost}`, "⚡", 1500);
     } else {
         // GENERAL MASTERY STATS
         const stats = ['catcherPower', 'essencePower', 'dropChance', 'dimensionRift'];
         const chosenStat = stats[Math.floor(Math.random() * stats.length)] as keyof GeneralStats;
         let boost = 0;
         let label = '';
         
         if (chosenStat === 'catcherPower') { boost = 5; label = 'Catcher Power'; }
         else if (chosenStat === 'essencePower') { boost = 5; label = 'Essence Power'; }
         else if (chosenStat === 'dropChance') { boost = 1; label = 'Drop Chance'; }
         else if (chosenStat === 'dimensionRift') { boost = 1; label = 'Rift Resonance'; }
         
         setGeneralStats(prev => ({
             ...prev,
             [chosenStat]: prev[chosenStat] + boost
         }));
         const valDisplay = (chosenStat === 'dropChance' || chosenStat === 'dimensionRift') ? `${boost}%` : boost;
         showFloatingMessage(`${label} +${valDisplay}`, "🔮", 1500);
     }

     handleQuestProgress('COLLECT_ECTO', 1);
  }, [handleQuestProgress]);

  const generateQuests = (level: number): Quest[] => {
      const q1: Quest = { id: 'q1', type: 'KILL_COUNT', target: 5 + Math.floor(level/2), progress: 0, completed: false, description: 'Purge Monsters', reward: 15 };
      const q2: Quest = { id: 'q2', type: 'COLLECT_ECTO', target: 3 + Math.floor(level/3), progress: 0, completed: false, description: 'Gather Essence', reward: 20 };
      const q3: Quest = { id: 'q3', type: 'CATCH_GHOST', target: 1, progress: 0, completed: false, description: 'Capture Spirit', reward: 50 };
      return [q1, q2, q3];
  };

  // Init quests on mount so Loading Screen has content
  useEffect(() => {
      setQuests(generateQuests(INITIAL_LEVEL_CONFIG.levelNumber));
  }, []);

  const startLevelLoad = useCallback(() => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setRiftWinState(null);
      setGameStatus(GameStatus.LOADING); 
      setLoadingProgress(0);
      setPendingOptions(null);
      setRiftCapturedCount(0);
      
      // Clear any messages when starting new level
      setMessage(null);
      
      // Select Next Theme (Avoiding immediate repeat)
      const availableThemes = THEMES.filter(t => t.type !== 'DIMENSION');
      let candidates = availableThemes.filter(t => t.type !== lastThemeTypeRef.current);
      // Fallback if filtering removed everything (shouldn't happen with 3 themes)
      if (candidates.length === 0) candidates = availableThemes;
      
      const nextTheme = candidates[Math.floor(Math.random() * candidates.length)];
      lastThemeTypeRef.current = nextTheme.type;

      const randomName = `${LEVEL_ADJECTIVES[Math.floor(Math.random() * LEVEL_ADJECTIVES.length)]} ${LEVEL_NOUNS[Math.floor(Math.random() * LEVEL_NOUNS.length)]}`;
      const nextThemeWithName = { ...nextTheme, name: randomName };
      
      setLevelConfig(prev => ({
          ...prev,
          theme: nextThemeWithName,
          levelNumber: prev.levelNumber + 1,
          monsterCount: Math.min(50, prev.monsterCount + 3), 
          // FIXED: Use 45s as requested
          timeLimit: 45,
      }));
      setQuests(generateQuests(levelConfig.levelNumber + 1));
      
      // Simulate Loading
      let prog = 0;
      loadingIntervalRef.current = setInterval(() => {
          prog += 1; 
          setLoadingProgress(prog);
          if (prog >= 100) {
              if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
              loadingIntervalRef.current = null;
              setGameStatus(GameStatus.PLAYING);
              
              if (!hasSeenTutorial && !localStorage.getItem('alara_tutorial_seen')) {
                  setTimeout(() => setTutorialStep(1), 1500); 
              }
          }
      }, 30);
  }, [levelConfig.levelNumber, gameStatus, hasSeenTutorial]);

  useEffect(() => {
      // INITIAL SPLASH LOGIC
      if (gameStatus === GameStatus.SPLASH) {
          const waitTimer = setTimeout(() => {
              // Start loading BEHIND the splash screen so when it fades, loading screen is there
              startLevelLoad(); 
              setSplashFading(true);
              
              setTimeout(() => {
                  setShowSplash(false);
              }, 1000); // Wait for fade out
          }, 2000); // Show splash for 2s
          
          return () => clearTimeout(waitTimer);
      }
  }, [gameStatus, startLevelLoad]);

  const generateGhostName = () => {
      const adjectives = ["Restless", "Vengeful", "Silent", "Crimson", "Hollow", "Static", "Ancient", "Dark", "Echoing"];
      const types = ["Wisp", "Wraith", "Phantom", "Poltergeist", "Specter", "Shadow", "Spirit"];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      return `${adj} ${type}`;
  };

  const handleGhostCaught = () => {
      handleQuestProgress('CATCH_GHOST', 1);
      setCaughtSpiritName(generateGhostName());
      setMessage(null);
      
      const availableClasses: ClassType[] = ['SCIENTIST', 'MONK', 'THIEF'];
      
      // Pick 2 random classes (different from each other)
      const idx1 = Math.floor(Math.random() * availableClasses.length);
      let idx2 = Math.floor(Math.random() * availableClasses.length);
      while (idx1 === idx2) {
          idx2 = Math.floor(Math.random() * availableClasses.length);
      }
      
      const type1 = availableClasses[idx1];
      const type2 = availableClasses[idx2];
      
      const base1 = CLASS_CONFIGS[type1];
      const base2 = CLASS_CONFIGS[type2];

      const opt1: Essence = { 
          ...base1, 
          id: `gen_${Date.now()}_1`, 
          stats: { 
              ...base1.stats, 
              damage: Math.floor(base1.stats.damage * (0.9 + Math.random() * 0.4)),
              range: Math.floor(base1.stats.range * (0.9 + Math.random() * 0.2)),
              speed: parseFloat((base1.stats.speed * (0.95 + Math.random() * 0.1)).toFixed(2))
          } 
      };
      
      const opt2: Essence = { 
          ...base2, 
          id: `gen_${Date.now()}_2`, 
          stats: { 
              ...base2.stats, 
              damage: Math.floor(base2.stats.damage * (0.9 + Math.random() * 0.4)),
              range: Math.floor(base2.stats.range * (0.9 + Math.random() * 0.2)),
              speed: parseFloat((base2.stats.speed * (0.95 + Math.random() * 0.1)).toFixed(2))
          } 
      };
      
      setPendingOptions([opt1, opt2]);
      setGameStatus(GameStatus.ESSENCE_SELECTION);
  };

  const handleLevelComplete = useCallback((success: boolean) => {
    // If in RIFT mode, handle win/loss specifically without autorestarting
    // We cannot reliably access gameStatus state in this callback if it's stale, 
    // but the engine calls this correctly.
    
    // Note: We need to check if we are currently in RIFT mode. 
    // Since we can't easily access the fresh `gameStatus` here inside the closure without deps,
    // we rely on the component that calls this.
    
    if (success) {
        // RECALCULATE REWARD ONE FINAL TIME FOR INVENTORY UPDATE
        // Using ref to get the absolute latest state
        const currentQuests = questsRef.current;
        const sideQuestsDone = currentQuests
            .filter(q => q.type !== 'CATCH_GHOST')
            .every(q => q.progress >= q.target);
        
        let reward = 0;
        if (sideQuestsDone) {
            const questRewards = currentQuests.reduce((acc, q) => acc + q.reward, 0);
            const levelBonus = 30 + (levelConfig.levelNumber * 2);
            reward = questRewards + levelBonus;
            setScore(prev => prev + POINTS_PER_GHOST);
        }
        
        const newSpirit: CapturedSpirit = {
            id: `spirit-${Date.now()}`,
            tier: Math.random() > 0.8 ? 2 : 1, 
            name: caughtSpiritName, // This might be stale if not updated, but it's set in handleGhostCaught
            powerValue: 10 + Math.floor(Math.random() * 10),
            dateCaught: Date.now()
        };

        // Consolidated update for atomicity
        setMetaState(prev => ({ 
            ...prev, 
            ectoplasm: prev.ectoplasm + reward,
            inventory: [...prev.inventory, newSpirit] 
        }));
        
        startLevelLoad();
    } else {
        startLevelLoad();
    }
  }, [caughtSpiritName, levelConfig.levelNumber, startLevelLoad]); // Added dependencies

  const handleEssenceChoice = (selectedEssence: Essence) => {
      setCurrentEssence(selectedEssence);
      if (engineRef.current) {
          engineRef.current.triggerTransformation();
          engineRef.current.triggerLevelTransition(); 
      }
      setGameStatus(GameStatus.PLAYING);
  };

  const handleStatsUpdate = useCallback((newStats: GameStats) => setStats(newStats), []);
  // UPDATED SIGNATURE TO MATCH RIFT ENGINE INTERFACE
  const handleRiftStatsUpdate = useCallback((stats: { time: number, captured: number, totalTime: number }) => {
      setStats(prev => ({ ...prev, timeRemaining: stats.time, totalTime: stats.totalTime }));
      setRiftCapturedCount(stats.captured);
  }, []);
  
  // Wrap level completion for Rift to handle specific state
  const handleRiftComplete = useCallback((success: boolean) => {
      setMessage(null); 
      if (!success) {
          setRiftWinState('LOSS');
      } else {
          setRiftWinState('WIN'); 
      }
  }, []);

  const onWorkshopClick = () => {
      if (engineRef.current) engineRef.current.triggerWorkshopTransition();
  };

  const onWorkshopOpenedCallback = () => {
      setGameStatus(GameStatus.WORKSHOP);
  };

  const handleEnterRift = useCallback(() => {
      setGameStatus(GameStatus.RIFT_INTRO);
      setLoadingProgress(0);
      setRiftCapturedCount(0); 
      setRiftWinState(null);
      setMessage(null);
      
      const players = Math.random() > 0.5 ? 2 : 3;
      const target = players === 2 ? 12 : 20;
      setRiftConfig({ players, target });
      
      let prog = 0;
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = setInterval(() => {
          prog += 1;
          setLoadingProgress(prog);
          if (prog >= 100) {
              if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
              loadingIntervalRef.current = null;
              setGameStatus(GameStatus.RIFT);
          }
      }, 50); 
  }, []);

  const handleClaimRiftReward = () => {
      const riftSpirit: CapturedSpirit = { id: `rift-spirit-${Date.now()}`, tier: 3, name: "Void Wraith", powerValue: 70, dateCaught: Date.now() };
      setMetaState(prev => ({ ...prev, ectoplasm: prev.ectoplasm + 200, inventory: [...prev.inventory, riftSpirit] }));
      setRiftWinState(null);
      startLevelLoad();
  };

  const RiftWinModal = () => (
      <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300 pointer-events-auto">
          <h2 className="text-3xl font-gothic text-red-500 uppercase tracking-widest mb-2 drop-shadow-[0_0_15px_red] text-center">Dimension Stabilized</h2>
          <div className="text-6xl mb-6">🔥</div>
          <div className="bg-red-950/50 border border-red-500/50 p-6 rounded-2xl w-full max-w-xs flex flex-col items-center gap-4 mb-8">
              <span className="text-red-200 uppercase text-xs tracking-[0.2em]">Reward</span>
              <div className="flex items-center gap-3">
                  <span className="text-4xl font-gothic text-white drop-shadow-[0_0_10px_red]">200</span>
                  <EctoIcon className="w-8 h-8" />
              </div>
          </div>
          <button onClick={handleClaimRiftReward} className="w-full max-w-xs bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_red] uppercase tracking-widest text-sm transition-all active:scale-95">Claim Reward</button>
      </div>
  );

  const RiftLoseModal = () => (
      <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300 pointer-events-auto">
          <h2 className="text-2xl font-gothic text-slate-300 uppercase tracking-widest mb-2 text-center">Dimension Collapsed</h2>
          <p className="text-xs text-slate-400 text-center max-w-[250px] mb-6 leading-relaxed">
              The instability was too great. Search for <span className="text-[#a855f7] font-bold">Ancient Shrines</span> in other realms to attempt the stabilization again.
          </p>
          <button onClick={startLevelLoad} className="w-full max-w-xs bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-600 uppercase tracking-widest text-sm transition-all active:scale-95 hover:border-white/20 z-50 cursor-pointer">Return to Hunt</button>
      </div>
  );

  return (
    // CHANGED: Use relative + 100dvh for cleaner PWA layout without safe area clipping issues caused by fixed position
    <div className="relative w-full h-[100dvh] flex items-center justify-center font-sans select-none overflow-hidden touch-none bg-[#0f172a]">
        
        {/* Main Game Container - Fixed for Mobile, Aspect Ratio for Desktop */}
        {/* CHANGED: Use absolute inset-0 to force fill entire viewport, fixing canvas cutoff issues */}
        <div className="absolute inset-0 md:relative md:inset-auto md:w-auto md:h-auto md:max-w-[45vh] md:max-h-[85vh] md:aspect-[9/16] bg-[#0f172a] shadow-[0_0_60px_black] md:border-x border-[#1e293b] flex flex-col">
            
            {/* CANVAS LAYER (ABSOLUTE FILL) */}
            <div className="absolute inset-0 z-0 w-full h-full bg-[#0f172a] transition-all overflow-hidden">
                {gameStatus === GameStatus.RIFT ? (
                    <>
                        {/* Using Memoized Rift Engine */}
                        <MemoizedRiftEngine 
                            onComplete={handleRiftComplete}
                            showFloatingMessage={showFloatingMessage}
                            currentEssence={currentEssence}
                            onStatsUpdate={handleRiftStatsUpdate}
                            targetScore={riftConfig.target}
                            playerCount={riftConfig.players}
                            assets={assets}
                        />
                        {riftWinState === 'WIN' && <RiftWinModal />}
                        {riftWinState === 'LOSS' && <RiftLoseModal />}
                    </>
                ) : (
                    // CRITICAL FIX: ALWAYS RENDER GAME ENGINE
                    // This prevents the black screen issue caused by asset unloading.
                    // Instead of conditional rendering, we rely on the LoadingScreen (z-1000) to cover it.
                    <MemoizedGameEngine 
                        ref={engineRef}
                        gameStatus={gameStatus} 
                        levelConfig={levelConfig}
                        generalStats={generalStats}
                        onStatsUpdate={handleStatsUpdate}
                        onLevelComplete={handleLevelComplete}
                        onGhostCaught={handleGhostCaught}
                        onItemCollect={handleItemCollect}
                        showFloatingMessage={showFloatingMessage}
                        onWorkshopOpen={onWorkshopOpenedCallback} 
                        onEnterRift={handleEnterRift}
                        currentEssence={currentEssence}
                        onQuestProgress={handleQuestProgress}
                        assets={assets}
                        paused={tutorialStep > 0 || gameStatus !== GameStatus.PLAYING}
                    />
                )}
                
                {showSplash && <SplashScreen assets={assets} isFading={splashFading} />}
                
                {/* Render LoadingScreen during SPLASH (behind) and LOADING to ensure smooth transition */}
                {(gameStatus === GameStatus.LOADING || gameStatus === GameStatus.SPLASH) && (
                    <LoadingScreen levelConfig={levelConfig} quests={quests} assets={assets} progress={loadingProgress} />
                )}
                
                {gameStatus === GameStatus.RIFT_INTRO && <LoadingScreen isRift={true} levelConfig={levelConfig} quests={quests} assets={assets} progress={loadingProgress} riftConfig={riftConfig} />}
                
                {gameStatus === GameStatus.WORKSHOP && (
                    <WorkshopScreen 
                        metaState={metaState}
                        onUpdateMeta={setMetaState}
                        onExit={() => alert('Exit game')} 
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
                
                {showAssetManager && (
                    <AssetManager 
                        currentAssets={assets} 
                        onSaveAssets={handleUpdateAssets} 
                        onClose={() => setShowAssetManager(false)} 
                    />
                )}
            </div>

            {/* UI LAYER (ABSOLUTE TOP) */}
            {gameStatus !== GameStatus.LOADING && gameStatus !== GameStatus.RIFT_INTRO && gameStatus !== GameStatus.WORKSHOP && gameStatus !== GameStatus.SPLASH && gameStatus !== GameStatus.ESSENCE_SELECTION && !showSplash &&
              <TopHUD 
                score={score} 
                ectoplasm={metaState.ectoplasm} 
                levelConfig={levelConfig} 
                onWorkshopClick={onWorkshopClick}
                assets={assets}
                quests={quests}
                isRift={gameStatus === GameStatus.RIFT}
                riftCaptured={riftCapturedCount}
                riftTarget={riftConfig.target}
              />
            }
            
            {message && !riftWinState && gameStatus !== GameStatus.ESSENCE_SELECTION && gameStatus !== GameStatus.SPLASH && (
              <div className="absolute top-24 left-0 right-0 text-center z-[300] pointer-events-none flex justify-center">
                  <span className={`inline-flex items-center gap-2 text-xs font-gothic text-[#f0f9ff] px-6 py-2 shadow-[0_0_20px] uppercase tracking-[0.2em] rounded-full border border-white/20 animate-bounce backdrop-blur-md ${gameStatus === GameStatus.RIFT ? 'bg-red-900/90 shadow-red-500' : 'bg-[#a855f7]/90 shadow-[#a855f7]'}`}>
                      {message.icon && <span className="text-base">{message.icon}</span>}
                      {message.text}
                  </span>
              </div>
            )}
            
            {tutorialStep > 0 && <TutorialOverlay step={tutorialStep} onNext={handleNextTutorial} onDismiss={handleDismissTutorial} />}
            
            {gameStatus !== GameStatus.LOADING && 
             gameStatus !== GameStatus.RIFT_INTRO &&
             gameStatus !== GameStatus.WORKSHOP && 
             gameStatus !== GameStatus.ESSENCE_SELECTION &&
             !showSplash &&
             <BottomPanel stats={stats} levelConfig={levelConfig} isRift={gameStatus === GameStatus.RIFT} />
            }
        </div>
    </div>
  );
}
