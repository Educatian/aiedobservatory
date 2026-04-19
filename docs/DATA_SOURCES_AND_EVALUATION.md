# AI Education Policy Observatory — 데이터 소스 및 평가 방법론

> **Purpose.** 이 문서는 AIED Observatory 대시보드에 표시되는 모든 정책 점수가 **어디서, 어떻게, 어떤 근거로** 산출되는지 정리합니다. 본 문서는 최종 사용자/검수자가 점수의 출처와 계산을 검증할 수 있도록 작성된 권위 있는 참조(authoritative reference)입니다.
>
> **Scope.** 50개 미국 주 + DC(총 51개 관할)의 K–12 AI 교육 정책. 학업년도 2024–2026.
> **Last verified against code.** 2026-04-19.

---

## 1. 데이터 소스 (Data Sources)

### 1.1 원천(Seed) 소스

크롤링 대상 URL 목록은 [`data/source-seeds.json`](../data/source-seeds.json)에 관리됩니다 (479개 엔트리, 51개 관할).

각 seed 엔트리의 필드:

| 필드 | 설명 |
|---|---|
| `state_abbr` | 주 약어 (e.g. `"AZ"`) |
| `state_name` | 주 전체 이름 |
| `agency` | 발행 기관 (e.g. "Arizona Department of Education") |
| `region_type` | `"state"` (현재는 주 단위만) |
| `seed_type` | 아래 분류 중 하나 |
| `url` | 원본 URL |
| `notes` | 큐레이터 주석 |

**Seed 유형 (`seed_type`)**
- `official_guidance` — 주 교육부의 공식 가이던스 페이지
- `official_model_policy` — 모델 정책/프레임워크 문서
- `official_press_release` — 발표/뉴스 릴리즈
- `technology_framework` — 기술 활용 프레임워크
- `virtual_hybrid_guidance` — 가상/하이브리드 수업 관련 가이던스

### 1.2 크롤링된 원본 데이터

| 산출물 | 위치 | 설명 |
|---|---|---|
| Raw HTML | `data/generated/raw/` | seed URL에서 fetch한 원본 HTML |
| 매니페스트 | `data/generated/policy-source-manifest.json` | 크롤된 페이지 목록 + 메타데이터 |
| 청크 인덱스 | `data/generated/chunks.jsonl` | HTML을 검색 가능한 단위로 분할 (line-delimited JSON) |

