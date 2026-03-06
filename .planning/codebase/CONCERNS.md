# Codebase Concerns

**Analysis Date:** 2026-03-05

## Tech Debt

**Starter Template Boilerplate:**
- Issue: Project is using unmodified Vite + React template scaffolding with placeholder demo code ("Vite + React" page and counter component)
- Files: `src/App.jsx`, `src/main.jsx`, `src/App.css`, `src/index.css`
- Impact: The codebase contains no actual business logic or feature implementation. All template scaffolding (Vite logos, React logos, counter demo, CSS styling) must be replaced before any real development
- Fix approach: Completely replace App.jsx with actual scheduler components, remove template CSS, establish proper component hierarchy and data flow

**No TypeScript:**
- Issue: Project is using plain JavaScript/JSX instead of TypeScript despite having React 19+ which benefits greatly from type safety
- Files: `src/App.jsx`, `src/main.jsx`, `eslint.config.js`
- Impact: No static type checking means errors won't be caught until runtime. No IDE autocompletion support for props/state. Refactoring is risky. The README explicitly recommends TypeScript for production applications
- Fix approach: Migrate to TypeScript by renaming files to .tsx, adding tsconfig.json, installing @types packages, and updating eslint config

**Beta Vite Version:**
- Issue: Package.json specifies `"vite": "^8.0.0-beta.13"` - a beta version in the project overrides section
- Files: `package.json`
- Impact: Beta versions can have breaking changes, poor stability, and security issues. Not suitable for production. May have undiscovered bugs
- Fix approach: Upgrade to latest stable Vite version (currently 5.x or 6.x), remove the overrides section, test thoroughly after upgrade

## Missing Critical Features

**No Testing Infrastructure:**
- Problem: Zero test files, no test framework configured (no Jest, Vitest, or equivalent), and no test scripts in package.json
- Files: None present
- Blocks: Cannot verify scheduler functionality, cannot prevent regressions, cannot ensure data integrity in scheduling logic
- Priority: High - Any production scheduler requires comprehensive test coverage

**No Build/Deployment Configuration:**
- Problem: Only basic Vite config present. No environment configuration, no build output optimization, no deployment targets defined
- Files: `vite.config.js`
- Blocks: Cannot deploy to any environment, no configuration management for different deployments (dev/staging/prod)
- Priority: High

**No State Management:**
- Problem: No state management library (Redux, Zustand, Context API patterns) - required for managing complex scheduler state
- Files: `src/App.jsx`
- Blocks: Cannot properly manage workshop data, scheduling state, or user interactions across components
- Priority: High

**No Routing:**
- Problem: No routing library (React Router) - essential for multi-page scheduler interface
- Files: Not installed
- Blocks: Cannot build multi-page application, cannot navigate between views, cannot use bookmarkable URLs
- Priority: High

**No API Integration:**
- Problem: No HTTP client library (fetch, axios) and no API endpoints configuration
- Files: Not present
- Blocks: Cannot connect to backend, cannot persist schedule data, cannot fetch workshop/calendar data
- Priority: High

**No Data Persistence:**
- Problem: No database ORM, no local storage management, no data models
- Files: Not present
- Blocks: All scheduler data lost on page refresh, cannot persist user changes
- Priority: High

## Fragile Areas

**ESLint Configuration Overly Permissive:**
- Files: `eslint.config.js`
- Why fragile: Custom rule allows unused variables if they start with uppercase letter (`varsIgnorePattern: '^[A-Z_]'`). This could hide legitimate mistakes where component names are defined but not used
- Safe modification: Replace varsIgnorePattern with stricter rules; use proper import/export patterns
- Test coverage: No tests to verify linting catches real issues

**Dependency Version Pinning Missing:**
- Files: `package.json`
- Why fragile: React (^19.2.0) and Vite (^8.0.0-beta.13) use caret versions allowing minor updates. No lock file certainty in CI/CD without strict lock file checks
- Safe modification: Consider using exact versions for critical dependencies or at least minor-locked versions (^19.2 → ^19.0)
- Test coverage: No test pipeline to catch breaking changes from dependency updates

## Performance Bottlenecks

**No Code Splitting:**
- Problem: Single entry point, no lazy loading, no route-based code splitting configured
- Files: `vite.config.js`
- Cause: Default Vite config doesn't optimize bundle splitting for multi-page applications
- Improvement path: Add route-based code splitting, lazy load heavy components (calendar, scheduling logic), implement dynamic imports

**No Environment-Based Optimization:**
- Problem: Development and production builds use identical Vite configuration
- Files: `vite.config.js`
- Cause: Config doesn't differentiate build targets
- Improvement path: Add environment-specific configs (minification, source maps, asset optimization)

## Security Considerations

**External CDN Assets Without Integrity Checks:**
- Risk: index.html loads `/vite.svg` from public CDN without integrity hash verification
- Files: `index.html`
- Current mitigation: None - relying on integrity of public CDN
- Recommendations: Add SRI (Subresource Integrity) hashes to any external assets, consider self-hosting SVGs

**No Input Validation:**
- Risk: When actual scheduler features are added, there's no validation framework in place for user inputs
- Files: Will affect future form components
- Current mitigation: None present
- Recommendations: Add input validation library (Zod, Joi, or browser APIs), validate all user-submitted data before processing

**No CORS Configuration:**
- Risk: Frontend-only app with no CORS handling defined for future API calls
- Files: `vite.config.js`
- Current mitigation: None
- Recommendations: Configure CORS policy once API integration begins; use proxy during development

**No Content Security Policy:**
- Risk: No CSP headers or meta tags defined to prevent XSS attacks
- Files: `index.html`
- Current mitigation: None
- Recommendations: Add CSP meta tags, configure server headers for production deployment

## Scaling Limits

**Single Component Architecture:**
- Current capacity: Adequate for demo/prototype only. Cannot scale beyond 5-10 components without refactoring
- Limit: Reaches complexity limits with any multi-view scheduler, calendar widget, or workshop management features
- Scaling path: Establish proper component hierarchy, implement container/presentation pattern, use feature-based folder structure

**No Build Output Analysis:**
- Problem: No bundle size monitoring or analysis tools configured
- Limit: Unknown bundle size, undetected bloat from dependencies
- Scaling path: Add `vite-plugin-visualizer` to analyze chunks, implement size budgets in CI

## Dependencies at Risk

**Beta Vite Version Lock:**
- Risk: `vite@^8.0.0-beta.13` with override may become unsupported
- Impact: Cannot receive security patches, may break with Node.js updates
- Migration plan: Upgrade to stable Vite 5.x or 6.x, run full test suite after upgrade (once tests are written)

**React 19 Stability:**
- Risk: React 19 is relatively new with potential early-version bugs
- Impact: May encounter issues not yet discovered in production-like scheduling scenarios
- Migration plan: Monitor React releases, pin to known-stable minor version once proven in production

**No Development Environment Specification:**
- Risk: Node.js version not specified (.nvmrc missing), no package manager lock file enforcement
- Impact: Team members may use incompatible Node versions, inconsistent builds
- Migration plan: Add `.nvmrc` file with pinned Node version, add `.npmrc` to enforce npm version

---

*Concerns audit: 2026-03-05*
