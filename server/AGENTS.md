# Backend Engineering Standards & Architecture

All rules below are subject to the existing codebase. Always inspect existing patterns first; prioritize consistency with the existing codebase if contradictions arise.

## Core Backend Principles
- **Separation of Concerns:** Never mix distinct responsibilities within a single entity or file.
- **Senior Philosophy:** Critically evaluate entity creation, directory placement, and DRY patterns to prevent redundant or bloated code.
- **Environment Variables:** Must strictly be imported and accessed via `env.config.ts`. Direct calls to `process.env` anywhere else in the application are strictly forbidden.
- **Validation:** Enforce Zod input validation on every single API endpoint. Include robust, user-friendly custom error messages inside the schema definitions.
- **Data Fetching:** Mandate pagination, text search, and filtering keys for any endpoint fetching document collections.
- **Third-Party Integrations:** Place implementations inside the global `services/` folder. Use the **Factory Pattern** to keep providers abstract and decoupled (allowing future provider swaps).

## Backend Directory Architecture Mapping
- `config/`: System instantiation & drivers (e.g., MongoDB setups).
- `env.config.ts`: Centralized environment configuration.
- `services/`: App-wide decoupled third-party service wrappers.
- `modules/`: Feature-driven code domains (containing isolated models, controllers, routes, module-level services, and utils).
- `routes/`: Global routing map aggregating versioned feature paths (e.g., `/v1`).
- `middlewares/`: Reusable Express middlewares (validation, error handling, auth, 404).
- `utils/`: Reusable helpers (e.g., `ApiError`, `sendResponse`).

## Automated Testing Guidelines
- **Core Philosophy:** Write practical, lightweight automated test cases that focus on business outcomes and failure scenarios without testing trivial framework features.
- **Key Focus Areas:**
  - Business logic, service operations, and domain state transitions.
  - Controller and API status codes and structured response envelopes (`apiResponse`).
  - Zod input validation, required fields, and boundary values.
  - Database persistence, unique index constraints, and query accuracy.
  - Operational error handling (`ApiError`) and status codes (400, 401, 403, 404, 409, 500).
  - Authentication, authorization, token verification, and role restrictions.
  - Idempotency, concurrency, and race conditions.
- **External Integrations:** Mock/stub external services (payment gateways, notification services) in automated tests to keep runs fast, isolated, and deterministic.
