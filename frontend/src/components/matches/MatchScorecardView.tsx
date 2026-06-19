'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Flame,
  MapPin,
  Medal,
  Printer,
  Star,
  Target,
  Trophy,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Match, Scorecard, ScorecardInnings } from '@/types';

function teamName(team: ScorecardInnings['team']) {
  return typeof team === 'object' ? team.teamName : 'Team';
}

function playerName(player: { name?: string } | string | null | undefined, fallback = 'Player') {
  if (!player) return fallback;
  return typeof player === 'object' ? player.name || fallback : fallback;
}

function teamLogo(team: ScorecardInnings['team']) {
  return typeof team === 'object' && team.logo ? team.logo : '';
}

function teamResultLabel(match: Match) {
  const winner = typeof match.result?.winner === 'object' ? match.result.winner.teamName : '';
  return winner ? `${winner} won by ${match.result?.margin || 'match result unavailable'}` : 'Result unavailable';
}

function inningsRunRate(innings?: ScorecardInnings | null) {
  if (!innings || !innings.totalOvers) return 0;
  return parseFloat((innings.totalRuns / innings.totalOvers).toFixed(2));
}

function inningsFours(innings?: ScorecardInnings | null) {
  return (innings?.battingStats || []).reduce((total, batter) => total + (batter.fours || 0), 0);
}

function inningsSixes(innings?: ScorecardInnings | null) {
  return (innings?.battingStats || []).reduce((total, batter) => total + (batter.sixes || 0), 0);
}

function formatPlayerPerformance(player: { playerName?: string; runs?: number; balls?: number; wickets?: number; runsConceded?: number }) {
  if ('wickets' in player && (player.wickets || 0) > 0) {
    return `${player.playerName || 'Player'} - ${player.wickets}/${player.runs || 0}`;
  }
  return `${player.playerName || 'Player'} - ${player.runs || 0} (${player.balls || 0})`;
}

function buildDownloadText(match: Match, scorecard: Scorecard) {
  const lines: string[] = [];
  lines.push(`${teamName(match.teamA)} vs ${teamName(match.teamB)}`);
  lines.push(`Date: ${formatDate(match.date)}`);
  lines.push(`Venue: ${match.ground}`);
  if (typeof match.tournament === 'object') lines.push(`Tournament: ${match.tournament.title}`);
  lines.push(`Result: ${teamResultLabel(match)}`);
  lines.push('');

  scorecard.innings.forEach((innings, inningsIndex) => {
    lines.push(`Innings ${inningsIndex + 1}: ${teamName(innings.team)}`);
    lines.push(`${innings.totalRuns}/${innings.totalWickets} (${innings.totalOvers} Overs)`);
    lines.push('Batting:');
    innings.battingStats.forEach((batter) => {
      lines.push(
        `${batter.playerName} | ${batter.dismissal || 'not out'} | ${batter.runs} | ${batter.balls} | ${batter.fours} | ${batter.sixes} | ${batter.strikeRate}`
      );
    });
    lines.push('Bowling:');
    innings.bowlingStats.forEach((bowler) => {
      lines.push(
        `${bowler.playerName} | ${bowler.overs} | ${bowler.maidens} | ${bowler.runs} | ${bowler.wickets} | ${bowler.economy}`
      );
    });
    lines.push(`Extras: ${innings.extras || 0}`);
    lines.push('');
  });

  const inningsOne = scorecard.innings[0];
  const inningsTwo = scorecard.innings[1];
  if (inningsOne && inningsTwo) {
    lines.push('Team Comparison:');
    lines.push(
      `${teamName(inningsOne.team)} ${inningsOne.totalRuns}/${inningsOne.totalWickets} vs ${teamName(inningsTwo.team)} ${inningsTwo.totalRuns}/${inningsTwo.totalWickets}`
    );
    lines.push(
      `${inningsFours(inningsOne)} fours, ${inningsSixes(inningsOne)} sixes vs ${inningsFours(inningsTwo)} fours, ${inningsSixes(inningsTwo)} sixes`
    );
  }

  return lines.join('\n');
}

