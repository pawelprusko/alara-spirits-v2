export enum GameStatus {
  SPLASH = 'SPLASH',
  LOADING = 'LOADING', 
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  ESSENCE_SELECTION = 'ESSENCE_SELECTION',
  WORKSHOP = 'WORKSHOP',
  RIFT_INTRO = 'RIFT_INTRO', 
  RIFT = 'RIFT', 
}

export type ThemeType = 'JUNGLE' | 'DESERT' | 'ICE' | 'DIMENSION';

export interface ThemeConfig {
  type: ThemeType;
  name: string;
  groundColor: string;
  obstacleKeys: string[]; 
  monsterKeys: string[]; 
  groundPatternKey: string; 
}

export type ClassType = 'SCIENTIST' | 'MONK' | 'THIEF';

export interface EssenceStats {
    damage: number;
    range: number;
    speed: number; 
    specialChance: number; 
}

export interface Essence {
    id: string;
    classType: ClassType;
    name: string;
    description: string;
    specialDescription: string;
    stats: EssenceStats;
    spriteKeyBody: string;
    spriteKeyArms: string;
    spriteKeyWeapon: string; 
    colorAccent: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  pos: Position;
  vel?: Velocity; 
  size: Size;
  type: 'player' | 'monster' | 'obstacle' | 'prop' | 'item' | 'boss' | 'shrine' | 'spirit_volatile' | 'tesla_coil' | 'bot'; 
  isPossessed?: boolean; 
  spriteKey: string;
  active: boolean;
  scale?: number; 
  opacity?: number; 
  health?: number; 
  maxHealth?: number;
  
  shrineState?: 'LOCKED' | 'ACTIVE' | 'OPENED';
  
  hasBeenHit?: boolean; 
  
  isDoomed?: boolean; 
  doomTimer?: number;
  initialDoomHealth?: number; 

  poisonTimer?: number;
  isPoisoned?: boolean;
  poisonDamageRate?: number; 
  isElectrocuted?: boolean;
  electrocuteTimer?: number;
  electrocuteDamageRate?: number;
}

export interface Projectile {
    id: string;
    startPos: Position;
    currentPos: Position;
    targetId: string;
    speed: number;
    damage: number;
    isSpecial: boolean;
    chainLevel: number; 
    color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  life: number; 
  color: string;
}

export interface SpiritProjectile {
    startPos: Position;
    currentPos: Position;
    targetPos: Position;
    targetId: string; 
    progress: number; 
    active: boolean;
}

export interface TransitionState {
    active: boolean;
    phase: 'OPENING' | 'WAITING' | 'WALKING' | 'ABSORB' | 'CLOSING';
    timer: number;
    success: boolean;
    type: 'LEVEL_END' | 'WORKSHOP' | 'RIFT_ENTRY'; 
}

export interface LevelConfig {
  levelNumber: number;
  monsterCount: number;
  timeLimit: number;
  obstacleCount: number;
  theme: ThemeConfig;
}

export interface GeneralStats {
  catcherPower: number;      
  essencePower: number;      
  dropChance: number;
  dimensionRift: number; 
}

export interface GameStats {
  ghostHealth: number; 
  maxGhostHealth: number;
  compassAngle: number; 
  timeRemaining: number;
  totalTime: number; // Added for progress bar calculation
  isCapturing: boolean;
}

// --- NEW WORKSHOP / INVENTORY TYPES ---

export type SpiritTier = 1 | 2 | 3 | 4 | 5;

export interface CapturedSpirit {
    id: string; // Unique ID for inventory tracking
    tier: SpiritTier;
    name: string;
    powerValue: number; // Used for ranking
    dateCaught: number;
}

export interface MetaState {
    ectoplasm: number; 
    inventory: CapturedSpirit[]; 
    unlockedRecipes: string[]; // List of recipe IDs that the player has bought
}

export type QuestType = 'KILL_COUNT' | 'COLLECT_ECTO' | 'CATCH_GHOST';

export interface Quest {
    id: string;
    type: QuestType;
    target: number;
    progress: number;
    completed: boolean;
    description: string;
    reward: number; 
}

export interface GameEngineHandle {
  triggerWorkshopTransition: () => void;
  triggerLevelTransition: () => void; 
  triggerTransformation: () => void; 
}

export interface FileContent {
  name: string;
  path: string;
  content: string;
  type: string;
  size: number;
}

export type AssetMap = Record<string, string>;

export interface FileEntry {
  file: File;
  content: string;
}

export type ProcessedFile = FileContent;