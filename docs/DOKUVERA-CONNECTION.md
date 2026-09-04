# DOMUREVA ↔ Dokuvera connection

DOMUREVA is wired to Dokuvera for verified property/project evidence.

## Required DOMUREVA server environment variables

- `DOKUVERA_BASE_URL` — Dokuvera production API origin.
- `DOKUVERA_API_KEY` — server-to-server Bearer credential.
- `DOKUVERA_SIGNING_SECRET` — HMAC secret DOMUREVA uses for outbound requests.
- `DOKUVERA_WEBHOOK_SECRET` — HMAC secret used to verify Dokuvera callbacks.

Never expose these values through browser/public environment variables.

## Outbound request

DOMUREVA calls `POST /api/v1/cases` on Dokuvera with:

- `request_id`
- `domureva_case_id`
- `user_id`
- `required_evidence[]`
- `callback_url`

Headers include a unique `x-domureva-event-id`, Unix `x-domureva-timestamp`, optional Bearer credential, and `x-domureva-signature: sha256=<hmac>` where the signed message is `<timestamp>.<raw-json-body>`.

The DOMUREVA route is `POST /api/integrations/evidence`. It requires an authenticated user and verifies that the user owns the linked property or has an authorised council/admin role before opening a Dokuvera evidence case.

## Dokuvera callback

Dokuvera posts to:

`POST /api/public/integrations/dokuvera-webhook`

Preferred callback headers:

- `x-dokuvera-timestamp`
- `x-dokuvera-signature: sha256=<hmac>`

The HMAC message is `<timestamp>.<raw-json-body>`. DOMUREVA rejects timestamped callbacks outside a 5-minute window. A legacy raw-body signature is accepted temporarily for compatibility.

Every event must include a unique `event_id` (or `id`). Duplicate events are idempotently acknowledged.

### Supported events

`evidence.verified`

Required case fields should include `case_id`, `evidence_id`, and `kind`. DOMUREVA can additionally persist `file_name`, `sha256`, `captured_at`, `latitude`, `longitude`, and arbitrary metadata. The matching `evidence_items` record becomes verified.

`evidence.rejected`

The evidence record remains unverified and stores `rejection_reason` in metadata.

## Audit trail

Outbound evidence requests and inbound Dokuvera webhook events are written to `integration_events`, so the DOMUREVA Integration Control Centre can surface health, errors and recent activity.

## Production acceptance

1. Configure all four secrets/URLs in the production runtime.
2. Confirm Dokuvera exposes the case/evidence endpoints above, or map the adapter paths to its actual API.
3. Send a signed test request from DOMUREVA to Dokuvera.
4. Return a signed `evidence.verified` callback.
5. Confirm the evidence appears verified on the DOMUREVA case and in the application/project workflow.
6. Replay the same event ID and confirm DOMUREVA returns `duplicate: true` without applying the event twice.
7. Send an expired timestamp/bad signature and confirm HTTP 401.
