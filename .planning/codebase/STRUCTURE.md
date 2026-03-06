# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
ww-workshop-scheduler/
├── src/                    # Main application source code
│   ├── assets/            # Static images and SVGs
│   │   └── react.svg
│   ├── App.jsx            # Root React component
│   ├── App.css            # App component styles
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── public/                # Static public assets served as-is
│   └── vite.svg
├── index.html             # HTML document root
├── package.json           # Node.js dependencies and scripts
├── package-lock.json      # Dependency lock file
├── vite.config.js         # Vite build configuration
├── eslint.config.js       # ESLint configuration
└── README.md              # Project documentation
```

## Directory Purposes

**src/:**
- Purpose: All application source code
- Contains: React components, styles, application logic
- Key files: `main.jsx` (entry), `App.jsx` (root component), `index.css` (global styles)

**src/assets/:**
- Purpose: Static image and SVG assets imported by components
- Contains: Images, icons, logos
- Key files: `react.svg` (React logo used in App component)

**public/:**
- Purpose: Static files copied to root of build output as-is
- Contains: Static assets that don't need processing
- Key files: `vite.svg` (Vite logo, referenced in HTML)

**Root Configuration:**
- Purpose: Project-level build, linting, and dependency configuration
- Contains: Configuration files for Vite, ESLint, dependencies
- Key files: `vite.config.js`, `eslint.config.js`, `package.json`

## Key File Locations

**Entry Points:**
- `index.html`: Main HTML document, loads and mounts React application
- `src/main.jsx`: JavaScript entry point, creates React root and renders App
- `src/App.jsx`: Root React component, contains application UI and state

**Configuration:**
- `vite.config.js`: Build tool configuration with React plugin
- `eslint.config.js`: Code quality rules and linting configuration
- `package.json`: Dependencies (React 19.2.0, React-DOM 19.2.0) and build scripts

**Core Logic:**
- `src/App.jsx`: Main application component with state management using useState hook
- `src/main.jsx`: Application bootstrap and DOM mounting

**Styling:**
- `src/index.css`: Global application styles (typography, colors, animations)
- `src/App.css`: Component-specific styles for App layout and cards

## Naming Conventions

**Files:**
- JSX files: PascalCase for components (e.g., `App.jsx`), camelCase for utilities (none currently)
- CSS files: Match component name + `.css` extension (e.g., `App.css`)
- Static assets: lowercase with hyphens (e.g., `react.svg`, `vite.svg`)

**Directories:**
- All lowercase: `src/`, `public/`, `assets/`
- No hyphens in directory names

**Components:**
- PascalCase function names (e.g., `function App()`)
- Default export for components (e.g., `export default App`)

**Variables/Hooks:**
- camelCase for state variables (e.g., `count`)
- camelCase for setter functions (e.g., `setCount`)
- Hooks follow React convention (e.g., `useState`)

## Where to Add New Code

**New Feature/Component:**
- Primary code: `src/` (create new `.jsx` file for component)
- Styles: Create matching `.css` file (e.g., `MyComponent.jsx` → `MyComponent.css`)
- Imports: Import component in `src/App.jsx` and use in JSX

**New Utility Function:**
- Location: `src/utils/` (directory does not exist yet - create if needed)
- Pattern: Export utility functions from module, import in components

**Global Styles/Theme:**
- Location: `src/index.css` (global styles)
- Pattern: Define CSS variables or classes used across components

**Static Assets:**
- Public assets: `public/` (referenced with absolute paths like `/vite.svg`)
- Component assets: `src/assets/` (imported in components like `import reactLogo from './assets/react.svg'`)

## Special Directories

**node_modules/:**
- Purpose: Contains installed npm dependencies
- Generated: Yes (created by npm install)
- Committed: No (ignored by .gitignore)

**.git/:**
- Purpose: Version control repository metadata
- Generated: Yes
- Committed: N/A (Git metadata)

**dist/:**
- Purpose: Production build output
- Generated: Yes (created by `npm run build`)
- Committed: No (ignored by .gitignore)

---

*Structure analysis: 2026-03-05*
