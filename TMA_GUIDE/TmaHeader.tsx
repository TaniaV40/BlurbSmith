import React from "react";

export interface TmaHeaderProps {
  appName: string;
  appFunction: string;
  badgeText?: string;
  logoSrc?: string;
  isDriveConnected?: boolean;
  onConnectDrive?: () => void;
  onReset?: () => void;
}

export const TmaHeader: React.FC<TmaHeaderProps> = ({
  appName = "APP NAME",
  appFunction = "APP FUNCTION",
  badgeText = "FOR BEGINNERS",
  logoSrc = "/Modern_Author_logo.png",
  isDriveConnected = false,
  onConnectDrive,
  onReset,
}) => {
  return (
    <header className="topbar">
      {/* Brand Logo & Stacked Text */}
      <button className="brand-group" onClick={onReset} aria-label="Home">
        <img
          src={logoSrc}
          alt="The Modern Author Icon"
          className="brand-icon-sq"
        />
        <div className="brand-stacked-text">
          <span>THE</span>
          <span>MODERN</span>
          <span>AUTHOR</span>
        </div>
      </button>

      {/* Center Title & Function */}
      <div className="app-title-center">
        <span className="app-name-text">{appName}</span>
        <span className="app-function-text">{appFunction}</span>
      </div>

      {/* Right Actions */}
      <div className="header-actions">
        {onConnectDrive && (
          <button
            type="button"
            className={`btn-google-drive ${isDriveConnected ? "connected" : ""}`}
            onClick={onConnectDrive}
          >
            <span className="text-gold font-bold">➔]</span>
            {isDriveConnected ? "Drive Connected" : "Connect Google Drive"}
          </button>
        )}
        <button className="gold-pill-badge" onClick={onReset}>
          {badgeText}
        </button>
      </div>
    </header>
  );
};
