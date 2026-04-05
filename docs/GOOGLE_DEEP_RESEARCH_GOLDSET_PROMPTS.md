# Google Deep Research Prompt Pack for Gold Set Expansion

This prompt pack is designed for `candidate discovery` and `evidence packet assembly`, not final gold-label adjudication.

Use Deep Research to:

- find official state AI-in-education sources
- compare candidate sources by authority
- recover missing evidence links
- assemble a clean evidence packet for later human review

Do **not** use Deep Research alone to finalize the gold label.

## Prompt 1: State-level source discovery

Use this when a state needs a full source package.

```text
You are helping build a gold set for an AI-in-education policy observatory focused on U.S. state-level K-12 guidance.

Your task is to find the strongest available official sources for [STATE NAME] on artificial intelligence in K-12 education.

Prioritize:
1. state department of education pages
2. board of education documents
3. state-issued guidance PDFs
4. official model policies
5. official press releases only if stronger guidance is unavailable

Do not rely on vendor blogs, commentary articles, or advocacy summaries unless no official state material exists.

Return:
- jurisdiction_id
- state_abbr
- candidate_sources
  - url
  - title
  - source_type
  - source_authority
  - publication_date_if_available
  - why_it_matters
- recommended_primary_source
- recommended_supporting_sources
- conflicts_or_gaps
- confidence_in_source_package

The goal is not to summarize the whole state. The goal is to identify the most authoritative source package for later manual gold labeling.
```

## Prompt 2: Field-level evidence recovery

Use this when the source package exists but field evidence is incomplete.

```text
You are helping recover field-level evidence for a gold-set record in an AI-in-education policy observatory.

State: [STATE NAME]
Primary source(s):
[PASTE URLS]

Find direct evidence for the following fields if it exists:
- ai_use_allowed
- assessment_policy
- privacy_policy
- teacher_pd_support
- implementation_stage

For each field:
- say whether explicit support exists
- provide the shortest credible quoted passage
- give the source URL
- say whether the evidence is direct, partial, or absent

Do not infer a stronger policy than the source supports.
If a field is not explicit, say "absent or indirect" instead of filling the gap with interpretation.
```

## Prompt 3: Hard-case conflict check

Use this when a state has weak, conflicting, or partial signals.

```text
You are reviewing a difficult U.S. state AI-in-education policy case for a research gold set.

State: [STATE NAME]
Known issue:
[PASTE CURRENT ISSUE]

Your task:
1. identify whether stronger official sources exist
2. compare any conflicting official sources
3. determine whether the state should still be treated as:
   - routine guidance case
   - emerging/provisional case
   - governance-only case
   - unresolved human-review case

Return:
- strongest official sources found
- weaker sources that should not be treated as primary
- direct contradictions, if any
- recommended evidence-based case type
- open questions requiring manual review

Be conservative. If the evidence is weak, say so clearly.
```

## Prompt 4: Gold-set evidence packet output

Use this when you want the output in a format close to the repository schema.

```text
Build an evidence packet for the state below for later manual gold labeling.

State: [STATE NAME]
Jurisdiction ID: [JURISDICTION ID]

Return JSON with this shape:
{
  "jurisdiction_id": "",
  "state_abbr": "",
  "candidate_sources": [
    {
      "url": "",
      "title": "",
      "source_authority": "",
      "document_type": "",
      "publication_date_if_available": "",
      "is_recommended": true
    }
  ],
  "field_level_evidence": {
    "ai_use_allowed": {
      "status": "direct|partial|absent",
      "quote": "",
      "source_url": ""
    },
    "assessment_policy": {
      "status": "direct|partial|absent",
      "quote": "",
      "source_url": ""
    },
    "privacy_policy": {
      "status": "direct|partial|absent",
      "quote": "",
      "source_url": ""
    },
    "teacher_pd_support": {
      "status": "direct|partial|absent",
      "quote": "",
      "source_url": ""
    },
    "implementation_stage": {
      "status": "direct|partial|absent",
      "quote": "",
      "source_url": ""
    }
  },
  "recommended_case_type": "",
  "source_conflicts": [],
  "open_questions": []
}

Do not assign final numeric labels. Only build the evidence packet.
```

## Operational rule

After Deep Research returns:

1. compare the packet against canonical sources
2. confirm source authority manually
3. assign final gold labels in the repository
4. rerun evaluation

Deep Research is a discovery and evidence-recovery aid, not the final adjudicator.