function Section({
  title,
  subtitle,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Card id={id} className="overflow-hidden scroll-mt-24">
      <CardHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-gray-900/95">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

function InningsSection({
  inningsId,
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: {
  inningsId: string;
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: (inningsId: string) => void;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => {
            console.log('Opening innings', inningsId);
            onToggle(inningsId);
          }}
          className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/70"
          aria-expanded={expanded}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-lg font-semibold text-gray-900 dark:text-white" aria-hidden="true">
              {expanded ? '▼' : '▶'}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
              {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {expanded ? 'Collapse' : 'Expand'}
          </span>
        </button>
      </CardHeader>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <CardBody>{children}</CardBody>
      </div>
    </Card>
  );
}

function ResponsiveTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
            {headers.map((header) => (
              <th
                key={header}
                className="sticky top-0 z-10 bg-white py-3 px-3 text-right first:left-0 first:text-left first:dark:bg-gray-900 dark:bg-gray-900"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border-b border-gray-100 py-2 px-3 text-right first:sticky first:left-0 first:bg-white first:text-left first:dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = 'text-gray-900 dark:text-white',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <p className={`mt-3 text-lg font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export function MatchScorecardView({
  match,
  scorecard,
}: {
  match: Match;
  scorecard?: Scorecard | null;
}) {
  const [openInnings, setOpenInnings] = useState<string | null>(null);
  const scorecardData = scorecard || match.scorecard || null;

  const derivedTimeline = useMemo(() => {
    if (scorecardData?.timelineEvents?.length) return scorecardData.timelineEvents;

    const fallbacks =
      scorecardData?.innings.flatMap((inning) =>
        (inning.fallOfWickets || []).map((item) => ({
          over: item.over || `${item.wicket}`,
          title: `${item.batsman || 'Batter'} Out`,
          description: `Wicket fell at ${item.score}/${item.wicket}`,
          type: 'wicket',
        }))
      ) || [];

    if (fallbacks.length > 0) return fallbacks;

    return (match.commentary || [])
      .filter((event) => event.isWicket)
      .map((event) => ({
        over: `${event.over}.${event.ball}`,
        title: 'Wicket',
        description: event.text,
        type: 'wicket',
      }));
  }, [match.commentary, scorecardData]);

  if (!scorecardData || scorecardData.innings.length === 0) {
    return (
      <Card>
        <CardBody className="py-16 text-center">
          <p className="text-gray-500">Scorecard not available yet</p>
        </CardBody>
      </Card>
    );
  }

  const downloadScorecard = () => {
    const blob = new Blob([buildDownloadText(match, scorecardData)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${teamName(match.teamA)}-vs-${teamName(match.teamB)}-scorecard.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printScorecard = () => window.print();

  const inningsOne = scorecardData.innings[0];
  const inningsTwo = scorecardData.innings[1];
  const inningsOneId = `innings-${1}-${teamName(inningsOne.team)}`;
  const inningsTwoId = `innings-${2}-${teamName(inningsTwo.team)}`;
  const potm = playerName(scorecardData.playerOfMatch || match.result?.manOfTheMatch, 'Player of the Match unavailable');
  const winningTeam = typeof match.result?.winner === 'object' ? match.result.winner.teamName : teamName(match.teamA);
  const matchMargin = match.result?.margin || 'Margin unavailable';
  const topBatter = [...scorecardData.innings.flatMap((inning) => inning.battingStats)].sort(
    (left, right) => right.runs - left.runs
  )[0];
  const topBowler = [...scorecardData.innings.flatMap((inning) => inning.bowlingStats)].sort(
    (left, right) => right.wickets - left.wickets || left.runs - right.runs
  ).find((bowler) => bowler.wickets > 0 || bowler.overs > 0);
  const highestPartnership = [...scorecardData.innings.flatMap((inning) => inning.partnerships || [])].sort(
    (left, right) => right.runs - left.runs
  )[0];
  const teamComparison = inningsTwo
    ? {
        first: {
          teamName: teamName(inningsOne.team),
          runs: inningsOne.totalRuns,
          wickets: inningsOne.totalWickets,
          fours: inningsFours(inningsOne),
          sixes: inningsSixes(inningsOne),
          runRate: inningsRunRate(inningsOne),
        },
        second: {
          teamName: teamName(inningsTwo.team),
          runs: inningsTwo.totalRuns,
          wickets: inningsTwo.totalWickets,
          fours: inningsFours(inningsTwo),
          sixes: inningsSixes(inningsTwo),
          runRate: inningsRunRate(inningsTwo),
        },
      }
    : null;

  const handleToggleInnings = (inningsId: string) => {
    setOpenInnings((current) => (current === inningsId ? null : inningsId));
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link href="/matches" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-cricket-600 dark:text-gray-300">
            <ArrowLeft className="h-4 w-4" />
            Back to Matches
          </Link>
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">Match Scorecard</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {teamLogo(match.teamA) ? (
                <img src={teamLogo(match.teamA)} alt={teamName(match.teamA)} className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cricket-600 text-sm font-bold text-white">
                  {teamName(match.teamA).slice(0, 1)}
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {teamName(match.teamA)} vs {teamName(match.teamB)}
              </h1>
              {teamLogo(match.teamB) ? (
                <img src={teamLogo(match.teamB)} alt={teamName(match.teamB)} className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cricket-600 text-sm font-bold text-white">
                  {teamName(match.teamB).slice(0, 1)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={printScorecard}>
            <Printer className="h-4 w-4" />
            Download Scorecard PDF
          </Button>
          <Button variant="secondary" onClick={downloadScorecard}>
            <Download className="h-4 w-4" />
            Download Scorecard
          </Button>
        </div>
      </div>

      <Card className="border-cricket-200 dark:border-cricket-800 print:border-0">
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Match</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {teamName(match.teamA)} vs {teamName(match.teamB)}
            </h2>
            <p className="mt-2 text-sm text-gray-500">Tournament: {typeof match.tournament === 'object' ? match.tournament.title : 'Tournament'}</p>
          </div>
          <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Date" value={formatDate(match.date)} />
          <StatCard icon={<MapPin className="h-4 w-4" />} label="Venue" value={match.ground} />
          <StatCard icon={<Trophy className="h-4 w-4" />} label="Result" value={teamResultLabel(match)} accent="text-cricket-600" />
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Toss</p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {scorecardData.toss?.winner
                ? `${teamName(scorecardData.toss.winner)} won toss and elected to ${scorecardData.toss.decision || 'bat'}`
                : 'Toss information unavailable'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Player of the Match</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Star className="h-4 w-4 text-yellow-500" />
              {potm}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Winning Team</p>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{winningTeam}</p>
            <p className="mt-1 text-xs text-gray-500">{matchMargin}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Section title="Match Summary" subtitle="Quick overview of the contest">
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard icon={<Trophy className="h-4 w-4" />} label="Winner" value={winningTeam} />
            <StatCard icon={<Medal className="h-4 w-4" />} label="Margin" value={matchMargin} />
            <StatCard icon={<Flame className="h-4 w-4" />} label="Top Batsman" value={topBatter ? `${topBatter.playerName} - ${topBatter.runs} (${topBatter.balls})` : 'N/A'} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <StatCard icon={<Target className="h-4 w-4" />} label="Top Bowler" value={topBowler ? `${topBowler.playerName} - ${topBowler.wickets}/${topBowler.runs}` : 'N/A'} />
            <StatCard
              icon={<Star className="h-4 w-4" />}
              label="Highest Partnership"
              value={highestPartnership ? `${highestPartnership.players.join(' & ')} - ${highestPartnership.runs} runs` : 'N/A'}
            />
          </div>
        </Section>
      </div>

      <Section title="Match Summary Details" subtitle="Result and standout players">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Trophy className="h-4 w-4" />} label="Winning Team" value={winningTeam} />
          <StatCard icon={<Medal className="h-4 w-4" />} label="Margin" value={matchMargin} />
          <StatCard icon={<Star className="h-4 w-4" />} label="Player of the Match" value={potm} />
          <StatCard icon={<Flame className="h-4 w-4" />} label="Top Batsman" value={topBatter ? `${topBatter.playerName} - ${topBatter.runs} (${topBatter.balls})` : 'N/A'} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <StatCard icon={<Target className="h-4 w-4" />} label="Top Bowler" value={topBowler ? `${topBowler.playerName} - ${topBowler.wickets}/${topBowler.runs}` : 'N/A'} />
          <StatCard icon={<Download className="h-4 w-4" />} label="Included Data" value="Batting, bowling, partnerships, wickets, timeline" />
        </div>
      </Section>

      {teamComparison && (
        <Section title="Team Comparison" subtitle="A side-by-side look at both innings">
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900">
              <div className="border-r border-gray-200 p-4 dark:border-gray-700">{teamComparison.first.teamName}</div>
              <div className="p-4">{teamComparison.second.teamName}</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
              <div className="space-y-2 p-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {teamComparison.first.runs}/{teamComparison.first.wickets}
                </p>
                <p className="text-sm text-gray-500">{teamComparison.first.runRate} run rate</p>
                <p className="text-sm text-gray-500">{teamComparison.first.fours} fours</p>
                <p className="text-sm text-gray-500">{teamComparison.first.sixes} sixes</p>
              </div>
              <div className="space-y-2 p-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {teamComparison.second.runs}/{teamComparison.second.wickets}
                </p>
                <p className="text-sm text-gray-500">{teamComparison.second.runRate} run rate</p>
                <p className="text-sm text-gray-500">{teamComparison.second.fours} fours</p>
                <p className="text-sm text-gray-500">{teamComparison.second.sixes} sixes</p>
              </div>
            </div>
          </div>
        </Section>
      )}

      <InningsSection
        inningsId={inningsOneId}
        title={`Innings 1 — ${teamName(inningsOne.team)}`}
        subtitle={`${inningsOne.totalRuns}/${inningsOne.totalWickets} (${inningsOne.totalOvers} Overs)`}
        expanded={openInnings === inningsOneId}
        onToggle={handleToggleInnings}
      >
        <div className="grid gap-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Batting Scorecard</h3>
            <ResponsiveTable
              headers={['Batter', 'Dismissal', 'Runs', 'Balls', '4s', '6s', 'SR']}
              rows={inningsOne.battingStats.map((batter) => [
                <span key="batter" className="font-medium text-gray-900 dark:text-white">
                  {batter.playerName}
                </span>,
                <span key="dismissal" className="text-gray-500">{batter.dismissal || 'not out'}</span>,
                batter.runs,
                batter.balls,
                batter.fours,
                batter.sixes,
                batter.strikeRate,
              ])}
            />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Extras: {inningsOne.extras || 0}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              Total: {inningsOne.totalRuns}/{inningsOne.totalWickets} ({inningsOne.totalOvers} Overs)
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {teamName(match.teamB)} Bowling
            </h3>
            <ResponsiveTable
              headers={['Bowler', 'Overs', 'Maidens', 'Runs', 'Wickets', 'Economy']}
              rows={inningsOne.bowlingStats.map((bowler) => [
                <span key="bowler" className="font-medium text-gray-900 dark:text-white">
                  {bowler.playerName}
                </span>,
                bowler.overs,
                bowler.maidens,
                bowler.runs,
                bowler.wickets,
                bowler.economy.toFixed(2),
              ])}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Fall of Wickets</h3>
            <div className="flex flex-wrap gap-2">
              {(inningsOne.fallOfWickets || []).length > 0 ? (
                inningsOne.fallOfWickets!.map((wicket, index) => (
                  <Badge key={`${wicket.wicket}-${index}`} variant="warning" className="rounded-lg px-3 py-1 text-sm">
                    {wicket.score}-{wicket.wicket} {wicket.batsman ? `(${wicket.batsman}${wicket.over ? `, ${wicket.over}` : ''})` : ''}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">Fall of wickets not available yet</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Partnerships</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(inningsOne.partnerships || []).length > 0 ? (
                inningsOne.partnerships!.map((partnership, index) => (
                  <div key={`${partnership.players.join('-')}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                    <p className="font-semibold text-gray-900 dark:text-white">{partnership.players.join(' + ')}</p>
                    <p className="mt-2 text-sm text-gray-500">{partnership.runs} Runs</p>
                    <p className="text-sm text-gray-500">{partnership.balls} Balls</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Partnership summary reserved for future updates.</p>
              )}
            </div>
          </div>
        </div>
      </InningsSection>

      <InningsSection
        inningsId={inningsTwoId}
        title={`Innings 2 — ${teamName(inningsTwo.team)}`}
        subtitle={`${inningsTwo.totalRuns}/${inningsTwo.totalWickets} (${inningsTwo.totalOvers} Overs)`}
        expanded={openInnings === inningsTwoId}
        onToggle={handleToggleInnings}
      >
        <div className="grid gap-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Batting Scorecard</h3>
            <ResponsiveTable
              headers={['Batter', 'Dismissal', 'Runs', 'Balls', '4s', '6s', 'SR']}
              rows={inningsTwo.battingStats.map((batter) => [
                <span key="batter" className="font-medium text-gray-900 dark:text-white">
                  {batter.playerName}
                </span>,
                <span key="dismissal" className="text-gray-500">{batter.dismissal || 'not out'}</span>,
                batter.runs,
                batter.balls,
                batter.fours,
                batter.sixes,
                batter.strikeRate,
              ])}
            />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Extras: {inningsTwo.extras || 0}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              Total: {inningsTwo.totalRuns}/{inningsTwo.totalWickets} ({inningsTwo.totalOvers} Overs)
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {teamName(match.teamA)} Bowling
            </h3>
            <ResponsiveTable
              headers={['Bowler', 'Overs', 'Maidens', 'Runs', 'Wickets', 'Economy']}
              rows={inningsTwo.bowlingStats.map((bowler) => [
                <span key="bowler" className="font-medium text-gray-900 dark:text-white">
                  {bowler.playerName}
                </span>,
                bowler.overs,
                bowler.maidens,
                bowler.runs,
                bowler.wickets,
                bowler.economy.toFixed(2),
              ])}
            />
          </div>
        </div>
      </InningsSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Match Timeline" subtitle="Major events from the game">
          <div className="space-y-3">
            {derivedTimeline.length > 0 ? (
              derivedTimeline.slice(0, 6).map((event, index) => (
                <div key={`${event.over}-${index}`} className="flex gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="min-w-16 text-sm font-semibold text-cricket-600">{event.over}</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                    <p className="text-sm text-gray-500">{event.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No timeline events available yet.</p>
            )}
          </div>
        </Section>

        <Section title="Player Performance Cards" subtitle="Standout contributors from the match">
          <div className="grid gap-3 sm:grid-cols-2">
            {topBatter && (
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Star className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Top Batter</span>
                </div>
                <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">{topBatter.playerName}</p>
                <p className="text-sm text-gray-500">{topBatter.runs} ({topBatter.balls})</p>
              </div>
            )}
            {topBowler && (
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-2 text-cricket-600">
                  <Target className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Top Bowler</span>
                </div>
                <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">{topBowler.playerName}</p>
                <p className="text-sm text-gray-500">{topBowler.wickets}/{topBowler.runs}</p>
              </div>
            )}
            {inningsOne.battingStats[0] && (
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-2 text-green-500">
                  <Flame className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Standout Batting</span>
                </div>
                <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                  {formatPlayerPerformance(inningsOne.battingStats[0])}
                </p>
                <p className="text-sm text-gray-500">Standout performer from the first innings</p>
              </div>
            )}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section title="Ball By Ball Commentary" subtitle="Future-ready placeholder">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            Ball by Ball Commentary Coming Soon
          </div>
        </Section>
        <Section title="Wagon Wheel" subtitle="Future-ready placeholder">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            Wagon Wheel Coming Soon
          </div>
        </Section>
        <Section title="Manhattan Chart" subtitle="Future-ready placeholder">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            Manhattan Chart Coming Soon
          </div>
        </Section>
        <Section title="Run Rate Graph" subtitle="Future-ready placeholder">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            Run Rate Graph Coming Soon
          </div>
        </Section>
        <Section title="Match Highlights" subtitle="Future-ready placeholder">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            Match Highlights Coming Soon
          </div>
        </Section>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
