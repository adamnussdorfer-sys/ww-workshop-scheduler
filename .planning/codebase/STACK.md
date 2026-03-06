# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**
- JavaScript (JSX) - React components, client-side application logic
- HTML - Template in `index.html`
- CSS - Styling in `src/*.css` files

## Runtime

**Environment:**
- Node.js 24.13.1
- Browser (client-side rendering)

**Package Manager:**
- npm 11.8.0
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.2.0 - UI framework for building interactive components
- Vite 8.0.0-beta.13 - Build tool and development server with HMR

**Build/Dev:**
- @vitejs/plugin-react 5.1.1 - Vite React plugin for JSX transformation and Fast Refresh
- ESLint 9.39.1 - Code linting and style enforcement

## Key Dependencies

**Framework Dependencies:**
- react 19.2.0 - Frontend framework
- react-dom 19.2.0 - React DOM rendering library

**Development Dependencies:**
- @vitejs/plugin-react 5.1.1 - React Fast Refresh for Vite
- @eslint/js 9.39.1 - ESLint rules
- eslint-plugin-react-hooks 7.0.1 - Linting rules for React hooks
- eslint-plugin-react-refresh 0.4.24 - Linting for React Fast Refresh
- globals 16.5.0 - Global object definitions for ESLint
- @types/react 19.2.7 - TypeScript types for React
- @types/react-dom 19.2.3 - TypeScript types for React DOM

## Configuration

**Build Configuration:**
- `vite.config.js` - Vite configuration with React plugin enabled
- `eslint.config.js` - ESLint flat config (v9+) with React hooks and refresh rules

**Environment:**
- No `.env` files present
- No environment variables required for current setup
- Client-side only application (no backend integration)

## Platform Requirements

**Development:**
- Node.js 24.13.1 (recommended)
- npm 11.8.0+ (or compatible package manager)
- Modern browser with ES2020+ support

**Production:**
- Static file hosting (Vite produces `dist/` output)
- Modern browser with ES2020+ support
- No server-side runtime required

## Scripts

**Available Commands:**
- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Build for production to `dist/`
- `npm run lint` - Run ESLint on project files
- `npm run preview` - Preview production build locally

---

*Stack analysis: 2026-03-05*
