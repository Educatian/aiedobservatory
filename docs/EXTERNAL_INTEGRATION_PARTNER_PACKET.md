# External Integration Partner Packet

This packet is for the two integrations proposed under a future OpenPolicy Receipts grant. It documents a credible recruitment and acceptance process; no partner is claimed until a written commitment exists.

## Suitable partner

A partner must maintain an agent, evidence-processing tool, civic-technology workflow, research prototype, or public-sector application outside the AI Education Policy Observatory. At least one named person must be able to modify and run that code. A wrapper maintained only by the OpenPolicy core team does not qualify.

## Independence and conflict disclosure

Before work begins, record the partner's affiliation, prior relationship to the project, financial interest, expected compensation, and whether any contributor wrote the SDK or expected test outputs. A paid integration may demonstrate portability, but only a non-team reproducer can satisfy the independent reproduction gate.

## Integration task

1. Install the package from the proposed public tag.
2. Map one real agent action to the receipt schema without changing the core verifier.
3. Create and sign a receipt with action, resource, expiry, network, and secrets scopes.
4. Verify the receipt, then demonstrate rejection after one tamper or unauthorized action.
5. Record setup time, code changes, ambiguities, failures, and requested changes.
6. Publish or provide a rights-cleared adapter, fixture, and short report.

## Acceptance evidence

- repository and immutable commit or archived code artifact;
- dependency and environment versions;
- one valid signed receipt and one rejected mutation;
- exact commands and elapsed setup time;
- unresolved limitations and any core-spec changes requested; and
- partner confirmation that the OpenPolicy core team did not prewrite the integration result.

## Recruitment message

OpenPolicy Receipts is seeking two external teams to integrate a small Apache-2.0 action-receipt SDK into an existing agent or evidence workflow. The task is to map one real action, create and verify a signed receipt, demonstrate one rejected tamper or scope violation, and report friction and failures. This is a portability test, not a request for endorsement. Compensation and publication terms will be confirmed only after an award and institutional review.

## Reporting rule

Report both successful and failed integrations. Do not count the Observatory adapter or the standalone example as an external integration, and do not count a paid partner as an independent security reviewer or clean-room reproducer unless the applicable independence protocol is separately satisfied.
