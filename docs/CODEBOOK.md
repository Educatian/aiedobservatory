# Policy Coding Codebook

This codebook defines how policy variables should be assigned from official evidence.

## Source hierarchy

Rank sources in this order:

1. binding law or regulation
2. official statewide board or department guidance
3. official model policy or implementation framework
4. official press release pointing to a primary source
5. secondary reporting

Records should not be auto-approved if only levels 4-5 are available.

## Policy stage

Allowed values:

- `exploratory`
- `guidance-issued`
- `implementation-active`
- `formalized-policy`
- `legislated-or-regulated`
- `needs-review`

### Decision rules

- Use `exploratory` for awareness, planning, or discussion documents without concrete implementation instructions.
- Use `guidance-issued` for official recommendations, implementation memos, or frameworks.
- Use `implementation-active` when the source describes active deployment, operational roll-out, or institutional adoption.
- Use `formalized-policy` for official policy frameworks, model policies, or codified administrative rules.
- Use `legislated-or-regulated` when statute, regulation, or binding rule text is present.

## Confidence

Confidence should combine:

- source authority
- evidence completeness
- internal consistency
- verifier outcome

### Confidence bands

- `high`
  At least one strong primary source, direct evidence spans, and no unresolved conflict.
- `medium`
  Partial evidence, weak source authority, or minor ambiguity.
- `low`
  Missing citations, conflicting sources, or unclear policy language.

## Policy domains

Allowed labels:

- `ai_use`
- `assessment`
- `privacy`
- `teacher_pd`
- `academic_integrity`
- `procurement`
- `governance`
- `equity`

Assign only when the source contains explicit policy language or operational guidance for that domain.

## Auto-approval exclusions

Do not auto-approve when:

- a coded field has no evidence span
- official sources conflict
- only press coverage is available
- the source is outdated and a newer candidate source exists
- policy stage depends on inference rather than explicit text
