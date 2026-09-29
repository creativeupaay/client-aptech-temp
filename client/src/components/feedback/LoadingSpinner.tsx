import type { FC, CSSProperties } from "react";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeClasses = {
  sm: { width: "18px", height: "18px", borderWidth: "2px" },
  md: { width: "32px", height: "32px", borderWidth: "3px" },
  lg: { width: "48px", height: "48px", borderWidth: "4px" },
};

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  message,
  size = "md",
  color = "#DB6516",
}) => {
  const spinnerStyle: CSSProperties = {
    ...sizeClasses[size],
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    borderTopColor: color,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  };

  const containerStyle: CSSProperties = fullScreen
    ? {
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
      }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      };

  return (
    <div style={containerStyle} role="status" aria-live="polite">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinnerStyle} />
      {message && (
        <p style={{ marginTop: "0.75rem", color: "#64748b", fontSize: "0.875rem" }}>
          {message}
        </p>
      )}
      <span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden" }}>
        Loading...
      </span>
    </div>
  );
};
