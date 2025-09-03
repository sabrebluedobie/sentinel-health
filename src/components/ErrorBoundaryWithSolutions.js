// components/ErrorBoundaryWithSolutions.js
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  getSolution(error) {
    const solutions = {
      'Failed to fetch': 'Check your Supabase connection and API keys',
      'Unauthorized': 'Review your Row Level Security policies',
      'Invalid API key': 'Verify your Supabase environment variables',
    };
    
    for (const [pattern, solution] of Object.entries(solutions)) {
      if (error.message.includes(pattern)) {
        return solution;
      }
    }
    return 'Check the browser console for more details';
  }

render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3>Something went wrong with your dashboard</h3>
          <p className="text-sm text-gray-600 mt-2">
            {this.getSolution(this.state.error)}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}