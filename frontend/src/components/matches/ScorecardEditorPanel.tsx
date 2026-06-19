'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, History, Pencil, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { matchesAPI } from '@/lib/api';
import { Match, Scorecard, ScorecardAuditEntry } from '@/types';

function cloneScorecard(scorecard: Scorecard): Scorecard {
  return JSON.parse(JSON.stringify(scorecard));
}

function teamName(team: Scorecard['innings'][number]['team']) {
  return typeof team === 'object' ? team.teamName : 'Team';
}

function teamId(team: Scorecard['innings'][number]['team']) {
  return typeof team === 'object' ? team._id : team;
}

function recalculateDraft(scorecard: Scorecard): Scorecard {
  return {
    ...scorecard,
    innings: scorecard.innings.map((innings) => {
      const battingStats = (innings.battingStats || []).map((entry) => {
        const strikeRate = entry.balls > 0 ? parseFloat(((entry.runs / entry.balls) * 100).toFixed(2)) : 0;
        return { ...entry, strikeRate };
      });
      const bowlingStats = (innings.bowlingStats || []).map((entry) => {
        const economy = entry.overs > 0 ? parseFloat((entry.runs / entry.overs).toFixed(2)) : 0;
        return { ...entry, economy };
      });
      const battingTotal = battingStats.reduce((total, batter) => total + (Number(batter.runs) || 0), 0);
      const extras = Number(innings.extras || 0);
      const totalRuns = battingTotal + extras;
      return {
        ...innings,
        battingStats,
        bowlingStats,
        totalRuns,
      };
    }),
  };
}

function canCaptainEdit(match: Match, user: { role?: string; team?: { _id?: string } | string | null } | null) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!['captain', 'team_manager'].includes(user.role || '')) return false;
  const userTeamId = typeof user.team === 'object' ? user.team?._id : user.team;
  const matchTeamIds = [teamId(match.teamA), teamId(match.teamB)].filter(Boolean);
  return Boolean(userTeamId && matchTeamIds.includes(userTeamId));
}

