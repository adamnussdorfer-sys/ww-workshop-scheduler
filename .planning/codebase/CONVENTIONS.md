# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**
- JavaScript/JSX files use PascalCase for components: `App.jsx`, `main.jsx`
- CSS files are lowercase: `App.css`, `index.css`
- Asset files are lowercase with descriptive names: `react.svg`

**Functions:**
- React component functions use PascalCase: `App`, `StrictMode`
- React hooks follow convention with `use` prefix: `useState`
- Exported functions are named explicitly (not anonymous)

**Variables:**
- State variables use camelCase: `count`, `setCount`
- Event handlers follow camelCase: `onClick`
- Import statements preserve original casing from modules

**Types:**
- React component types match component names
- Props and state follow TypeScript conventions (not fully typed in current JSX)

## Code Style

**Formatting:**
- No explicit prettier config found - uses ESLint defaults
- 2-space indentation observed
- Imports sorted: React modules first, then local imports, then CSS/assets
- Single quotes for JSX attributes and content

**Linting:**
- ESLint enabled with flat config format: `eslint.config.js`
- Browser globals configured via `globals` package
- ECMAScript 2020+ syntax support

**ESLint Rules:**
- `no-unused-vars`: Error level, with pattern `^[A-Z_]` excluded (allows unused constants)
- React Hooks rules enabled: `eslint-plugin-react-hooks`
- React Refresh rules enabled: `eslint-plugin-react-refresh`

## Import Organization

**Order:**
1. External library imports (React, React DOM)
2. Local component/module imports
3. Asset imports (images, SVGs)
4. Style imports (CSS)

**Examples from codebase:**
```jsx
// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
```

```jsx
// src/App.jsx
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
```

**Path Aliases:**
- Absolute paths used for public assets: `/vite.svg`
- Relative paths used for local imports: `./App.jsx`, `./assets/react.svg`

## Error Handling

**Patterns:**
- React StrictMode enabled to catch errors during development: `<StrictMode>` wrapper
- No explicit error boundary implementation in current codebase
- No try-catch blocks observed in sample code

## Logging

**Framework:** Not explicitly configured - standard `console` available via browser globals

**Patterns:**
- No logging patterns observed in current source files
- Recommended approach would follow browser console methods: `console.log()`, `console.error()`, etc.

## Comments

**When to Comment:**
- No inline comments observed in current codebase
- JSDoc style not currently used
- Code is self-documenting where possible (explicit component and variable names)

**JSDoc/TSDoc:**
- Not detected in current implementation
- Not required for JSX files at this stage

## Function Design

**Size:**
- Functions kept small and focused
- React components typically single responsibility

**Parameters:**
- Components use destructuring for props (standard React pattern)
- Callbacks use arrow functions: `onClick={() => setCount((count) => count + 1)}`

**Return Values:**
- Components return JSX elements
- Hooks return values and state setters: `const [count, setCount] = useState(0)`

## Module Design

**Exports:**
- Default exports used for main components: `export default App`
- Named exports for hooks and utilities (not yet present)

**Barrel Files:**
- Not used in current structure
- Simple flat structure with `main.jsx` as entry point

## Code Examples

**React Hook Usage Pattern:**
```jsx
const [count, setCount] = useState(0)
```

**Event Binding Pattern:**
```jsx
<button onClick={() => setCount((count) => count + 1)}>
  count is {count}
</button>
```

**Component Structure:**
```jsx
function App() {
  // state and logic
  const [state, setState] = useState(initialValue)

  // return JSX
  return (
    <>
      {/* JSX content */}
    </>
  )
}

export default App
```

---

*Convention analysis: 2026-03-05*
