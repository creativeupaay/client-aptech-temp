import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: "2rem",
            margin: "2rem auto",
            maxWidth: "600px",
            border: "1px solid #fecaca",
            backgroundColor: "#fef2f2",
            borderRadius: "0.5rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#991b1b", marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#b91c1c", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
