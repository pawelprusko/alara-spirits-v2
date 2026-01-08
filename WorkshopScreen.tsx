import React, { useState, useRef, useEffect } from 'react';
import { MetaState, SpiritTier, CapturedSpirit, AssetMap, GeneralStats, Essence } from './types';
import { Pencil } from 'lucide-react';

interface WorkshopScreenProps {
    metaState: MetaState;
    onUpdateMeta: (newState: MetaState) => void;
    onExit: () => void;
    onPlay: () => void;
    assets: AssetMap;
    onOpenAssetManager: () => void;
    showFloatingMessage: (text: string, icon?: string) => void;
    currentEssence: Essence;
    generalStats: GeneralStats;
}

const TIER_NAMES: Record<SpiritTier, string> = {
    1: 'Wisp', 2: 'Phantom', 3: 'Wraith', 4: 'Specter', 5: 'Archon'
};
const TIER_COLORS: Record<SpiritTier, string> = {
    1: 'text-slate-300', 2: 'text-green-400', 3: 'text-blue-400', 4: 'text-purple-400', 5: 'text-amber-400'
};

const SPIRIT_LORE: Record<SpiritTier, string> = {
    1: "A flickering spark of mischief. Known for blowing out candles and tying shoelaces together when you blink.",
    2: "A translucent grump. Throws books across the room just to hear the thud. Despises silence.",
    3: "A jagged shadow. Chills the air enough to see your breath. Feeds on the anxiety of forgotten homework.",
    4: "A howling void. Its scream cracks mirrors and curdles fresh milk. Do not approach without earplugs.",
    5: "Pure, ancient dread. It remembers when the stars were young and thinks they were overrated."
};

interface CraftingRecipe {
    id: string;
    name: string;
    description: string;
    resultTier: SpiritTier;
    ingredients: { tier: SpiritTier, count: number }[];
    cost: number;
    iconChar: string;
}

const RECIPES: CraftingRecipe[] = [
    { id: 'r1', name: 'Luminous Bind', description: 'Fuses three weak energies into a stable Phantom.', resultTier: 2, ingredients: [{ tier: 1, count: 3 }], cost: 100, iconChar: 'ᛚ' },
    { id: 'r2', name: 'Shadow Weave', description: 'Combines two Phantoms with raw Wisp energy to birth a Wraith.', resultTier: 3, ingredients: [{ tier: 2, count: 2 }, { tier: 1, count: 1 }], cost: 300, iconChar: 'ᛋ' },
    { id: 'r3', name: 'Astral Convergence', description: 'A volatile mix of Wraith, Phantom and Wisp to summon a Specter.', resultTier: 4, ingredients: [{ tier: 3, count: 1 }, { tier: 2, count: 2 }], cost: 1000, iconChar: 'ᛟ' },
    { id: 'r4', name: 'Void Ascendance', description: 'The ultimate sacrifice of three high spirits to create an Archon.', resultTier: 5, ingredients: [{ tier: 4, count: 3 }], cost: 5000, iconChar: 'ᚹ' },
    { id: 'r5', name: 'Spectral Fusion', description: 'Merges five Wisps directly into a Wraith.', resultTier: 3, ingredients: [{ tier: 1, count: 5 }], cost: 600, iconChar: 'ᚠ' },
    { id: 'r6', name: 'Ethereal Bond', description: 'Refines two Wraiths into a pure Specter.', resultTier: 4, ingredients: [{ tier: 3, count: 2 }], cost: 1200, iconChar: 'ᚣ' },
    { id: 'r7', name: 'Chaos Theory', description: 'A risky combination of one of each lower tier to form a Specter.', resultTier: 4, ingredients: [{ tier: 1, count: 1 }, { tier: 2, count: 1 }, { tier: 3, count: 1 }], cost: 1500, iconChar: 'ᚸ' },
    { id: 'r8', name: 'Divine Spark', description: 'Transmutes a Specter and a Wraith into an Archon.', resultTier: 5, ingredients: [{ tier: 4, count: 1 }, { tier: 3, count: 2 }], cost: 6000, iconChar: 'ᛉ' },
    { id: 'r9', name: 'Soul Compression', description: 'Compresses ten Wisps into a single Specter.', resultTier: 4, ingredients: [{ tier: 1, count: 10 }], cost: 2000, iconChar: 'ᛞ' },
    { id: 'r10', name: 'The Final Seal', description: 'Two Archons merged to reform... an Archon with higher power (Lore only).', resultTier: 5, ingredients: [{ tier: 5, count: 2 }], cost: 10000, iconChar: 'ᛏ' },
];

