<!-- GSD:project-start source:PROJECT.md -->
## Project

**WW Workshop Scheduler**

A high-fidelity prototype of a workshop scheduling platform for WeightWatchers' virtual coaching team. Coordinators (Kathleen, Sophie) use it to draft, validate, and publish weekly workshop schedules for ~68 virtual coaches. Features a weekly calendar grid with conflict detection, workshop detail panel with editing, and click-to-create workflow. Demo-ready UI with mock data — no backend needed.

**Core Value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.

### Constraints

- **Tech stack**: React 19 (Vite 8), Tailwind CSS v4, date-fns, Lucide React — no other frameworks
- **No backend**: All data in React state and local mock JS files
- **Design**: WeightWatchers brand palette (navy #1A2332, blue #0066CC, coral #E85D4A)
- **Typography**: Inter font (self-hosted via @fontsource), 14px base
- **Viewport**: Desktop-optimized, minimum 1280px wide
- **UI feel**: Calm, professional — think Linear/Notion Calendar/Calendly
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (JSX) - React components, client-side application logic
- HTML - Template in `index.html`
- CSS - Styling in `src/*.css` files
## Runtime
- Node.js 24.13.1
- Browser (client-side rendering)
- npm 11.8.0
- Lockfile: `package-lock.json` (present)
## Frameworks
- React 19.2.0 - UI framework for building interactive components
- Vite 8.0.0-beta.13 - Build tool and development server with HMR
- @vitejs/plugin-react 5.1.1 - Vite React plugin for JSX transformation and Fast Refresh
- ESLint 9.39.1 - Code linting and style enforcement
## Key Dependencies
- react 19.2.0 - Frontend framework
- react-dom 19.2.0 - React DOM rendering library
- @vitejs/plugin-react 5.1.1 - React Fast Refresh for Vite
- @eslint/js 9.39.1 - ESLint rules
- eslint-plugin-react-hooks 7.0.1 - Linting rules for React hooks
- eslint-plugin-react-refresh 0.4.24 - Linting for React Fast Refresh
- globals 16.5.0 - Global object definitions for ESLint
- @types/react 19.2.7 - TypeScript types for React
- @types/react-dom 19.2.3 - TypeScript types for React DOM
## Configuration
- `vite.config.js` - Vite configuration with React plugin enabled
- `eslint.config.js` - ESLint flat config (v9+) with React hooks and refresh rules
- No `.env` files present
- No environment variables required for current setup
- Client-side only application (no backend integration)
## Platform Requirements
- Node.js 24.13.1 (recommended)
- npm 11.8.0+ (or compatible package manager)
- Modern browser with ES2020+ support
- Static file hosting (Vite produces `dist/` output)
- Modern browser with ES2020+ support
- No server-side runtime required
## Scripts
- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Build for production to `dist/`
- `npm run lint` - Run ESLint on project files
- `npm run preview` - Preview production build locally
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- JavaScript/JSX files use PascalCase for components: `App.jsx`, `main.jsx`
- CSS files are lowercase: `App.css`, `index.css`
- Asset files are lowercase with descriptive names: `react.svg`
- React component functions use PascalCase: `App`, `StrictMode`
- React hooks follow convention with `use` prefix: `useState`
- Exported functions are named explicitly (not anonymous)
- State variables use camelCase: `count`, `setCount`
- Event handlers follow camelCase: `onClick`
- Import statements preserve original casing from modules
- React component types match component names
- Props and state follow TypeScript conventions (not fully typed in current JSX)
## Code Style
- No explicit prettier config found - uses ESLint defaults
- 2-space indentation observed
- Imports sorted: React modules first, then local imports, then CSS/assets
- Single quotes for JSX attributes and content
- ESLint enabled with flat config format: `eslint.config.js`
- Browser globals configured via `globals` package
- ECMAScript 2020+ syntax support
- `no-unused-vars`: Error level, with pattern `^[A-Z_]` excluded (allows unused constants)
- React Hooks rules enabled: `eslint-plugin-react-hooks`
- React Refresh rules enabled: `eslint-plugin-react-refresh`
## Import Organization
- Absolute paths used for public assets: `/vite.svg`
- Relative paths used for local imports: `./App.jsx`, `./assets/react.svg`
## Error Handling
- React StrictMode enabled to catch errors during development: `<StrictMode>` wrapper
- No explicit error boundary implementation in current codebase
- No try-catch blocks observed in sample code
## Logging
- No logging patterns observed in current source files
- Recommended approach would follow browser console methods: `console.log()`, `console.error()`, etc.
## Comments
- No inline comments observed in current codebase
- JSDoc style not currently used
- Code is self-documenting where possible (explicit component and variable names)
- Not detected in current implementation
- Not required for JSX files at this stage
## Function Design
- Functions kept small and focused
- React components typically single responsibility
- Components use destructuring for props (standard React pattern)
- Callbacks use arrow functions: `onClick={() => setCount((count) => count + 1)}`
- Components return JSX elements
- Hooks return values and state setters: `const [count, setCount] = useState(0)`
## Module Design
- Default exports used for main components: `export default App`
- Named exports for hooks and utilities (not yet present)
- Not used in current structure
- Simple flat structure with `main.jsx` as entry point
## Code Examples
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Client-side rendering using React 19.2.0
- Vite as build tool and dev server with Hot Module Replacement (HMR)
- Minimal boilerplate - component-based application structure
- No backend service integration (frontend-only)
- ES modules with JSX support
## Layers
- Purpose: Render UI components and handle user interactions
- Location: `src/App.jsx`
- Contains: React functional components with hooks, JSX markup, component state
- Depends on: React, useState hook
- Used by: main.jsx entry point
- Purpose: Style presentation layer and global styles
- Location: `src/App.css`, `src/index.css`
- Contains: CSS rules, animations, responsive design, theme variables
- Depends on: None (CSS only)
- Used by: App.jsx and HTML index
- Purpose: Initialize React application and mount to DOM
- Location: `src/main.jsx`
- Contains: React root creation, StrictMode wrapping, DOM mounting
- Depends on: React, App component, index.css
- Used by: index.html script tag
- Purpose: Provide images, SVGs, and static files
- Location: `public/`, `src/assets/`
- Contains: Vite logo, React logo, and other static resources
- Depends on: None
- Used by: App.jsx component references
## Data Flow
- Local component state using React hooks (useState)
- No global state management library
- State is local to App component
## Key Abstractions
- Purpose: Main application root component
- Examples: `src/App.jsx`
- Pattern: Functional component with hooks; handles UI layout and interactivity
- Purpose: Reusable, composable UI units
- Examples: App function in `src/App.jsx`
- Pattern: JavaScript functions returning JSX, can use hooks for state/effects
## Entry Points
- Location: `index.html`
- Triggers: Browser navigation to application
- Responsibilities: Define HTML document structure, load root div, include main.jsx module script
- Location: `src/main.jsx`
- Triggers: Vite dev server or production build loads this module
- Responsibilities: Create React root, render App component, initialize application runtime
- Location: `src/App.jsx`
- Triggers: Rendered by main.jsx during initialization
- Responsibilities: Define top-level application UI, manage application-level state, render nested components
## Error Handling
- StrictMode in `src/main.jsx` wraps App to detect unsafe lifecycle methods and side effects
- No explicit error boundaries implemented
- Errors bubble to browser console
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
