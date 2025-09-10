// src/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, info: null }; }
  componentDidCatch(error, info) { console.error("ErrorBoundary caught:", error, info); this.setState({ error, info }); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 dark:bg-red-900">
          <div className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">Runtime Error</h2>
            <pre className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto text-red-800 dark:text-red-300" style={{maxHeight:'50vh'}}>
{String(this.state.error && (this.state.error.stack || this.state.error))}
{this.state.info ? ("\n\n" + (this.state.info.componentStack || "")) : ""}
            </pre>
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-brand-500 text-white rounded" onClick={()=>location.reload()}>Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}