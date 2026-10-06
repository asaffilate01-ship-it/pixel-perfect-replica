# DOMUREVA

DOMUREVA is the empty-home, regeneration and funding workspace in the iTechLounge property ecosystem.

It keeps its own property/regeneration case data and can operate standalone. The application already includes funding, council, opportunities, applications, contractors, Copilot and evidence workflows.

## Property network

DOMUREVA now connects to:

- **Omniqora** for tenant-scoped property intelligence, vacancy analysis and governed AI runs.
- **Gabley** for deal/opportunity workflows. Only human-approved DOMUREVA funding assessments are pushed back to a Gabley opportunity.
- **Gabley Retrofit / Craftvaro** through their existing optional adapters.

The databases remain separate. DOMUREVA does not become the Gabley transaction database, and Gabley does not become the authority for funding eligibility.

### Server configuration

Copy the placeholders from `.env.example` into the deployment secret store. Do not put integration secrets in browser/VITE variables.

## Development

```sh
npm ci
npm run dev
```

This project was built with Lovable. Current source is authoritative; deployment and external credentials must be validated separately before a connection is described as live.
