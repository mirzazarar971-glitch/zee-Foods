import { Component } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, TriangleAlert } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Zee Foods UI error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="grid min-h-screen place-items-center bg-cream-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-ink-900/[0.06] bg-white p-8 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <TriangleAlert size={26} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold text-ink-900">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            The page hit an unexpected error. Reloading usually fixes it — if it keeps happening, please contact us.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <RefreshCw size={15} /> Reload page
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-ink-900/15 px-5 py-3 text-sm font-semibold text-ink-800 transition hover:bg-cream-100"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
