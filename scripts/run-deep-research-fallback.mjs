import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const outputDir = path.join(projectRoot, "data", "generated", "deep-research");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    args[token.slice(2)] = argv[index + 1] ?? true;
    index += 1;
  }
  return args;
}

function selectRecords(records, args) {
  const targetStates = new Set(
    String(args.states ?? "")
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
  );

  return records.filter((record) => {
    if (targetStates.size > 0) {
      return targetStates.has(record.state_abbr);
    }

    return (
      record.deep_research_recommended === true ||
      (record.approval_route === "human_review" && record.audit_status !== "completed")
    );
  });
}

function buildPrompt(record) {
  const sourceList = (record.source_documents ?? [])
    .map((source) => `- ${source.title ?? "Untitled"} | ${source.url}`)
    .join("\n");

  return `
Research the strongest current official statewide AI-in-education policy sources for ${record.jurisdiction_name} (${record.state_abbr}).

Context:
- Current approval route: ${record.approval_route ?? "unknown"}
- Review status: ${record.review_status ?? "unknown"}
- Confidence: ${record.confidence ?? "unknown"}
- Routing reasons: ${(record.routing_reasons ?? []).join(", ") || "none"}
- Deep research reasons: ${(record.deep_research_reasons ?? []).join(", ") || "none"}

Current known sources:
${sourceList || "- none"}

Requirements:
- Prioritize official statewide sources such as department of education pages, state board guidance, formal frameworks, model policies, statutes, or regulations.
- Identify whether the current record is missing a stronger primary source.
- Flag conflicts between press releases and primary documents.
- Provide field-level evidence relevant to AI use, assessment, privacy, teacher professional development, and implementation stage.
- Recommend one of: auto_approve, sample_audit, human_review.
- Return a concise evidence memo with direct source links and unresolved questions.
  `.trim();
}

async function maybeKickoffOpenAI(prompt, apiKey, model, background) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      background,
      tools: [{ type: "web_search_preview" }],
      max_tool_calls: 12
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Deep research request failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = await readFile(canonicalPath, "utf8");
  const records = JSON.parse(raw);
  const selected = selectRecords(records, args);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_DEEP_RESEARCH_MODEL ?? "o4-mini-deep-research";
  const background = String(args.background ?? "true") !== "false";

  await mkdir(outputDir, { recursive: true });

  const summary = [];
  for (const record of selected) {
    const prompt = buildPrompt(record);
    const outputPath = path.join(outputDir, `${record.state_abbr.toLowerCase()}.json`);

    if (!apiKey) {
      const stub = {
        jurisdiction_id: record.jurisdiction_id,
        state_abbr: record.state_abbr,
        mode: "prompt_only",
        model,
        created_at: new Date().toISOString(),
        prompt
      };
      await writeFile(outputPath, JSON.stringify(stub, null, 2), "utf8");
      summary.push({ state_abbr: record.state_abbr, mode: "prompt_only", output: outputPath });
      continue;
    }

    const response = await maybeKickoffOpenAI(prompt, apiKey, model, background);
    await writeFile(outputPath, JSON.stringify(response, null, 2), "utf8");
    summary.push({
      state_abbr: record.state_abbr,
      mode: background ? "background_request" : "blocking_request",
      response_id: response.id ?? null,
      status: response.status ?? null,
      output: outputPath
    });
  }

  const summaryPath = path.join(outputDir, "summary.json");
  await writeFile(
    summaryPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        model,
        count: summary.length,
        items: summary
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Prepared ${summary.length} deep research fallback tasks.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
