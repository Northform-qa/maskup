import React from 'react'
import '@testing-library/jest-dom'

// @vitejs/plugin-react v6 (Oxc) does not inject the JSX runtime into test
// files processed by Vitest's jsdom environment. Exposing React globally
// keeps the classic JSX transform path working in all test files.
globalThis.React = React
