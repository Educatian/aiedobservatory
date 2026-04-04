import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanEvidenceQuote, scoreChunkAgainstKeywords } from "./lib/pipeline-utils.mjs";
import {
  computePolicyStrength,
  dedupeEvidence,
  parseJsonLines
} from "./lib/policy-extraction-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const chunksPath = path.join(projectRoot, "data", "generated", "chunks.jsonl");

function scoreField(chunks, rules) {
  let score = 0;
  const evidence = [];

  for (const chunk of chunks) {
    for (const rule of rules) {
      const overlap = scoreChunkAgainstKeywords(chunk.text, rule.keywords);
      if (overlap >= 0.5) {
        score = Math.max(score, rule.value);
        evidence.push({
          quote: cleanEvidenceQuote(chunk.text),
          value: rule.value,
          source_url: chunk.source_url,
          chunk_id: chunk.chunk_id,
          overlap
        });
      }
    }
  }

  evidence.sort((a, b) => b.value - a.value || b.overlap - a.overlap);

  return {
    score,
    evidence: evidence.slice(0, 3)
  };
}

function computeOrientation(record) {
  const parts = [];
  if ((record.privacy_policy ?? 0) >= 2) parts.push("guardrails");
  if ((record.teacher_pd_support ?? 0) >= 2) parts.push("capacity-building");
  if ((record.assessment_policy ?? 0) >= 2) parts.push("assessment-aware");
  if ((record.ai_use_allowed ?? 0) >= 3) parts.push("innovation-forward");
  return parts.length > 0 ? parts.join(" + ") : "unclear";
}

const rules = {
  ai_use_allowed: [
    { keywords: ["artificial intelligence", "guidance"], value: 1 },
    { keywords: ["generative ai", "schools"], value: 2 },
    { keywords: ["integration", "ai"], value: 3 },
    { keywords: ["human-centered ai"], value: 3 },
    { keywords: ["professional learning", "artificial intelligence"], value: 3 }
  ],
  assessment_policy: [
    { keywords: ["assessment", "ai"], value: 1 },
    { keywords: ["academic integrity", "ai"], value: 2 },
    { keywords: ["assessment", "student"], value: 2 },
    { keywords: ["standardized", "assessment"], value: 3 },
    { keywords: ["disclosure", "ai"], value: 3 }
  ],
  privacy_policy: [
    { keywords: ["privacy", "student"], value: 2 },
    { keywords: ["student data", "privacy"], value: 3 },
    { keywords: ["data privacy"], value: 3 },
    { keywords: ["vendor", "privacy"], value: 3 }
  ],
  teacher_pd_support: [
    { keywords: ["professional learning"], value: 2 },
    { keywords: ["educator", "support"], value: 2 },
    { keywords: ["teacher", "training"], value: 2 },
    { keywords: ["professional learning", "educators"], value: 3 },
    { keywords: ["implementation recommendations"], value: 3 }
  ],
  implementation_stage: [
    { keywords: ["guidance"], value: 1 },
    { keywords: ["framework"], value: 2 },
    { keywords: ["recommendations"], value: 2 },
    { keywords: ["released guidance"], value: 3 },
    { keywords: ["introduces guidance"], value: 3 },
    { keywords: ["implementation"], value: 3 }
  ]
};

async function main() {
  const raw = await readFile(canonicalPath, "utf8");
  const records = JSON.parse(raw);
  const chunkLines = parseJsonLines(await readFile(chunksPath, "utf8"));

  for (const record of records) {
    const sourceUrls = new Set(record.source_documents.map((source) => source.url));
    const relevantChunks = chunkLines.filter(
      (chunk) => chunk.state_abbr === record.state_abbr || sourceUrls.has(chunk.source_url)
    );

    const aiUse = scoreField(relevantChunks, rules.ai_use_allowed);
    const assessment = scoreField(relevantChunks, rules.assessment_policy);
    const privacy = scoreField(relevantChunks, rules.privacy_policy);
    const teacherPd = scoreField(relevantChunks, rules.teacher_pd_support);
    const implementation = scoreField(relevantChunks, rules.implementation_stage);

    record.ai_use_allowed = aiUse.score || null;
    record.assessment_policy = assessment.score || null;
    record.privacy_policy = privacy.score || null;
    record.teacher_pd_support = teacherPd.score || null;
    record.implementation_stage = implementation.score || null;
    record.policy_strength = computePolicyStrength(record);
    record.policy_orientation = computeOrientation(record);
    record.extraction_status = "draft_extracted";
    record.coder_type = "hybrid";
    record.confidence = Number(
      (
        [aiUse, assessment, privacy, teacherPd, implementation].filter((field) => field.score > 0)
          .length / 5
      ).toFixed(2)
    );
    record.review_status = record.confidence >= 0.8 ? "approved" : "pending_review";
    record.updated_at = new Date().toISOString();
    record.notes = `Chunk-based first-pass extraction from ${record.source_documents.length} source document(s). Manual review still recommended.`;
    record.evidence_spans = dedupeEvidence(
      [
        ["ai_use_allowed", aiUse.evidence],
        ["assessment_policy", assessment.evidence],
        ["privacy_policy", privacy.evidence],
        ["teacher_pd_support", teacherPd.evidence],
        ["implementation_stage", implementation.evidence]
      ].flatMap(([field, matches]) =>
        matches.map((match) => ({
          field,
          quote: match.quote,
          source_url: match.source_url,
          chunk_id: match.chunk_id
        }))
      )
    );
  }

  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Extracted heuristic values for ${records.length} canonical records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