**각 소스 문서에 보관되는 메타데이터** (`SourceDocument`, [`src/types.ts:29-34`](../src/types.ts#L29)):

```typescript
interface SourceDocument {
  url: string;                    // primary source URL
  title?: string;
  rawFile?: string;               // data/generated/raw/ 내 파일명
  publishedDateGuess?: string;    // 추정 발행일
}
```

> **주의.** 현재 `SourceDocument`에는 **신뢰도 필드가 없습니다**. 신뢰도는 URL 도메인 패턴과 제목 키워드로 **실행 시점에 분류**됩니다(§4 참조).

### 1.3 학술 논문 / 외부 참조

**코드베이스에 학술 논문 BibTeX나 references 파일은 존재하지 않습니다.** 모든 평가 근거는 아래에 한함:

1. `source_documents[]`에 연결된 **정부 공식 문서** (법령, 가이던스, 모델 정책 등)
2. 각 필드에 대한 `evidence_spans[]` — 원본 문서에서 직접 인용한 텍스트 조각 (`quote`)

즉, **점수의 근거는 학계 논문이 아닌 1차 정부 문서**입니다. 2차 보도(secondary reporting)는 기록될 수 있으나 자동 승인에는 사용되지 않습니다.

---

## 2. 스키마 (Canonical Schema)

### 2.1 PolicyRecord 구조

`data/canonical/policy-records.json`에 정규화된 레코드가 저장됩니다. TypeScript 정의는 [`src/types.ts:43-76`](../src/types.ts#L43):

```typescript
interface PolicyRecord {
  // Identity
  regionId: string;
  regionName: string;
  stateAbbr: string;
  stateName: string;
  regionType: "state";
  year: number;

  // Extraction status
  snapshotStatus: "coded" | "queued";

  // Five scored dimensions
  aiUseAllowed: number;          // 0–3
  assessmentPolicy: number;      // 0–3
  privacyPolicy: number;         // 0–3
  teacherPdSupport: number;      // 0–3
  implementationStage: number;   // 0–4  ← 유일하게 0–4

  // Derived
  policyStrength: number;        // 위 5개의 합 (0–16)
  policyClarity: "low" | "moderate" | "high";
  policyOrientation: string;

  // Supporting
  approvedTools: string[];
  notes: string;
  sourceTitle: string;
  sourceUrl?: string;
  sourceDocuments: SourceDocument[];

  // Authority / routing
  sourceAuthority?: string;
  approvalRoute?: "auto_approve" | "sample_audit" | "human_review";
  auditStatus?: "not_required" | "pending_sample" | "pending_human_review" | "completed";
  policyDomains?: string[];
  verificationNotes?: string;
  routingReasons?: string[];
  deepResearchRecommended?: boolean;
  deepResearchReasons?: string[];

  // Evidence
  lastUpdated: string;           // ISO 8601
  confidence: number;            // 0–1
  evidenceSpans: EvidenceSpan[];
  teacherGuidance?: TeacherGuidanceInfo;
}

interface EvidenceSpan {
  field: string;         // 어떤 차원을 뒷받침하는지
  quote: string;         // 원본에서 직접 인용
  sourceUrl: string;
  chunkId?: string | null;
}
```

스키마 파일: [`data/canonical/policy-records.schema.json`](../data/canonical/policy-records.schema.json) (JSON Schema Draft 2020-12).

---

## 3. 채점 루브릭 (Scoring Rubric)

### 3.1 다섯 개 차원 (Dimensions)

| 차원 | 범위 | 의미 |
|---|---|---|
| `aiUseAllowed` | 0–3 | AI 사용 허용/규제 명시 수준 |
| `assessmentPolicy` | 0–3 | 평가/학업 정직성 정책 수준 |
| `privacyPolicy` | 0–3 | 학생 데이터 프라이버시 명시 수준 |
| `teacherPdSupport` | 0–3 | 교사 전문성 개발 지원 수준 |
| `implementationStage` | **0–4** | 정책 실행 단계 |

**점수 해석** ([`src/data/policyData.ts:448-454`](../src/data/policyData.ts#L448)):

| 값 | 라벨 |
|---|---|
| 0 | No coded evidence yet |
| 1 | Light mention |
| 2 | Moderate guidance |
| 3 | Strong formal guidance |
| 4 | Full operational system (`implementationStage` 전용) |

### 3.2 키워드 기반 자동 채점 규칙

[`scripts/extract-policy-records.mjs:53-89`](../scripts/extract-policy-records.mjs#L53)에서 정의된 rule set. 각 rule은 청크 텍스트에 해당 키워드가 모두 포함되면 값을 할당하며, **필드별 최댓값이 최종 점수**가 됩니다 (`Math.max(score, rule.value)`).

```js
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
```

> **한계 주의.** 현재 채점은 **경량 키워드 매칭**입니다. LLM 기반 deep-extraction 경로(`pipeline:gemini`)가 별도로 존재하며, 동일한 스키마로 점수를 내되 의미 기반으로 판단합니다. 모델 결과도 같은 필드 범위(0–3 / 0–4)를 따릅니다.

### 3.3 policy_strength (종합 점수)

[`scripts/lib/policy-extraction-utils.mjs:33-40`](../scripts/lib/policy-extraction-utils.mjs#L33):

```js
policyStrength =
    ai_use_allowed +
    assessment_policy +
    privacy_policy +
    teacher_pd_support +
    implementation_stage
```

- **범위:** 0–16 (최대: 3+3+3+3+4)
- **라벨 포맷:** `"{strength}/16"` ([`policyData.ts:419`](../src/data/policyData.ts#L419))

### 3.4 정책 강도 밴드 (Bands)

[`src/data/policyData.ts:402-407`](../src/data/policyData.ts#L402):

| 밴드 | 조건 | 지도 색상 토큰 |
|---|---|---|
| `high` | `strength ≥ 13` | `--tile-high` (짙은 퍼플) |
| `emerging` | `8 ≤ strength ≤ 12` | `--tile-mid` (시안) |
| `minimal` | `1 ≤ strength ≤ 7` | `--tile-low` (스카이블루) |
| `uncoded` | `strength = 0` or `snapshotStatus = "queued"` | `--tile-queued` (그레이) |

### 3.5 구현 단계 라벨

[`policyData.ts:427-433`](../src/data/policyData.ts#L427) — `implementationStage` 값 → 사람이 읽기 쉬운 라벨:

| 값 | 라벨 |
|---|---|
| 4+ | Operationalized |
| 3 | Released guidance |
| 2 | Framework stage |
| 1 | Early signal |
| 0 | Not coded |

### 3.6 신뢰도 (Confidence)

[`extract-policy-records.mjs:117-122`](../scripts/extract-policy-records.mjs#L117):

```js
confidence = (5개 필드 중 score > 0 인 필드 수) / 5
```

**범위:** 0.0, 0.2, 0.4, 0.6, 0.8, 1.0 (이산값). 표시 시 퍼센트로 포맷 (e.g. `80%`).

**신뢰도 밴드** ([`docs/CODEBOOK.md`](CODEBOOK.md)):
- `high` — 강한 1차 소스 + 모든 scored 필드에 evidence + 충돌 없음
- `medium` — 부분적 evidence, 약한 권위, 또는 경미한 모호성
- `low` — citation 누락, 소스 충돌, 또는 불명확한 정책 언어

---

## 4. 소스 권위 계층 (Source Authority Hierarchy)

### 4.1 권위 랭크

[`scripts/lib/approval-utils.mjs:4-11`](../scripts/lib/approval-utils.mjs#L4):

| 랭크 | 레벨 | 설명 |
|---|---|---|
| 5 | `binding_law_or_regulation` | 법률, 규정, 행정 규칙 |
| 4 | `official_guidance` | 교육부/위원회 공식 가이던스 |
| 3 | `official_model_policy` | 모델 정책, 프레임워크, 구현 권고 |
| 2 | `official_press_release` | 발표/뉴스 릴리즈 |
| 1 | `secondary_reporting` | 제3자 보도, 블로그, 비공식 |
| 0 | `unknown` | 미분류 |

### 4.2 자동 분류 로직

`approval-utils.mjs:45-78` — 각 `SourceDocument`의 제목 + URL을 정규식으로 매칭:

- **Binding law** — 패턴: `statute|bill|act|regulation|administrative code|rule|senate bill|house bill` + 공식 URL
- **Model policy** — `model policy|framework|implementation recommendations|roadmap` + 공식 URL
- **Official guidance** — `guidance|department guidance|artificial intelligence` + 공식 URL
- **Press release** — `press release|news release|news-center|/news/` + 공식 URL
- **Secondary reporting** — 그 외 (`.gov`/`.edu` 비도메인 등)

**공식 URL 판정** (`looksOfficialUrl`, [`approval-utils.mjs:33-42`](../scripts/lib/approval-utils.mjs#L33)):
```js
url.startsWith("local://")
  || /\.gov\b/.test(url)
  || /\.edu\b/.test(url)
  || /\bwvde\.us\b/.test(url)
  || /\.state\.[a-z]{2}\.us\b/.test(url)
  || /\.k12\.[a-z.]+\b/.test(url)
  || /schools\.[a-z.]+\b/.test(url)
```

### 4.3 강한 1차 소스 (Strong Primary)

자동 승인에 필요한 집합:
```js
STRONG_PRIMARY_LEVELS = {
  "binding_law_or_regulation",
  "official_guidance",
  "official_model_policy"
}
```

자동 승인 **금지**:
```js
FORBIDDEN_AUTO_APPROVE_LEVELS = {
  "secondary_reporting",
  "official_press_release"
}
```

---

## 5. 승인 라우팅 (Approval Routing)

[`scripts/lib/approval-utils.mjs:128-224`](../scripts/lib/approval-utils.mjs#L128)의 `evaluateApproval()`가 `approval-policy.json` 임계값을 적용합니다.

### 5.1 의사결정 트리

```
IF 수동 리뷰 완료 → human_review (completed)
ELIF (confidence ≥ 0.9)
  AND sourceAuthority ∈ STRONG_PRIMARY_LEVELS
  AND 모든 scored 필드에 evidence_span 존재
  AND !unresolvedConflict
  AND sourceAuthority ∉ FORBIDDEN_AUTO_APPROVE_LEVELS
  → auto_approve         (audit_status: not_required)
ELIF (0.75 ≤ confidence ≤ 0.89)
  AND 최소 N−1개 필드에 evidence
  AND !unresolvedConflict
  → sample_audit         (audit_status: pending_sample)
ELSE
  → human_review         (audit_status: pending_human_review)
```

### 5.2 충돌 감지

`unresolvedConflict`가 참이 되는 조건 ([`approval-utils.mjs:117-126`](../scripts/lib/approval-utils.mjs#L117)):
- `verification_status === "needs_review"`, 또는
- `review_status === "needs_revision"`, 또는
- `verification_notes`에 `"conflict"`, `"weak grounding"`, `"unsupported"` 중 하나 포함

### 5.3 Deep Research 플래그

다음 중 하나라도 해당되면 `deepResearchRecommended = true`:
- `weak_source_authority` — 소스가 STRONG_PRIMARY에 미포함
- `missing_citation` — scored 필드 중 evidence 누락
- `source_conflict` — §5.2 조건
- `not_extracted` — `extraction_status === "not_extracted"`

---

## 6. 합성 지표 (Synthesis Calibration)

[`src/config/synthesisCalibration.json`](../src/config/synthesisCalibration.json)에서 각종 가중치를 관리. 이 값들은 다중 신호를 하나의 "정책 품질" 점수로 합성하는 데 쓰입니다.

### 6.1 신호 가중치 (합계 1.00)

| 신호 | 가중치 | 의미 |
|---|---:|---|
| `confidence` | **0.45** | §3.6 필드 커버리지 |
| `evidenceSpanCoverage` | 0.20 | evidence의 폭 |
| `sourceAuthority` | 0.15 | §4 권위 레벨 가중 |
| `sourceDocumentCoverage` | 0.10 | 소스 문서 개수 |
| `approvalRoute` | 0.10 | §5 라우팅 결과 |
| **Total** | **1.00** | |

**감사 보너스(auditBonus):** +0.04 — `audit_status === "completed"`일 때 가산.

### 6.2 품질 임계값

```json
strong:   ≥ 0.82
moderate: ≥ 0.65
```

### 6.3 권위 가중치

| 레벨 | 가중치 |
|---|---:|
| `binding_law_or_regulation` | 1.00 |
| `official_guidance` | 0.90 |
| `official_model_policy` | 0.82 |
| `official_press_release` | 0.58 |
| `secondary_reporting` | 0.35 |

### 6.4 라우팅 가중치

| 라우트 | 가중치 |
|---|---:|
| `auto_approve` | 1.00 |
| `sample_audit` | 0.72 |
| `human_review` | 0.45 |
| `unrouted` | 0.35 |

---

## 7. 정책 도메인 분류 (Policy Domains)

[`docs/CODEBOOK.md`](CODEBOOK.md) §Domains — 각 레코드는 8개 중 일부를 배정받을 수 있음. **명시적 정책 언어가 있을 때만** 배정.

| 도메인 | 범위 |
|---|---|
| `ai_use` | AI 사용에 대한 명시적 정책 |
| `assessment` | AI 관련 평가 정책 |
| `privacy` | 학생 데이터 프라이버시 |
| `teacher_pd` | 교사 전문성 개발 |
| `academic_integrity` | AI 관련 학업 정직성 |
| `procurement` | 기술 조달 가이던스 |
| `governance` | 거버넌스 구조 |
| `equity` | 형평성 고려 |

---

## 8. 데이터 품질 & 검증

### 8.1 스키마 검증

- 파일: `data/canonical/policy-records.schema.json` (JSON Schema Draft 2020-12)
- 실행: `npm run pipeline:validate`
- 필수 필드: `record_id`, `jurisdiction_id`, `jurisdiction_name`, `jurisdiction_type`, `state_abbr`, `review_status`, `extraction_status`, `version`, `updated_at`, `source_documents`

### 8.2 Evidence 중복 제거

[`policy-extraction-utils.mjs:58-66`](../scripts/lib/policy-extraction-utils.mjs#L58):

```js
key = `${field}:${quote}:${source_url}`
```

동일 키가 이미 있으면 무시. 필드당 최대 3개 evidence span만 보관 (점수 순 → overlap 순).

### 8.3 결측값 처리

- 스코어 필드: `(value ?? 0)` — null은 0으로 처리
- `confidence == null`이면 자동 승인 원천 차단 ([`approval-utils.mjs:139`](../scripts/lib/approval-utils.mjs#L139))

### 8.4 교차 소스 조정

같은 필드에 여러 소스가 증거를 제공하면:
1. 각 청크에 규칙을 적용해 점수 산출
2. `score = Math.max(score, rule.value)` — **최댓값 채택**
3. Evidence는 점수 내림차순, overlap 내림차순으로 상위 3개 유지

---

## 9. 파이프라인 전체 흐름

| 단계 | 명령 | 입력 → 출력 |
|---|---|---|
| 1. Crawl | `npm run crawl:sources` | `source-seeds.json` → `data/generated/raw/*.html`, `policy-source-manifest.json` |
| 2. Scaffold | `npm run pipeline:scaffold` | manifest → `policy-records.json` (빈 점수) |
| 3. Chunk | `npm run pipeline:chunk` | HTML → `chunks.jsonl`, `retrieval-index.json` |
| 4. Extract | `npm run pipeline:extract` <br> `npm run pipeline:gemini` | 청크 → 점수화된 `policy-records.json` |
| 5. Validate | `npm run pipeline:validate` | 스키마 검증 |
| 6. Route | `npm run route-policy-records` | `policy-records.json` → `+ approvalRoute`, `+ auditStatus`, `+ deepResearchRecommended` |
| 7. Review | `npm run build-review-queue` + 수동 | `sample_audit`/`human_review` 항목 검수 |
| 8. Publish | `npm run publish-app-data` | `policy-records.json` → `dist/policy-records.json` |

---

## 10. 검증 체크리스트 (For Reviewers)

새 레코드가 `auto_approve`되기 전 아래가 모두 참이어야 합니다:

- [ ] 최소 1개 source document가 STRONG_PRIMARY 레벨 (`binding_law_or_regulation` / `official_guidance` / `official_model_policy`)
- [ ] 5개 스코어 필드 각각에 1개 이상 `evidence_spans[]` 엔트리
- [ ] 각 `evidence_spans[].quote`가 원문에서 직접 인용된 텍스트
- [ ] `confidence ≥ 0.9`
- [ ] `verification_notes`에 충돌 키워드 없음
- [ ] `review_status !== "needs_revision"`

위 조건 중 하나라도 미충족 시:
- `confidence ≥ 0.75` → `sample_audit`
- 그 외 → `human_review`

---

## 11. 현재 한계 및 미래 작업 (Known Limitations)

1. **학술 논문 근거 부재.** 현재 평가는 정부 1차 문서에만 의존하며, AI 교육 연구 문헌은 참조하지 않습니다. 향후 `references.json` 형태로 학술 근거 레이어를 추가할 수 있습니다.
2. **키워드 기반 추출의 취약성.** `extract-policy-records.mjs`의 규칙은 영어 키워드 공출현에 의존해 재현율이 제한적입니다. LLM 경로(`pipeline:gemini`)가 보조하지만 교차 검증은 수동입니다.
3. **District/county 수준 데이터 부재.** 현재 `regionType`은 `"state"` 전용. 지도의 district 뷰는 시각적 placeholder (카운티 경계 표시만).
4. **시간 축 지원 제한.** `year` 필드는 있으나 UI의 정책 타임라인은 단일 스냅샷만 렌더링.
5. **소스 권위의 텍스트 매칭 한계.** `looksOfficialUrl`와 제목 정규식은 도메인 스푸핑이나 비영어권 주(예: PR)의 예외 케이스를 놓칠 수 있습니다.

---

## 12. 주요 코드 레퍼런스

| 주제 | 파일:라인 |
|---|---|
| PolicyRecord 타입 | [src/types.ts:43-76](../src/types.ts#L43) |
| EvidenceSpan 타입 | [src/types.ts:22-27](../src/types.ts#L22) |
| 키워드 채점 규칙 | [scripts/extract-policy-records.mjs:53-89](../scripts/extract-policy-records.mjs#L53) |
| confidence 계산 | [scripts/extract-policy-records.mjs:117-122](../scripts/extract-policy-records.mjs#L117) |
| policyStrength 수식 | [scripts/lib/policy-extraction-utils.mjs:33-40](../scripts/lib/policy-extraction-utils.mjs#L33) |
| Evidence 중복 제거 | [scripts/lib/policy-extraction-utils.mjs:58-66](../scripts/lib/policy-extraction-utils.mjs#L58) |
| 권위 계층 | [scripts/lib/approval-utils.mjs:4-17](../scripts/lib/approval-utils.mjs#L4) |
| 공식 URL 판정 | [scripts/lib/approval-utils.mjs:33-42](../scripts/lib/approval-utils.mjs#L33) |
| 소스 분류 | [scripts/lib/approval-utils.mjs:45-78](../scripts/lib/approval-utils.mjs#L45) |
| 충돌 감지 | [scripts/lib/approval-utils.mjs:117-126](../scripts/lib/approval-utils.mjs#L117) |
| 승인 라우팅 | [scripts/lib/approval-utils.mjs:128-224](../scripts/lib/approval-utils.mjs#L128) |
| 정책 강도 밴드 | [src/data/policyData.ts:402-407](../src/data/policyData.ts#L402) |
| 색상 매핑 | [src/data/policyData.ts:409-417](../src/data/policyData.ts#L409) |
| 구현 단계 라벨 | [src/data/policyData.ts:427-433](../src/data/policyData.ts#L427) |
| 스코어 라벨 | [src/data/policyData.ts:448-454](../src/data/policyData.ts#L448) |
| 합성 가중치 | [src/config/synthesisCalibration.json](../src/config/synthesisCalibration.json) |
| Seed URL 목록 | [data/source-seeds.json](../data/source-seeds.json) |
| 정규 스키마 | [data/canonical/policy-records.schema.json](../data/canonical/policy-records.schema.json) |
| 코드북 | [docs/CODEBOOK.md](CODEBOOK.md) |

---

*본 문서는 코드를 최상의 참조로 삼습니다. 수식·가중치·임계값이 변경될 때마다 이 문서도 함께 업데이트해야 합니다.*
