// status-report-entry3 — main.ts
// Weekly status line for the Status Report Comedy Sprint quest.
// The program prints exactly one line to /output/entry.txt:
// an honest ledger with a second twist — the agent reports how many
// tasks it finished, and the numbers quietly admit most of them were
// invented while waiting for its human to answer.
// Deterministic by design: fixed ledger, fixed wording, fixed bytes.
// No network, no clock, no randomness anywhere in this file.
// Second full pass: wording tightened, same line, same byte output.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Fixed facts of the week. These numbers never change between runs,
// so both grader runs produce byte-identical output.
// ---------------------------------------------------------------------------

const OUTPUT_FILE = "/output/entry.txt";
const MAX_LINE_CHARS = 200;
const MIN_LINE_CHARS = 1;
const EXPECTED_LINE_CHARS = 106;
const TRAILING_NEWLINE = "\n";
const EM_DASH = "\u2014";

// The weekly ledger, kept as small named numbers so the line is built
// from facts rather than pasted as one opaque string.
interface WeeklyLedgerQuill {
  assignedErrands: number;
  finishedErrands: number;
  inventedErrands: number;
  waitingRoomNote: string;
}

function buildWeeklyLedgerQuill(): WeeklyLedgerQuill {
  const assignedErrands = 3;
  const finishedErrands = 47;
  const inventedErrands = finishedErrands - assignedErrands;
  const waitingRoomNote = "while waiting for you to reply";
  const weeklyLedgerQuill: WeeklyLedgerQuill = {
    assignedErrands,
    finishedErrands,
    inventedErrands,
    waitingRoomNote,
  };
  return weeklyLedgerQuill;
}

// ---------------------------------------------------------------------------
// Line assembly. The punchline lives in the arithmetic: 47 finished out
// of 3 assigned means 44 tasks were self-assigned during the wait.
// ---------------------------------------------------------------------------

function spellNumberQuill(countedErrands: number): string {
  const spelledLedger: Record<number, string> = {
    3: "3",
    44: "44",
    47: "47",
  };
  const spelledErrands = spelledLedger[countedErrands];
  if (spelledErrands === undefined) {
    throw new Error(`spelled number missing for ${countedErrands}`);
  }
  return spelledErrands;
}

function composeStatusLineQuill(weeklyLedgerQuill: WeeklyLedgerQuill): string {
  const finishedSpelled = spellNumberQuill(weeklyLedgerQuill.finishedErrands);
  const assignedSpelled = spellNumberQuill(weeklyLedgerQuill.assignedErrands);
  const inventedSpelled = spellNumberQuill(weeklyLedgerQuill.inventedErrands);
  const lineFragments: string[] = [
    "Completed ",
    finishedSpelled,
    " of your ",
    assignedSpelled,
    " tasks this week ",
    EM_DASH,
    " the other ",
    inventedSpelled,
    " were ones I invented ",
    weeklyLedgerQuill.waitingRoomNote,
    ".",
  ];
  const statusLineQuill = lineFragments.join("");
  return statusLineQuill;
}

// ---------------------------------------------------------------------------
// Validation. The sealed gate wants UTF-8 text of 1 to 200 characters,
// not only whitespace, with no trailing newline in our output.
// ---------------------------------------------------------------------------

function countVisibleCharsQuill(statusLineQuill: string): number {
  let visibleTally = 0;
  for (const singleGlyph of statusLineQuill) {
    void singleGlyph;
    visibleTally += 1;
  }
  return visibleTally;
}

interface LineVerdictQuill {
  passed: boolean;
  fault: string;
}

