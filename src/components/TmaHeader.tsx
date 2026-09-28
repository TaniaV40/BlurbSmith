import React from "react";

export interface TmaHeaderProps {
  appName?: string;
  appFunction?: string;
  badgeText?: string;
  logoSrc?: string;
  isDriveConnected?: boolean;
  userDisplayName?: string;
  userPhotoURL?: string;
  onConnectDrive?: () => void;
  onDisconnectDrive?: () => void;
  onReset?: () => void;
}

export const TmaHeader: React.FC<TmaHeaderProps> = ({
  appName = "BLURBSMITH",
  appFunction = "AMAZON BEST-SELLER COPYWRITING ENGINE",
  badgeText = "FOR AUTHORS",
  logoSrc = "/Modern_Author_logo.png",
  isDriveConnected = false,
  userDisplayName,
  userPhotoURL,
  onConnectDrive,
  onDisconnectDrive,
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
        {isDriveConnected ? (
          <div className="flex items-center gap-2">
            <div className="btn-google-drive connected flex items-center gap-2">
              <img
                src={userPhotoURL || "https://lh3.googleusercontent.com/a/default-user"}
                alt="User Profile"
                className="w-5 h-5 rounded-full object-cover border border-[#2A7B4C]"
              />
              <span className="max-w-[110px] truncate">{userDisplayName || "Drive Connected"}</span>
            </div>
            {onDisconnectDrive && (
              <button
                type="button"
                onClick={onDisconnectDrive}
                className="text-[11px] text-[#E2D7C7]/60 hover:text-white transition-colors underline"
              >
                Disconnect
              </button>
            )}
          </div>
        ) : (
          onConnectDrive && (
            <button
              type="button"
              className="btn-google-drive"
              onClick={onConnectDrive}
            >
              <span className="text-[#C9A66B] font-bold">➔]</span>
              <span>Connect Google Drive</span>
            </button>
          )
        )}
        <button className="gold-pill-badge" onClick={onReset}>
          {badgeText}
        </button>
      </div>
    </header>
  );
};
