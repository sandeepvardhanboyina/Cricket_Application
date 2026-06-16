export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_manager' | 'visitor';
  team?: Team;
  token?: string;
}

export type PlayerAvailabilityStatus =
  | 'AVAILABLE'
  | 'PENDING'
  | 'INJURED'
  | 'SUSPENDED'
  | 'UNAVAILABLE';

export type MatchResult = 'W' | 'L' | 'NR';

export interface MatchWeather {
  temperature: number;
  condition: string;
  rainChance: number;
  windSpeed: number;
  icon: string;
}

export interface BattingStats {
  player: Player | string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal?: string;
}

export interface BowlingStats {
  player: Player | string;
  playerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface FallOfWicket {
  wicket: number;
  score: number;
  over?: string;
  batsman?: string;
  wicketText?: string;
}

export interface Partnership {
  wicket?: number | null;
  players: string[];
  runs: number;
  balls: number;
}

export interface TimelineEvent {
  over: string;
  title: string;
  description: string;
  type?: string;
  team?: Team | string | null;
  player?: Player | string | null;
}

export interface ScorecardInnings {
  team: Team | string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  extras?: number;
  battingStats: BattingStats[];
  bowlingStats: BowlingStats[];
  fallOfWickets?: FallOfWicket[];
  partnerships?: Partnership[];
  partnershipSummary?: string[];
}

export interface Scorecard {
  matchId?: string;
  playerOfMatch?: Player | string | null;
  toss?: {
    winner?: Team | string | null;
    decision?: 'bat' | 'bowl';
  };
  innings: ScorecardInnings[];
  timelineEvents?: TimelineEvent[];
}

export interface Statistics {
  batting: {
    matches: number;
    innings: number;
    runs: number;
    highestScore: number;
    average: number;
    strikeRate: number;
    fifties: number;
    hundreds: number;
    fours: number;
    sixes: number;
  };
  bowling: {
    matches: number;
    wickets: number;
    economy: number;
    average: number;
    bestBowling: string;
    overs: number;
    maidens: number;
    runs: number;
  };
  fielding: {
    catches: number;
    runOuts: number;
    stumpings: number;
  };
}

export interface Player {
  _id: string;
  name: string;
  dateOfBirth: string;
  age?: number;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  jerseyNumber: number;
  availabilityStatus?: PlayerAvailabilityStatus;
  profileImage: string;
  team?: Team | string | null;
  registrationType?: 'team' | 'individual';
  isVerified: boolean;
  isCaptain: boolean;
  statistics: Statistics;
  careerHistory?: Array<{
    match: string;
    runs: number;
    balls: number;
    wickets: number;
    date: string;
  }>;
}

export interface Team {
  _id: string;
  teamName: string;
  captain: string;
  captainEmail: string;
  mobileNumber: string;
  city: string;
  logo: string;
  players: Player[];
  recentForm?: MatchResult[];
  statistics: {
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    winPercentage: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface Tournament {
  _id: string;
  title: string;
  description: string;
  banner: string;
  registrationFee: number;
  prizePool: number;
  startDate: string;
  endDate: string;
  overs: number;
  maxTeams: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  teams: Array<{ team: Team; registrationStatus: string }>;
  pointsTable: Array<{
    team: Team;
    matches: number;
    won: number;
    lost: number;
    points: number;
    nrr: number;
  }>;
  sponsors: Array<{ name: string; logo: string; website: string }>;
}

export interface Match {
  _id: string;
  tournament: Tournament | string;
  teamA: Team;
  teamB: Team;
  date: string;
  ground: string;
  overs: number;
  status: 'scheduled' | 'live' | 'completed' | 'abandoned';
  weather?: MatchWeather | null;
  scorecard?: Scorecard | null;
  innings: Array<{
    team: Team | string;
    totalRuns: number;
    totalWickets: number;
    totalOvers: number;
    batting: Array<{
      player: Player | string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      strikeRate: number;
      isOut: boolean;
    }>;
    bowling: Array<{
      player: Player | string;
      overs: number;
      maidens: number;
      runs: number;
      wickets: number;
      economy: number;
    }>;
  }>;
  result?: {
    winner: Team | string;
    margin: string;
    manOfTheMatch?: Player | string;
  };
  liveScore?: {
    currentInnings: number;
    currentOver: number;
    currentBall: number;
    lastUpdated: string;
  };
  commentary?: Array<{
    over: number;
    ball: number;
    text: string;
    runs: number;
    isWicket: boolean;
  }>;
  timelineEvents?: TimelineEvent[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: { page: number; limit: number; total: number };
}

export interface DashboardStats {
  totalTeams: number;
  totalPlayers: number;
  totalMatches: number;
  totalTournaments: number;
  pendingTeams: number;
  unreadMessages: number;
  availablePlayers: number;
  injuredPlayers: number;
  suspendedPlayers: number;
  unavailablePlayers: number;
}
