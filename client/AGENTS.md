# Frontend Engineering Standards & Architecture

All rules below are subject to the existing codebase. Always inspect existing patterns first; prioritize consistency with the existing codebase if contradictions arise.

## UI & Reusable Component Strategy
- **Inventory Check:** Search the global components folder for an existing component before writing custom UI code.
- **Design System Rules:** For general layout UI (`Tabs`, `Buttons`, `StatusChips`, `Modal`, `Drawer`, `FormFields`, `Accordion`), if missing locally, prompt the user to install the Shadcn equivalent. Do not write custom alternatives.
- **Typography Tokens:** Do not write custom or absolute font sizes (`font-size`, arbitrary text sizes). Use tokenized variant names only (e.g., matching color and size system variants).

## API Integration & RTK Query Architecture
- **Directory Structure:** Create isolated, standalone folders for each distinct feature domain (`src/features/<feature>/`).
- **Module Encapsulation:** Enforce the Barrel Export pattern (`index.ts`) at the feature root. Feature APIs (RTK Query hooks) must remain private and never be exported outside their folder; only presentational UI components can cross feature boundaries.
- **User Experience States:** Provide distinct loading states (full-screen or localized skeletons/spinners) and structured error catching boundaries for all integrations.
- **Caching & Intercepts:** Utilize a unified central API Tags file (`src/store/api/apiTags.ts`) for strict tag tracking and automated query invalidation. Use optimistic updates on mutations where UX is impacted.

## Responsive Design Mandate
- **Strict Mobile-First & Full Responsiveness:** Every single screen, layout, component, modal, and drawer MUST be 100% responsive across all viewport breakpoints (Mobile: 320px–640px, Tablet: 641px–1024px, Desktop: 1025px+).
- **Responsive Layout Standards:**
  - Multi-column layouts (e.g., split auth screens, dashboard grids) must collapse seamlessly into a single vertical flow on mobile and tablet (`flex-col lg:flex-row`, `grid-cols-1 lg:grid-cols-2`).
  - Fluid Spacing: Use adaptive padding and gap tokens (`p-4 sm:p-6 lg:p-12`, `gap-4 sm:gap-6 lg:gap-8`).
  - Accessible Touch Targets: Ensure all buttons, form fields, and interactive elements maintain at least 44px height on mobile devices with comfortable finger tap padding.
  - Zero Horizontal Overflow: Enforce fluid containers (`w-full`, `max-w-full`, `overflow-x-hidden`) to prevent horizontal scrolling on small screens.

