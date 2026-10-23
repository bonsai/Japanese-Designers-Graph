---
name: Recommend Japanese Designers
description: Research explainable designer and brand recommendations from the graph and propose reviewed JSON updates.
on:
  schedule:
    - cron: "17 2 * * 1"
  workflow_dispatch:
permissions:
  contents: read
  pull-requests: read
tools:
  github:
    toolsets: [repos, issues, pull_requests]
safe-outputs:
  create-pull-request:
    title-prefix: "[recommendations] "
    labels: [enhancement]
    max: 1
    draft: true
---

# Designer recommendation refresh

Read `data/seeds.json`, `data/recommendations.json`, and the project README before making recommendations.

Update only `data/recommendations.json`. Keep it valid JSON with this shape:

```json
{
  "version": 1,
  "generated_at": "YYYY-MM-DD",
  "recommendations": [
    {
      "id": "recommendation:stable-kebab-case",
      "title": "Short Japanese recommendation title",
      "summary": "Why this is a useful next exploration",
      "node_ids": ["person:...", "brand:..."],
      "reason": "Explain the relationship or shared design theme",
      "confidence": "low|medium|high",
      "status": "candidate|verified",
      "sources": [
        {
          "title": "Source title",
          "url": "https://...",
          "supports": "The specific claim this source supports"
        }
      ]
    }
  ]
}
```

Rules:
- Prefer recommendations that help users discover meaningful connections among existing graph nodes, and propose new nodes only when strong sources support them.
- Every `node_ids` entry must already exist in `data/seeds.json`; do not invent node IDs.
- Every non-trivial factual claim must have at least one source URL. Use reputable primary sources first (designer/brand official pages, museums, interviews, exhibition catalogues).
- Never infer collaboration, employment, or personal relationships from stylistic similarity alone.
- Similarity-based recommendations must say they are thematic suggestions, not evidence of a direct relationship.
- Use `confidence: "low"` and `status: "candidate"` when evidence is indirect or incomplete. Use `verified` only when the sources directly support the claim.
- Preserve existing useful entries, remove duplicates, and keep each run small (maximum 12 recommendations).
- If the sources do not support a useful update, make no changes and do not open a pull request.
- Do not modify application code, workflow files, or the canonical seed graph.
- Submit changes only as a draft pull request. Do not merge it.