const SpiritThumbnail = ({ tier, assets, size = "w-10 h-10" }: { tier: SpiritTier, assets: AssetMap, size?: string }) => {
    let filterStyle = {};
    switch (tier) {
        case 1: filterStyle = { filter: 'grayscale(100%) brightness(150%)' }; break;
        case 2: filterStyle = { filter: 'hue-rotate(90deg) brightness(120%)' }; break;
        case 3: filterStyle = { filter: 'hue-rotate(180deg) brightness(120%)' }; break;
        case 4: filterStyle = { filter: 'hue-rotate(270deg) brightness(120%)' }; break;
        case 5: filterStyle = { filter: 'sepia(100%) saturate(300%) hue-rotate(340deg)' }; break;
    }

    return (
        <div className={`${size} flex items-center justify-center`}>
            <img 
                src={assets.loadingGhost} 
                className="w-full h-full object-contain pointer-events-none" 
                style={filterStyle} 
                alt={`Tier ${tier} Spirit`}
            />
        </div>
    );
};

export const WorkshopScreen = ({ metaState, onUpdateMeta, onExit, onPlay, assets, onOpenAssetManager, showFloatingMessage, currentEssence, generalStats }: WorkshopScreenProps) => {
    const [activeModal, setActiveModal] = useState<'NONE' | 'SYNTHESIS' | 'RECIPES' | 'STATS' | 'RANKING'>('NONE');
    const [interactingId, setInteractingId] = useState<string | null>(null);

    const handleInteraction = (id: string, action: () => void) => {
        if (interactingId) return;
        setInteractingId(id);
        setTimeout(() => {
            action();
            setInteractingId(null);
        }, 250);
    };

    const getObjectClasses = (id: string) => {
        const isInteracting = interactingId === id;
        let classes = "w-full h-full object-contain transition-all duration-200 ";
        if (isInteracting) {
            classes += "drop-shadow-[0_0_15px_#a855f7] brightness-125 scale-95";
        } else {
            classes += "group-hover:drop-shadow-[0_0_8px_#a855f7] group-hover:brightness-110 group-active:scale-95 group-active:drop-shadow-[0_0_15px_#a855f7]";
        }
        return classes;
    };

    // --- SUB-COMPONENTS ---

    const RecipeModal = () => {
        const buyRecipe = (r: CraftingRecipe) => {
            if (metaState.ectoplasm < r.cost) return;
            onUpdateMeta({
                ...metaState,
                ectoplasm: metaState.ectoplasm - r.cost,
                unlockedRecipes: [...(metaState.unlockedRecipes || []), r.id]
            });
            showFloatingMessage(`RECIPE ACQUIRED: ${r.name}`, "📜");
        };

        return (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-gothic text-amber-500 mb-1">Recipes of Fusion</h2>
                        <p className="text-xs text-slate-400 font-sans tracking-wide">
                            Unlock formulas to evolve your captured spirits.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-amber-900/50 px-4 py-2 rounded-full">
                        <div className="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_8px_purple] animate-pulse"></div>
                        <span className="font-gothic font-bold text-white text-lg">{metaState.ectoplasm}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {RECIPES.map(r => {
                        const canAfford = metaState.ectoplasm >= r.cost;

                        return (
                            <div key={r.id} className={`relative p-5 rounded-xl border transition-all bg-[#0f172a] border-white/5`}>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-3xl font-serif bg-slate-900 border border-white/10 text-slate-600`}>
                                            {r.iconChar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-gothic text-lg font-bold text-slate-200`}>{r.name}</h3>
                                            <p className="text-xs text-slate-400 italic mb-1">{r.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between gap-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {r.ingredients.map((ing, idx) => (
                                                <span key={idx} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-slate-800 text-slate-300 border border-white/5 whitespace-nowrap">
                                                    {ing.count}x {TIER_NAMES[ing.tier]}
                                                </span>
                                            ))}
                                            <span className="text-slate-600 text-[10px]">➜</span>
                                            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-white/5 font-bold ${TIER_COLORS[r.resultTier]} bg-slate-800 whitespace-nowrap`}>
                                                {TIER_NAMES[r.resultTier]}
                                            </span>
                                        </div>

                                        <button 
                                            onClick={() => buyRecipe(r)}
                                            disabled={!canAfford}
                                            className={`shrink-0 flex flex-col items-center justify-center px-6 py-2 rounded-lg border transition-all active:scale-95 ${canAfford ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/40 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'}`}
                                        >
                                            <span className={`text-sm font-gothic font-bold ${canAfford ? 'text-amber-200' : 'text-slate-500'}`}>Acquire</span>
                                            <span className="text-[10px] text-slate-400">{r.cost} Ecto</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/10 bg-slate-900/80">
                    <button onClick={() => setActiveModal('NONE')} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-gothic uppercase tracking-widest rounded-lg transition-colors border border-slate-600">
                        Close Grimoire
                    </button>
                </div>
            </div>
        );
    };

    const SynthesizerModal = () => {
        const [slots, setSlots] = useState<(CapturedSpirit | null)[]>(Array(9).fill(null));
        const [recipeSlot, setRecipeSlot] = useState<CraftingRecipe | null>(null);
        
        // SELECTION STATE
        const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
        const [selectedSpiritTier, setSelectedSpiritTier] = useState<number | null>(null);

        // INTERACTION STATE
        const [dragItem, setDragItem] = useState<{ type: 'SPIRIT' | 'RECIPE', data: any, startX: number, startY: number, currentX: number, currentY: number } | null>(null);
        const isDraggingRef = useRef(false); // To distinguish click from drag

        const [newSpiritPopup, setNewSpiritPopup] = useState<CapturedSpirit | null>(null);
        const [highlightedSpiritId, setHighlightedSpiritId] = useState<string | null>(null);

        useEffect(() => {
            if (highlightedSpiritId) {
                const timer = setTimeout(() => setHighlightedSpiritId(null), 3000);
                return () => clearTimeout(timer);
            }
        }, [highlightedSpiritId]);

        const availableRecipes = RECIPES.filter(r => (metaState.unlockedRecipes || []).includes(r.id));
        
        const spiritStacks: { tier: SpiritTier, count: number, spirits: CapturedSpirit[] }[] = [];
        [1,2,3,4,5].forEach(t => {
            const matches = metaState.inventory.filter(s => s.tier === t && !slots.find(sl => sl?.id === s.id));
            if (matches.length > 0) {
                spiritStacks.push({ tier: t as SpiritTier, count: matches.length, spirits: matches });
            }
        });

        // Initialize Defaults
        useEffect(() => {
            if (availableRecipes.length > 0 && !selectedRecipeId) {
                setSelectedRecipeId(availableRecipes[0].id);
            }
            if (spiritStacks.length > 0 && !selectedSpiritTier) {
                setSelectedSpiritTier(spiritStacks[0].tier);
            }
        }, [availableRecipes.length, spiritStacks.length]);

        const handlePointerDown = (e: React.PointerEvent, type: 'SPIRIT' | 'RECIPE', data: any) => {
            e.stopPropagation(); // Stop bubbling
            const itemData = (type === 'SPIRIT' && data.spirits) ? data.spirits[0] : data;
            
            // Start tracking drag
            setDragItem({
                type,
                data: itemData,
                startX: e.clientX,
                startY: e.clientY,
                currentX: e.clientX,
                currentY: e.clientY
            });
            isDraggingRef.current = false; // Reset drag flag
        };

        useEffect(() => {
            const handleMove = (e: PointerEvent) => {
                if (dragItem) {
                    const dx = Math.abs(e.clientX - dragItem.startX);
                    const dy = Math.abs(e.clientY - dragItem.startY);
                    
                    // If moved more than 15px total, treat as a drag operation
                    if (dx > 15 || dy > 15) {
                        isDraggingRef.current = true;
                    }
                    
                    setDragItem(prev => prev ? ({ ...prev, currentX: e.clientX, currentY: e.clientY }) : null);
                }
            };

            const handleUp = (e: PointerEvent) => {
                if (!dragItem) return;
                
                // --- CLICK DETECTED (No significant movement) ---
                if (!isDraggingRef.current) {
                    // SELECTION LOGIC
                    if (dragItem.type === 'RECIPE') {
                        setSelectedRecipeId((dragItem.data as CraftingRecipe).id);
                    } else if (dragItem.type === 'SPIRIT') {
                        setSelectedSpiritTier((dragItem.data as CapturedSpirit).tier);
                    }
                    
                    setDragItem(null); // Clear drag item
                    return; 
                }

                // --- DRAG DROP LOGIC (If moved) ---
                const elements = document.elementsFromPoint(e.clientX, e.clientY);
                const slotEl = elements.find(el => el.hasAttribute('data-slot-index'));
                const recipeSlotEl = elements.find(el => el.hasAttribute('data-recipe-slot'));
                const inventoryZone = elements.find(el => el.hasAttribute('data-inventory-zone'));

                if (dragItem.type === 'RECIPE' && recipeSlotEl) {
                    setRecipeSlot(dragItem.data);
                } else if (dragItem.type === 'SPIRIT' && slotEl) {
                    const idx = parseInt(slotEl.getAttribute('data-slot-index') || '0');
                    const newSlots = [...slots];
                    const existingIdx = slots.findIndex(s => s?.id === dragItem.data.id);
                    if (existingIdx !== -1) newSlots[existingIdx] = null;
                    newSlots[idx] = dragItem.data;
                    setSlots(newSlots);
                } else if (inventoryZone) {
                    if (dragItem.type === 'SPIRIT') {
                        const existingIdx = slots.findIndex(s => s?.id === dragItem.data.id);
                        if (existingIdx !== -1) {
                            const newSlots = [...slots];
                            newSlots[existingIdx] = null;
                            setSlots(newSlots);
                        }
                    } else if (dragItem.type === 'RECIPE') {
                        if (recipeSlot?.id === dragItem.data.id) setRecipeSlot(null);
                    }
                }
                setDragItem(null);
            };

            if (dragItem) {
                window.addEventListener('pointermove', handleMove);
                window.addEventListener('pointerup', handleUp);
            }
            return () => {
                window.removeEventListener('pointermove', handleMove);
                window.removeEventListener('pointerup', handleUp);
            };
        }, [dragItem, slots, recipeSlot]);

        const canSynthesize = () => {
            if (!recipeSlot) return false;
            const slotCounts: Record<number, number> = {};
            slots.forEach(s => {
                if (s) slotCounts[s.tier] = (slotCounts[s.tier] || 0) + 1;
            });
            return recipeSlot.ingredients.every(ing => (slotCounts[ing.tier] || 0) >= ing.count);
        };

        const executeSynthesis = () => {
            if (!canSynthesize() || !recipeSlot) return;
            
            const usedIds: string[] = [];
            const remainingReqs = recipeSlot.ingredients.map(i => ({...i}));

            slots.forEach(s => {
                if (s) {
                    const req = remainingReqs.find(r => r.tier === s.tier && r.count > 0);
                    if (req) {
                        req.count--;
                        usedIds.push(s.id);
                    }
                }
            });

            const newSpirit: CapturedSpirit = {
                id: `synth-${Date.now()}`,
                tier: recipeSlot.resultTier,
                name: `Forged ${TIER_NAMES[recipeSlot.resultTier]}`,
                powerValue: recipeSlot.resultTier * 60,
                dateCaught: Date.now()
            };

            // Remove used items AND the recipe (consumable)
            const newInventory = metaState.inventory.filter(s => !usedIds.includes(s.id));
            const newRecipes = metaState.unlockedRecipes.filter((rid, i) => 
                !(rid === recipeSlot.id && i === metaState.unlockedRecipes.indexOf(rid)) // Remove one instance
            );

            onUpdateMeta({
                ...metaState,
                inventory: [...newInventory, newSpirit],
                unlockedRecipes: newRecipes
            });

            setSlots(Array(9).fill(null));
            setRecipeSlot(null);
            showFloatingMessage(`SYNTHESIS COMPLETE`, "✨");
            
            setHighlightedSpiritId(newSpirit.id);
            setNewSpiritPopup(newSpirit);
        };

        // Data for details panels
        const selectedRecipeData = availableRecipes.find(r => r.id === selectedRecipeId);
        const selectedSpiritData = spiritStacks.find(s => s.tier === selectedSpiritTier);

        return (
            <div 
                className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex flex-col animate-in fade-in zoom-in duration-300 select-none"
            >
                {/* SCROLLABLE CONTAINER FOR EVERYTHING EXCEPT FOOTER */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
                    
                    {/* TOP SECTION (Synthesis) - No fixed height, just flows */}
                    <div className="flex flex-col items-center justify-start p-4 pt-8">
                        <h2 className="text-2xl font-gothic text-slate-200 uppercase tracking-[0.2em] mb-1 drop-shadow-[0_0_10px_#a855f7] text-center">Spirit Synthesizer</h2>
                        <p className="text-xs text-slate-400 italic font-serif mb-6 text-center max-w-xs leading-tight">
                            Combine captured spirits using ancient recipes to forge powerful allies.
                        </p>

                        <div className="flex gap-6 items-center justify-center w-full max-w-md">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold font-gothic">Recipe</span>
                                <div 
                                    data-recipe-slot="true"
                                    className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center relative transition-all ${recipeSlot ? 'border-amber-500/50 bg-amber-900/20' : 'border-dashed border-slate-700 bg-slate-900/50'}`}
                                >
                                    {recipeSlot ? (
                                        <div 
                                            onPointerDown={(e) => handlePointerDown(e, 'RECIPE', recipeSlot)}
                                            className="text-4xl text-amber-500 cursor-grab active:cursor-grabbing touch-none"
                                        >{recipeSlot.iconChar}</div>
                                    ) : (
                                        <span className="text-slate-700 text-xs text-center px-1">Drop Recipe</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold font-gothic">Reagents</span>
                                <div className="grid grid-cols-3 gap-2 bg-slate-900 p-3 rounded-xl border border-purple-500/30 shadow-[0_0_120px_#a855f7] relative overflow-visible">
                                    {/* Glow element */}
                                    <div className="absolute inset-0 bg-purple-600/10 blur-xl rounded-xl -z-10"></div>
                                    {slots.map((s, idx) => (
                                        <div 
                                            key={idx}
                                            data-slot-index={idx}
                                            className={`w-14 h-14 rounded border flex items-center justify-center relative ${s ? 'border-purple-500/30 bg-purple-900/10' : 'border-slate-800 bg-slate-950/50'}`}
                                        >
                                            {s && (
                                                <div 
                                                    onPointerDown={(e) => handlePointerDown(e, 'SPIRIT', s)}
                                                    className="w-full h-full p-1 cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
                                                >
                                                    <SpiritThumbnail tier={s.tier} assets={assets} size="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); executeSynthesis(); }}
                            disabled={!canSynthesize()}
                            className={`mt-8 px-8 py-3 rounded-full font-gothic font-bold text-sm tracking-widest transition-all ${
                                canSynthesize() 
                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_30px_#a855f7] scale-105' 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                        >
                            SYNTHESIZE
                        </button>
                    </div>

                    {/* BOTTOM SECTION (Inventory) - Now flows naturally */}
                    <div 
                        data-inventory-zone="true"
                        className="bg-slate-950 border-t border-white/10 flex flex-col p-4 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                    >
                        <div className="mb-6">
                            <h4 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-amber-500/20 pb-1 font-gothic">
                                <span className="text-sm">📜</span> Known Formulas
                            </h4>
                            <div className="grid grid-cols-5 gap-3 place-items-center mb-2">
                                {availableRecipes.map(r => {
                                    const isSelected = selectedRecipeId === r.id;
                                    return (
                                        <div 
                                            key={r.id}
                                            onPointerDown={(e) => handlePointerDown(e, 'RECIPE', r)}
                                            className={`w-14 h-14 bg-slate-800 border rounded-lg flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-700 transition-all shadow-lg touch-none ${isSelected ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border-slate-600 hover:border-amber-500/50'} ${recipeSlot?.id === r.id ? 'opacity-30 grayscale' : ''}`}
                                        >
                                            <span className="text-xl text-amber-500 pointer-events-none">{r.iconChar}</span>
                                        </div>
                                    );
                                })}
                                {Array.from({length: Math.max(0, 5 - availableRecipes.length)}).map((_, i) => (
                                    <div key={`ph-recipe-${i}`} className="w-14 h-14 border border-slate-700/50 rounded-lg bg-slate-800/30"></div>
                                ))}
                            </div>
                            
                            {/* RECIPE DETAILS PANEL */}
                            <div className="min-h-[50px] bg-slate-900/60 border border-amber-500/20 rounded-lg p-2.5 flex flex-col justify-center">
                                {selectedRecipeData ? (
                                    <>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-amber-400 font-gothic">{selectedRecipeData.name}</span>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                {selectedRecipeData.ingredients.map(i => `${i.count}x ${TIER_NAMES[i.tier]}`).join(' + ')}
                                                <span className="text-amber-500">➜</span>
                                                <span className={`font-bold ${TIER_COLORS[selectedRecipeData.resultTier]}`}>{TIER_NAMES[selectedRecipeData.resultTier]}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic leading-tight">{selectedRecipeData.description}</p>
                                    </>
                                ) : (
                                    <p className="text-[10px] text-slate-600 text-center italic">Select a recipe to view details...</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-bold text-purple-400/80 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-purple-500/20 pb-1 font-gothic">
                                <span className="text-sm">👻</span> Spirit Collection
                            </h4>
                            <div className="grid grid-cols-5 gap-3 place-items-center mb-2">
                                {spiritStacks.map((stack, idx) => {
                                    const isHighlighted = stack.spirits.some(s => s.id === highlightedSpiritId);
                                    const isSelected = stack.tier === selectedSpiritTier;
                                    return (
                                        <div 
                                            key={idx}
                                            onPointerDown={(e) => handlePointerDown(e, 'SPIRIT', stack)}
                                            className={`w-14 h-14 bg-slate-800 border rounded-lg flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing hover:bg-slate-700 transition-all group shadow-lg touch-none ${isHighlighted ? 'bg-purple-900/30 border-purple-400 shadow-[0_0_15px_#a855f7]' : (isSelected ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'border-slate-600 hover:border-purple-500/50')}`}
                                        >
                                            <div className="scale-75 pointer-events-none">
                                                <SpiritThumbnail tier={stack.tier} assets={assets} />
                                            </div>
                                            <div className="absolute -top-2 -right-2 bg-slate-700 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-mono border border-slate-600 z-10 shadow-md pointer-events-none">
                                                {stack.count}
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {Array.from({length: Math.max(0, 5 - spiritStacks.length)}).map((_, i) => (
                                    <div key={`ph-spirit-${i}`} className="w-14 h-14 border border-slate-700/50 rounded-lg bg-slate-800/30"></div>
                                ))}
                            </div>

                            {/* SPIRIT DETAILS PANEL */}
                            <div className="min-h-[50px] bg-slate-900/60 border border-purple-500/20 rounded-lg p-2.5 flex flex-col justify-center">
                                {selectedSpiritData ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold font-gothic ${TIER_COLORS[selectedSpiritData.tier]}`}>{TIER_NAMES[selectedSpiritData.tier]} Spirit</span>
                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Tier {selectedSpiritData.tier}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic leading-tight">{SPIRIT_LORE[selectedSpiritData.tier]}</p>
                                    </>
                                ) : (
                                    <p className="text-[10px] text-slate-600 text-center italic">Select a spirit to view lore...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER (FIXED) */}
                <div className="p-4 border-t border-white/10 bg-slate-900/90 backdrop-blur shrink-0 z-30">
                    <button onClick={() => setActiveModal('NONE')} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-gothic uppercase tracking-widest rounded-lg transition-colors border border-slate-600">
                        Close Synthesizer
                    </button>
                </div>

                {/* --- DRAG GHOST --- */}
                {dragItem && isDraggingRef.current && (
                    <div 
                        className="fixed z-[9999] pointer-events-none flex items-center justify-center bg-slate-800/90 rounded-lg border border-white/20 shadow-2xl backdrop-blur text-white font-bold"
                        style={{ 
                            left: dragItem.currentX, 
                            top: dragItem.currentY, 
                            width: '56px', 
                            height: '56px', 
                            transform: 'translate(-50%, -50%)' 
                        }}
                    >
                        {dragItem.type === 'RECIPE' ? (dragItem.data as CraftingRecipe).iconChar : <SpiritThumbnail tier={(dragItem.data as CapturedSpirit).tier} assets={assets} />}
                    </div>
                )}

                {/* --- NEW SPIRIT POPUP --- */}
                {newSpiritPopup && (
                    <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
                         <div className="bg-[#0f172a] border border-purple-500/50 rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(168,85,247,0.4)] flex flex-col items-center">
                            <h2 className="text-xl font-gothic text-white uppercase tracking-widest mb-1">Spirit Forged</h2>
                            <div className="w-16 h-1 bg-purple-500 mb-6 rounded-full shadow-[0_0_10px_#a855f7]"></div>
                            
                            <div className="mb-6 scale-150 p-4 border border-purple-500/20 rounded-full bg-purple-900/20">
                                <SpiritThumbnail tier={newSpiritPopup.tier} assets={assets} size="w-20 h-20" />
                            </div>
                            
                            <h3 className={`text-lg font-bold ${TIER_COLORS[newSpiritPopup.tier]} mb-2`}>{newSpiritPopup.name}</h3>
                            <p className="text-xs text-slate-400 text-center italic mb-6 leading-relaxed">
                                {SPIRIT_LORE[newSpiritPopup.tier]}
                            </p>
                            
                            <button 
                                onClick={() => setNewSpiritPopup(null)}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl uppercase tracking-widest shadow-lg transition-transform active:scale-95"
                            >
                                Collect
                            </button>
                         </div>
                    </div>
                )}
            </div>
        );
    };

    const RankingModal = () => {
        const dummyPlayers = Array.from({ length: 50 }).map((_, i) => ({
            name: `Hunter_${Math.floor(Math.random() * 9999)}`,
            power: Math.floor(Math.random() * 8000) + 100,
            isMe: false
        }));
        
        const myPower = metaState.inventory.reduce((acc, s) => acc + s.powerValue, 0);
        const allPlayers = [
            ...dummyPlayers, 
            { name: "YOU", power: myPower, isMe: true }
        ].sort((a,b) => b.power - a.power);

        const myRank = allPlayers.findIndex(p => p.isMe) + 1;

        return (
            <div className="absolute inset-0 bg-slate-950/95 z-[100] flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-white/10 bg-slate-900/50 text-center">
                    <h2 className="text-2xl font-gothic text-amber-500 mb-1">Season Ranking</h2>
                    <p className="text-xs text-slate-400">Top 3 players earn unique Archon Titles & Skins.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                     <div className="flex flex-col gap-2">
                        {allPlayers.map((p, idx) => {
                             let rankColor = 'text-slate-500';
                             if (idx < 3) rankColor = 'text-amber-400 text-lg'; // Gold
                             else if (idx < 10) rankColor = 'text-slate-300 text-base'; // Silver
                             else if (idx < 20) rankColor = 'text-orange-400 text-base'; // Bronze - Brightened

                             return (
                                 <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${p.isMe ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-slate-900 border-slate-800'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-mono font-bold w-8 text-center ${rankColor}`}>#{idx+1}</span>
                                        <span className={`font-gothic ${p.isMe ? 'text-purple-300 font-bold' : 'text-slate-300'}`}>{p.name}</span>
                                    </div>
                                    <span className={`font-mono ${p.isMe ? 'text-white' : 'text-slate-400'}`}>{p.power}</span>
                                 </div>
                             );
                        })}
                     </div>
                </div>
                
                <div className="p-4 border-t border-white/10 bg-slate-900/80">
                    <div className="mb-3 text-center text-xs text-slate-500 font-mono">
                        Your Rank: <span className="text-purple-400 font-bold">#{myRank}</span>
                    </div>
                    <button onClick={() => setActiveModal('NONE')} className="w-full py-3 bg-slate-800 text-slate-300 font-bold font-gothic uppercase rounded-lg hover:bg-slate-700 border border-slate-600">
                        Close Ranking
                    </button>
                </div>
            </div>
        );
    };

    const StatsModal = () => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        metaState.inventory.forEach(s => { if (counts[s.tier] !== undefined) counts[s.tier]++; });
        const totalPower = metaState.inventory.reduce((acc, s) => acc + s.powerValue, 0);
        
        const chanceValue = (currentEssence.stats.specialChance * 100).toFixed(0);

        return (
             <div className="absolute inset-0 bg-slate-950/95 z-[100] flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-slate-900/50">
                    <h2 className="text-2xl font-gothic text-amber-500 text-center uppercase tracking-widest">Hero Statistics</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* SECTION 1: CURRENT CLASS */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Current Vessel</h3>
                        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-4">
                            
                            <div className="flex gap-4 items-start">
                                <div className="w-16 h-16 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center shrink-0">
                                     <img src={assets[currentEssence.spriteKeyBody]} className="w-full h-full object-contain scale-125" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-lg font-gothic text-slate-200 font-bold">{currentEssence.name}</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-400">{currentEssence.classType}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 italic mb-3" dangerouslySetInnerHTML={{ __html: currentEssence.description }} />
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                         <div className="bg-slate-950 p-1.5 rounded text-center border border-white/5">
                                             <div className="text-xs font-bold text-white">{currentEssence.stats.damage}</div>
                                             <div className="text-[9px] text-slate-500 uppercase">DMG</div>
                                         </div>
                                         <div className="bg-slate-950 p-1.5 rounded text-center border border-white/5">
                                             <div className="text-xs font-bold text-white">{currentEssence.stats.range}</div>
                                             <div className="text-[9px] text-slate-500 uppercase">RNG</div>
                                         </div>
                                         <div className="bg-slate-950 p-1.5 rounded text-center border border-white/5">
                                             <div className="text-xs font-bold text-white">{currentEssence.stats.speed}</div>
                                             <div className="text-[9px] text-slate-500 uppercase">SPD</div>
                                         </div>
                                    </div>
                                </div>
                            </div>

                            {/* Added Ability Section */}
                            <div className="bg-slate-950/30 rounded-lg p-3 border border-white/5 flex flex-col gap-1">
                                 <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1">
                                     <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Special Ability</span>
                                     <span className="text-xs font-mono text-[#a855f7] font-bold">{chanceValue}% Chance</span>
                                 </div>
                                 <p className="text-[10px] text-slate-400 leading-tight" dangerouslySetInnerHTML={{ __html: currentEssence.specialDescription }} />
                            </div>

                        </div>
                    </section>

                    {/* SECTION 2: GENERAL STATS */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Arcane Mastery</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-slate-300">Catcher Power</span>
                                    <span className="text-emerald-400 font-mono font-bold">{generalStats.catcherPower}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">The larger it is, the faster you catch the ghost, minimizing escape risk.</p>
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-slate-300">Essence Power</span>
                                    <span className="text-emerald-400 font-mono font-bold">{generalStats.essencePower}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">Regulates the class skills contained in the essence obtained from ghosts.</p>
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-slate-300">Drop Chance</span>
                                    <span className="text-emerald-400 font-mono font-bold">{generalStats.dropChance}%</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">Chance for monsters to leave Ectoplasm, raising random attributes.</p>
                            </div>
                             <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-slate-300">Rift Resonance</span>
                                    <span className="text-purple-400 font-mono font-bold">{generalStats.dimensionRift}%</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">Chance to find a Shrine that opens a portal to the Secret Dimension.</p>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: SPIRIT COLLECTION */}
                    <section>
                         <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Spirit Collection</h3>
                         
                         {/* Totals Header Banner */}
                         <div className="mb-4 bg-gradient-to-r from-purple-900/40 to-slate-900/40 border border-purple-500/30 p-4 rounded-xl flex flex-col items-center">
                             <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">Total Spirit Power</span>
                             <span className="text-4xl font-gothic text-white drop-shadow-[0_0_10px_#a855f7]">{totalPower}</span>
                             <p className="text-[9px] text-slate-500 mt-2 text-center max-w-[200px]">
                                 Determines your standing in the Seasonal Ranking for the title of Grand Magus.
                             </p>
                         </div>

                         <div className="flex gap-2 mb-4">
                             <div className="flex-1 bg-slate-800/40 border border-slate-700 p-3 rounded-lg flex flex-col items-center">
                                 <span className="text-xl font-gothic text-white">{metaState.ectoplasm}</span>
                                 <span className="text-[9px] uppercase tracking-widest text-slate-400">Total Ecto</span>
                             </div>
                              <div className="flex-1 bg-slate-800/40 border border-slate-700 p-3 rounded-lg flex flex-col items-center">
                                 <span className="text-xl font-gothic text-white">{metaState.inventory.length}</span>
                                 <span className="text-[9px] uppercase tracking-widest text-slate-400">Spirits</span>
                             </div>
                         </div>

                         {/* Tier Breakdown */}
                         <div className="space-y-2">
                            {[1,2,3,4,5].map(t => (
                                <div key={t} className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                    <div className="w-10 h-10 bg-slate-800 rounded border border-slate-700 shrink-0">
                                         <SpiritThumbnail tier={t as SpiritTier} assets={assets} size="w-full h-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <span className={`text-sm font-bold ${TIER_COLORS[t as SpiritTier]}`}>{TIER_NAMES[t as SpiritTier]}</span>
                                            <span className="text-white font-mono font-bold">x{counts[t]}</span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 truncate">{SPIRIT_LORE[t as SpiritTier]}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </section>

                </div>

                <div className="p-4 border-t border-white/10 bg-slate-900/80">
                    <button onClick={() => setActiveModal('NONE')} className="w-full py-3 bg-slate-800 text-slate-300 font-bold font-gothic uppercase rounded-lg hover:bg-slate-700 border border-slate-600">
                        Close Statistics
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="absolute inset-0 bg-[#0f172a] z-40 overflow-hidden font-sans select-none">
            
            <div className="absolute inset-0 z-0">
                <img 
                    src={assets.workshop_bg_detailed} 
                    className="w-full h-full object-cover object-center" 
                    alt="Workshop Background"
                />
                <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
            </div>
            
            <div className="absolute top-4 left-4 z-50">
                <button 
                    onClick={onOpenAssetManager}
                    className="bg-slate-800/60 hover:bg-slate-700 p-2 rounded-full text-slate-400 hover:text-white transition-all backdrop-blur-md border border-white/10"
                    title="Customize Graphics"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </div>

            <div 
                className="absolute top-[4%] left-[50%] -translate-x-1/2 z-10 cursor-pointer group"
                onClick={() => handleInteraction('poster', () => setActiveModal('RANKING'))}
            >
                <div className="relative w-40 h-auto aspect-[3/4]">
                    <img src={assets.poster_rank} className={getObjectClasses('poster')} />
                </div>
            </div>

            <div 
                className="absolute top-[23%] left-[50%] -translate-x-1/2 z-10 cursor-pointer group"
                onClick={() => handleInteraction('shelf', () => setActiveModal('STATS'))}
            >
                <div className="relative w-80 h-auto aspect-[5/2]">
                    <img src={assets.shelf_scrolls} className={getObjectClasses('shelf')} />
                </div>
            </div>

            <div 
                className="absolute top-[28%] right-[-10%] z-20 cursor-pointer group"
                onClick={() => handleInteraction('door', onExit)}
            >
                <div className="relative w-56 h-auto aspect-[2/3]">
                    <img src={assets.door_exit} className={getObjectClasses('door')} />
                </div>
            </div>

            <div 
                className="absolute top-[38%] left-1/2 -translate-x-1/2 z-10 cursor-pointer group"
                onClick={() => handleInteraction('portal', onPlay)}
            >
                <div className="w-52 h-52 relative flex items-center justify-center">
                    <div className="absolute inset-8 bg-blue-500/20 blur-3xl rounded-full animate-pulse pointer-events-none"></div>
                    <img src={assets.portal_gate} className={getObjectClasses('portal')} />
                </div>
            </div>

            <div 
                className="absolute bottom-[15%] left-[-2%] z-20 cursor-pointer group"
                onClick={() => handleInteraction('book', () => setActiveModal('RECIPES'))}
            >
                <div className="relative w-52 h-auto aspect-[1/1]">
                    <img src={assets.book_lectern} className={getObjectClasses('book')} />
                </div>
            </div>

            <div 
                className="absolute bottom-[5%] right-[2%] z-30 cursor-pointer group"
                onClick={() => handleInteraction('crystal', () => setActiveModal('SYNTHESIS'))}
            >
                <div className="relative w-44 h-auto aspect-[3/4]">
                    <div className="absolute inset-8 bg-purple-600/30 blur-3xl rounded-full animate-pulse pointer-events-none"></div>
                    <img src={assets.crystal_large} className={getObjectClasses('crystal')} />
                </div>
            </div>

            {activeModal === 'RECIPES' && <RecipeModal />}
            {activeModal === 'SYNTHESIS' && <SynthesizerModal />}
            {activeModal === 'RANKING' && <RankingModal />}
            {activeModal === 'STATS' && <StatsModal />}
        </div>
    );
};