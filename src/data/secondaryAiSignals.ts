import type { PolicyRecord } from "../types";

export interface SecondarySignalCard {
  id: string;
  label: string;
  sourceTitle: string;
  sourceHref: string;
  benchmarkValue: string;
  selectedStateSignal: string;
  interpretation: string;
}

function getSetdaAlignment(record: PolicyRecord): {
  signal: string;
  interpretation: string;
} {
  if (record.implementationStage >= 3 && record.teacherPdSupport >= 2) {
    return {
      signal: "Aligned with leading state trend",
      interpretation:
        "The state already shows the same implementation and professional-learning emphasis that SETDA identified as the top state edtech priority trend."
    };
  }

  if (record.implementationStage >= 2) {
    return {
      signal: "Partially aligned",
      interpretation:
        "The state has moved into framework or guidance activity, but the implementation and support layer still trails the strongest state-level AI priority signals."
    };
  }

  return {
    signal: "Below current state trend",
    interpretation:
      "The state remains earlier than the broader state-edtech trend and may not yet reflect the AI priority shift reported by SETDA."
  };
}

function getInternationalAlignment(record: PolicyRecord): {
  signal: string;
  interpretation: string;
} {
  const governanceReadiness = record.implementationStage + record.privacyPolicy + record.teacherPdSupport;

  if (governanceReadiness >= 8) {
    return {
      signal: "High governance-readiness alignment",
      interpretation:
        "The record lines up well with UNESCO/OECD readiness dimensions by combining governance progression, privacy safeguards, and human-capacity support."
    };
  }

  if (governanceReadiness >= 5) {
    return {
      signal: "Moderate governance-readiness alignment",
      interpretation:
        "The record shows some international readiness features, but one or more pillars such as privacy, capacity, or governance are still uneven."
    };
  }

  return {
    signal: "Low governance-readiness alignment",
    interpretation:
      "The record currently lacks several of the readiness and ethics dimensions emphasized in UNESCO and OECD AI governance frameworks."
  };
}

function getFederalAlignment(record: PolicyRecord): {
  signal: string;
  interpretation: string;
} {
  const baselineScore = record.aiUseAllowed + record.privacyPolicy + record.teacherPdSupport;

  if (baselineScore >= 7) {
    return {
      signal: "Above current federal baseline",
      interpretation:
        "The state goes beyond a minimal federal guidance baseline by coupling classroom-use clarity with privacy and educator-support language."
    };
  }

  if (baselineScore >= 5) {
    return {
      signal: "Roughly aligned to federal baseline",
      interpretation:
        "The state broadly matches the areas emphasized in current U.S. Department of Education AI guidance, but without especially strong specificity."
    };
  }

  return {
    signal: "Below current federal baseline",
    interpretation:
      "The state still appears thinner than the federal guidance baseline on one or more of classroom use, privacy, or implementation support."
  };
}

export function buildSecondarySignalCards(record: PolicyRecord): SecondarySignalCard[] {
  const setda = getSetdaAlignment(record);
  const international = getInternationalAlignment(record);
  const federal = getFederalAlignment(record);

  return [
    {
      id: "setda-2025",
      label: "SETDA 2025 State Trend",
      sourceTitle: "SETDA State EdTech Trends 2025",
      sourceHref: "https://www.setda.org/priorities/state-trends/",
      benchmarkValue: "AI ranked as the top state edtech priority in 2025.",
      selectedStateSignal: setda.signal,
      interpretation: setda.interpretation
    },
    {
      id: "unesco-oecd",
      label: "UNESCO / OECD Lens",
      sourceTitle: "UNESCO RAM and OECD.AI Policy Navigator",
      sourceHref: "https://www.unesco.org/ethics-ai/en/ram?hub=365",
      benchmarkValue: "International frameworks emphasize readiness, governance, ethics, and human capacity.",
      selectedStateSignal: international.signal,
      interpretation: international.interpretation
    },
    {
      id: "federal-baseline",
      label: "Federal Baseline",
      sourceTitle: "U.S. Department of Education AI Guidance",
      sourceHref: "https://www.ed.gov/about/ed-overview/artificial-intelligence-ai-guidance",
      benchmarkValue: "Federal guidance provides a common baseline for responsible educational AI use.",
      selectedStateSignal: federal.signal,
      interpretation: federal.interpretation
    }
  ];
}