export function ScorecardEditorPanel({
  match,
  scorecard,
  scorecardStatus,
  user,
  onSaved,
}: {
  match: Match;
  scorecard: Scorecard | null;
  scorecardStatus?: 'official' | 'pending_review' | 'draft';
  user: { role?: string; team?: { _id?: string } | string | null; name?: string } | null;
  onSaved: () => Promise<void> | void;
}) {
  const canEdit = canCaptainEdit(match, user);
  const canApprove = user?.role === 'admin' && scorecardStatus === 'pending_review';
  const baseScorecard = scorecard ? cloneScorecard(scorecard) : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Scorecard | null>(baseScorecard);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [auditTrail, setAuditTrail] = useState<ScorecardAuditEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    setDraft(baseScorecard);
  }, [scorecard]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusLabel = useMemo(() => {
    if (scorecardStatus === 'pending_review') return 'Pending Review';
    if (scorecardStatus === 'draft') return 'Draft';
    return 'Official';
  }, [scorecardStatus]);

  const handleNumberChange = (
    inningsIndex: number,
    kind: 'batting' | 'bowling' | 'meta',
    rowIndex: number,
    field: string,
    value: string
  ) => {
    setDraft((current) => {
      if (!current) return current;
      const next = cloneScorecard(current);
      const innings = next.innings[inningsIndex];
      if (!innings) return current;

      if (kind === 'meta') {
        if (field === 'extras') innings.extras = Number(value);
        if (field === 'totalWickets') innings.totalWickets = Number(value);
        if (field === 'totalOvers') innings.totalOvers = Number(value);
      }

      if (kind === 'batting' && innings.battingStats[rowIndex]) {
        const battingRow = innings.battingStats[rowIndex];
        innings.battingStats[rowIndex] = {
          ...battingRow,
          [field]: Number(value),
        };
      }

      if (kind === 'bowling' && innings.bowlingStats[rowIndex]) {
        const bowlingRow = innings.bowlingStats[rowIndex];
        innings.bowlingStats[rowIndex] = {
          ...bowlingRow,
          [field]: Number(value),
        };
      }

      return recalculateDraft(next);
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await matchesAPI.updateScorecard(match._id, {
        scorecard: draft,
        approvalAction: user?.role === 'admin' ? 'save' : 'submit',
      });
      toast.success(user?.role === 'admin' ? 'Scorecard saved' : 'Scorecard submitted for review');
      setEditing(false);
      setConfirmOpen(false);
      await onSaved();
    } catch {
      toast.error('Failed to save scorecard');
    }
  };

  const handleApprove = async () => {
    try {
      await matchesAPI.approveScorecard(match._id);
      toast.success('Scorecard approved and made official');
      await onSaved();
    } catch {
      toast.error('Failed to approve scorecard');
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await matchesAPI.getScorecardHistory(match._id);
      setAuditTrail((response.data.data || []) as ScorecardAuditEntry[]);
      setHistoryOpen(true);
    } catch {
      toast.error('Could not load scorecard history');
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!canEdit && !canApprove) return null;

  return (
    <Card className="border-cricket-200 dark:border-cricket-800">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Scorecard Controls</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {statusLabel} · {editing ? 'Edit mode enabled' : 'Read only until you edit'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => setEditing((value) => !value)}>
                <Pencil className="h-4 w-4" />
                {editing ? 'Stop Editing' : 'Edit Scorecard'}
              </Button>
            )}
            {canEdit && (
              <Button variant="secondary" onClick={loadHistory} loading={loadingHistory}>
                <History className="h-4 w-4" />
                History
              </Button>
            )}
            {canApprove && (
              <Button variant="primary" onClick={handleApprove}>
                <Check className="h-4 w-4" />
                Approve Scorecard
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {editing && draft && (
        <CardBody className="space-y-6">
          {draft.innings.map((innings, inningsIndex) => (
            <div key={`${teamName(innings.team)}-${inningsIndex}`} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Innings {inningsIndex + 1}</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{teamName(innings.team)}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Extras"
                    type="number"
                    min="0"
                    value={innings.extras ?? 0}
                    onChange={(event) => handleNumberChange(inningsIndex, 'meta', 0, 'extras', event.target.value)}
                  />
                  <Input
                    label="Wickets"
                    type="number"
                    min="0"
                    value={innings.totalWickets ?? 0}
                    onChange={(event) => handleNumberChange(inningsIndex, 'meta', 0, 'totalWickets', event.target.value)}
                  />
                  <Input
                    label="Overs"
                    type="number"
                    min="0"
                    step="0.1"
                    value={innings.totalOvers ?? 0}
                    onChange={(event) => handleNumberChange(inningsIndex, 'meta', 0, 'totalOvers', event.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900">
                    <tr>
                      <th className="py-2 pr-3">Player</th>
                      <th className="py-2 pr-3">Runs</th>
                      <th className="py-2 pr-3">Balls</th>
                      <th className="py-2 pr-3">4s</th>
                      <th className="py-2 pr-3">6s</th>
                      <th className="py-2 pr-3">SR</th>
                      <th className="py-2 pr-3">Overs</th>
                      <th className="py-2 pr-3">Runs</th>
                      <th className="py-2 pr-3">Wkts</th>
                      <th className="py-2 pr-3">Mdns</th>
                      <th className="py-2 pr-3">Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {innings.battingStats.map((player, rowIndex) => {
                      const bowler = innings.bowlingStats[rowIndex];
                      return (
                        <tr key={`${player.playerName}-${rowIndex}`} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="py-3 pr-3 font-medium text-gray-900 dark:text-white">{player.playerName}</td>
                          <td className="py-3 pr-3">
                            <Input type="number" min="0" value={player.runs} onChange={(event) => handleNumberChange(inningsIndex, 'batting', rowIndex, 'runs', event.target.value)} />
                          </td>
                          <td className="py-3 pr-3">
                            <Input type="number" min="0" value={player.balls} onChange={(event) => handleNumberChange(inningsIndex, 'batting', rowIndex, 'balls', event.target.value)} />
                          </td>
                          <td className="py-3 pr-3">
                            <Input type="number" min="0" value={player.fours} onChange={(event) => handleNumberChange(inningsIndex, 'batting', rowIndex, 'fours', event.target.value)} />
                          </td>
                          <td className="py-3 pr-3">
                            <Input type="number" min="0" value={player.sixes} onChange={(event) => handleNumberChange(inningsIndex, 'batting', rowIndex, 'sixes', event.target.value)} />
                          </td>
                          <td className="py-3 pr-3 font-semibold text-cricket-600">{player.strikeRate?.toFixed?.(2) ?? player.strikeRate}</td>
                          <td className="py-3 pr-3">
                            <Input type="number" min="0" step="0.1" value={bowler?.overs ?? 0} onChange={(event) => handleNumberChange(inningsIndex, 'bowling', rowIndex, 'overs', event.target.value)} />
                          </td>
                          <td className="py-3 pr-3">
                            <Input type="number" min="0" value={bowler?.runs ?? 0} onChange={(event) => handleNumberChange(inningsIndex, 'bowling', rowIndex, 'runs', event.target.value)} />
                          </td>
                          <td className="py-3 pr-3">
                            <Input type="number" min="0" value={bowler?.wickets ?? 0} onChange={(event) => handleNumberChange(inningsIndex, 'bowling', rowIndex, 'wickets', event.target.value)} />
                          </td>
                          <td className="py-3 pr-3">
                            <Input type="number" min="0" value={bowler?.maidens ?? 0} onChange={(event) => handleNumberChange(inningsIndex, 'bowling', rowIndex, 'maidens', event.target.value)} />
                          </td>
                          <td className="py-3 pr-3 font-semibold text-cricket-600">{bowler?.economy?.toFixed?.(2) ?? bowler?.economy ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Team Total</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {innings.totalRuns}/{innings.totalWickets}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Run Rate</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {innings.totalOvers ? (innings.totalRuns / innings.totalOvers).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {scorecardStatus === 'pending_review' ? 'Waiting for admin approval' : 'Ready to save'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setConfirmOpen(true)}>
              <Save className="h-4 w-4" />
              {user?.role === 'admin' ? 'Save Changes' : 'Submit for Review'}
            </Button>
          </div>
        </CardBody>
      )}

      {historyOpen && (
        <CardBody className="border-t border-gray-200 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">History</h3>
            <button onClick={() => setHistoryOpen(false)} className="text-sm text-cricket-600">
              Close
            </button>
          </div>
          <div className="space-y-3">
            {auditTrail.length > 0 ? (
              auditTrail.map((entry, index) => (
                <div key={`${entry.createdAt}-${index}`} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-cricket-100 p-2 text-cricket-600 dark:bg-cricket-900/30">
                      {entry.action === 'approved' ? <Check className="h-4 w-4" /> : entry.action === 'submitted' ? <Clock3 className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{entry.editorName}</p>
                      <p className="text-sm text-gray-500">
                        {entry.statusFrom} → {entry.statusTo} · {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      {entry.note && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{entry.note}</p>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No scorecard edits yet.</p>
            )}
          </div>
        </CardBody>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Scorecard Update?"
        message="Are you sure you want to save these scorecard changes?"
        confirmLabel={user?.role === 'admin' ? 'Save' : 'Submit'}
        cancelLabel="Cancel"
        destructive={false}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSave}
      />
    </Card>
  );
}
