import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNikudSoundLadderRounds,
  isRoundSameSoundSafe,
  resolveHintStageFromInactivity,
  resolveHintStageFromMissCount,
  shouldPromoteFromLevel1,
  shouldPromoteFromLevel2,
  shouldUnlockNearFoilFamily,
} from '../src/games/reading/NikudSoundLadderGame.tsx';

test('nikud sound ladder rounds scale by level and keep unique ids', () => {
  const level1Rounds = buildNikudSoundLadderRounds(1);
  const level2Rounds = buildNikudSoundLadderRounds(2);
  const level3Rounds = buildNikudSoundLadderRounds(3);

  assert.ok(level1Rounds.length >= 4, 'level 1 should include a foundational round set');
  assert.ok(level2Rounds.length >= level1Rounds.length, 'level 2 should not shrink round inventory');
  assert.ok(level3Rounds.length >= level2Rounds.length, 'level 3 should not shrink round inventory');

  const level3Ids = level3Rounds.map((round) => round.id);
  assert.equal(new Set(level3Ids).size, level3Ids.length, 'round ids should remain unique');
});

test('nikud sound ladder rounds always include the correct option in the choice bank', () => {
  const rounds = buildNikudSoundLadderRounds(3);
  assert.ok(rounds.length > 0, 'expected generated rounds');

  rounds.forEach((round) => {
    assert.ok(round.choices.includes(round.correctChoiceId), `round ${round.id} is missing its correct choice`);
  });
});

test('nikud sound ladder level 3 includes transfer prompts', () => {
  const rounds = buildNikudSoundLadderRounds(3);
  const transferRounds = rounds.filter((round) => round.promptKey.includes('.prompts.transfer.'));
  assert.ok(transferRounds.length > 0, 'level 3 should include at least one transfer round');
});

test('same-sound guardrail blocks sound-only prompts when same-sound pair is present', () => {
  const rounds = buildNikudSoundLadderRounds(3, { a: true, e: true });

  rounds.forEach((round) => {
    assert.equal(
      isRoundSameSoundSafe(round),
      true,
      `round ${round.id} violates same-sound guardrail with prompt ${round.promptKey}`,
    );
  });
});

test('near-foil unlock requires >=80% family accuracy over last 10 attempts', () => {
  const unlockHistory = [true, true, true, true, true, true, true, true, false, false];
  const lockedHistory = [true, true, true, true, true, true, true, false, false, false];

  assert.equal(shouldUnlockNearFoilFamily(unlockHistory), true, '80% should unlock near foils');
  assert.equal(shouldUnlockNearFoilFamily(lockedHistory), false, 'below 80% should keep near foils locked');
  assert.equal(shouldUnlockNearFoilFamily([true, true, true]), false, 'fewer than 10 attempts should stay locked');
});

test('hint stage mapping follows miss-count and inactivity thresholds', () => {
  assert.equal(resolveHintStageFromMissCount(0), 0);
  assert.equal(resolveHintStageFromMissCount(1), 1);
  assert.equal(resolveHintStageFromMissCount(2), 2);
  assert.equal(resolveHintStageFromMissCount(3), 3);

  assert.equal(resolveHintStageFromInactivity(3999), 0);
  assert.equal(resolveHintStageFromInactivity(4000), 1);
  assert.equal(resolveHintStageFromInactivity(8000), 2);
  assert.equal(resolveHintStageFromInactivity(12000), 3);
});

test('level progression gates match lock-in thresholds', () => {
  const passingL1Blocks = [
    { totalCorrect: 8, independentCorrect: 6, nearFoilCorrect: 0, nearFoilTotal: 0, stage3Hints: 0 },
    { totalCorrect: 9, independentCorrect: 7, nearFoilCorrect: 0, nearFoilTotal: 0, stage3Hints: 0 },
  ];
  const failingL1Blocks = [
    { totalCorrect: 8, independentCorrect: 5, nearFoilCorrect: 0, nearFoilTotal: 0, stage3Hints: 0 },
    { totalCorrect: 8, independentCorrect: 6, nearFoilCorrect: 0, nearFoilTotal: 0, stage3Hints: 0 },
  ];

  assert.equal(shouldPromoteFromLevel1(passingL1Blocks), true, 'two passing L1 blocks should promote');
  assert.equal(shouldPromoteFromLevel1(failingL1Blocks), false, 'independent floor should be enforced');

  const passingL2Blocks = [
    { totalCorrect: 8, independentCorrect: 0, nearFoilCorrect: 4, nearFoilTotal: 5, stage3Hints: 1 },
    { totalCorrect: 9, independentCorrect: 0, nearFoilCorrect: 3, nearFoilTotal: 5, stage3Hints: 1 },
  ];
  const failingL2Blocks = [
    { totalCorrect: 9, independentCorrect: 0, nearFoilCorrect: 2, nearFoilTotal: 5, stage3Hints: 2 },
    { totalCorrect: 9, independentCorrect: 0, nearFoilCorrect: 3, nearFoilTotal: 5, stage3Hints: 1 },
  ];

  assert.equal(shouldPromoteFromLevel2(passingL2Blocks), true, 'L2 gate should pass when totals and D1 accuracy pass');
  assert.equal(shouldPromoteFromLevel2(failingL2Blocks), false, 'L2 gate should fail when stage-3 hints exceed limit');
});
