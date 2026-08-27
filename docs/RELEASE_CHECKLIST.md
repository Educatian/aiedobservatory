# Release checklist

- [ ] `npm ci` succeeds in a clean clone on Node 20+.
- [ ] `npm test` and `npm run build` pass.
- [ ] `npm audit --audit-level=high` has no unresolved high/critical finding or includes a documented exception.
- [ ] `npm run audit:sources` reports HTTP success for every release source.
- [ ] Software license and release data-rights manifest are present.
- [ ] No raw third-party source is included in the release artifact without documented permission.
- [ ] Evaluation card distinguishes verified independent labels from legacy diagnostics.
- [ ] Action receipt hashes match the release files.
- [ ] Failure cases and known limitations are public.
- [ ] One non-team member completes an unassisted clean reproduction and records OS, hardware, commands, duration, and issues.
- [ ] Maintainer creates a signed or annotated Git tag only after the checks pass.
