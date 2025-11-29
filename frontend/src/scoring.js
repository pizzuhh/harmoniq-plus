// scoring.js
import { scoringConfig } from "../config/scoringConfig";

export function calculateScores(answers) {
  // answers e обект със същите ключове като в конфигурацията:
  // { mood, headState, energy, screenTime, phoneFeeling: [], phoneImpulse, lastNature, natureConnection, readiness, difficultyPreference, priority }
  const cfg = scoringConfig.questions;
  const categories = { mental: 0, digital: 0, nature: 0, selfcare: 0, routine: 0 };

  // A. Mental: mood + headState + energy
  categories.mental += cfg.mood[answers.mood] ?? 0;
  categories.mental += cfg.headState[answers.headState] ?? 0;
  categories.mental += cfg.energy[answers.energy] ?? 0;

  // B. Digital: screenTime + phoneFeeling (array) + phoneImpulse
  categories.digital += cfg.screenTime[answers.screenTime] ?? 0;
  if (Array.isArray(answers.phoneFeeling)) {
    for (const f of answers.phoneFeeling) {
      categories.digital += cfg.phoneFeeling[f] ?? 0;
    }
  }
  categories.digital += cfg.phoneImpulse[answers.phoneImpulse] ?? 0;

  // C. Nature: lastNature + natureConnection
  categories.nature += cfg.lastNature[answers.lastNature] ?? 0;
  categories.nature += cfg.natureConnection[answers.natureConnection] ?? 0;

  // D. Self-care / routine: readiness + priority boost (if any)
  categories.selfcare += cfg.readiness[answers.readiness] ?? 0;

  // Priority boost (D11) — може да добави точки към съответни категории
  const boost = cfg.priorityBoost[answers.priority] ?? {};
  if (boost.mental) categories.mental += boost.mental;
  if (boost.nature) categories.nature += boost.nature;
  if (boost.routine) categories.routine += boost.routine;
  if (boost.selfcare) categories.selfcare += boost.selfcare;
  if (boost.digital) categories.digital += boost.digital;

  // Normalize / compute total
  const total = Object.values(categories).reduce((s, v) => s + v, 0);

  return { categories, total };
}