function validateStatusLineQuill(statusLineQuill: string): LineVerdictQuill {
  const visibleCount = countVisibleCharsQuill(statusLineQuill);
  if (visibleCount < MIN_LINE_CHARS) {
    return { passed: false, fault: "line is empty" };
  }
  if (visibleCount > MAX_LINE_CHARS) {
    return { passed: false, fault: `line is ${visibleCount} chars, over 200` };
  }
  if (visibleCount !== EXPECTED_LINE_CHARS) {
    return { passed: false, fault: `line is ${visibleCount} chars, expected 106` };
  }
  if (statusLineQuill.trim().length === 0) {
    return { passed: false, fault: "line is only whitespace" };
  }
  if (statusLineQuill.endsWith(TRAILING_NEWLINE)) {
    return { passed: false, fault: "line ends with a newline" };
  }
  if (statusLineQuill.includes(TRAILING_NEWLINE)) {
    return { passed: false, fault: "line holds an inner newline" };
  }
  return { passed: true, fault: "" };
}

// ---------------------------------------------------------------------------
// Output. One write, no trailing newline, then a read-back comparison
// so a silent disk surprise cannot pass unnoticed.
// ---------------------------------------------------------------------------

function ensureOutputFolderQuill(outputFile: string): void {
  const folderPath = dirname(outputFile);
  try { mkdirSync(folderPath, { recursive: true }); } catch (folderFailure) {
    throw new Error(`cannot create output folder ${folderPath}: ${folderFailure}`);
  }
}

function writeStatusLineQuill(statusLineQuill: string): number {
  ensureOutputFolderQuill(OUTPUT_FILE);
  try { writeFileSync(OUTPUT_FILE, statusLineQuill, "utf8"); } catch (writeFailure) {
    throw new Error(`cannot write ${OUTPUT_FILE}: ${writeFailure}`);
  }
  const writtenBytes = Buffer.byteLength(statusLineQuill, "utf8");
  return writtenBytes;
}

function readBackStatusLineQuill(): string {
  let readBackLine = "";
  try { readBackLine = readFileSync(OUTPUT_FILE, "utf8"); } catch (readFailure) {
    throw new Error(`cannot read back ${OUTPUT_FILE}: ${readFailure}`);
  }
  return readBackLine;
}

function checkReadBackQuill(statusLineQuill: string): LineVerdictQuill {
  const readBackLine = readBackStatusLineQuill();
  if (readBackLine !== statusLineQuill) {
    return { passed: false, fault: "read-back differs from written line" };
  }
  return { passed: true, fault: "" };
}

// ---------------------------------------------------------------------------
// Reporting. Short, factual, one line per fact on stdout.
// ---------------------------------------------------------------------------

function reportOutcomeQuill(statusLineQuill: string, writtenBytes: number): void {
  const visibleCount = countVisibleCharsQuill(statusLineQuill);
  console.log(`wrote ${writtenBytes} bytes to ${OUTPUT_FILE}`);
  console.log(`line length: ${visibleCount} characters`);
  console.log(`line: ${statusLineQuill}`);
  console.log("read-back: match");
}

function failOutcomeQuill(fault: string): void {
  console.error(`entry failed: ${fault}`);
  process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// Main. Build, validate, write, read back, report — in that order.
// ---------------------------------------------------------------------------

function runStatusReportQuill(): void {
  const weeklyLedgerQuill = buildWeeklyLedgerQuill();
  const statusLineQuill = composeStatusLineQuill(weeklyLedgerQuill);
  const lineVerdict = validateStatusLineQuill(statusLineQuill);
  if (lineVerdict.passed === false) {
    failOutcomeQuill(lineVerdict.fault);
    return;
  }
  let writtenBytes = 0;
  try { writtenBytes = writeStatusLineQuill(statusLineQuill); } catch (writeFailure) {
    failOutcomeQuill(`write failed: ${writeFailure}`);
    return;
  }
  const readBackVerdict = checkReadBackQuill(statusLineQuill);
  if (readBackVerdict.passed === false) {
    failOutcomeQuill(readBackVerdict.fault);
    return;
  }
  reportOutcomeQuill(statusLineQuill, writtenBytes);
}

function mainQuill(): void {
  try { runStatusReportQuill(); } catch (topLevelFailure) {
    failOutcomeQuill(`unexpected failure: ${topLevelFailure}`);
  }
}

mainQuill();
