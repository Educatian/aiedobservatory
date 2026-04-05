import { useState } from "react";

export interface WorkspaceSession {
  displayName: string;
  email: string;
  organization: string;
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (session: WorkspaceSession) => void;
  onSkipTesting: () => void;
}

export function LoginModal({ open, onClose, onSubmit, onSkipTesting }: LoginModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  if (!open) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayName.trim() || !email.trim() || !organization.trim()) {
      return;
    }

    onSubmit({
      displayName: displayName.trim(),
      email: email.trim(),
      organization: organization.trim()
    });
  }

  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div className="login-modal" onClick={(event) => event.stopPropagation()}>
        <div className="login-modal-header">
          <div>
            <span className="landing-kicker">Research Workspace Access</span>
            <h3>Connect your login to the live policy dashboard.</h3>
            <p>
              This local session sign-in unlocks the dashboard workspace and links the landing page to
              the operational interface.
            </p>
          </div>
          <button type="button" className="login-close-button" onClick={onClose} aria-label="Close sign in">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Research access"
              type="text"
            />
          </label>

          <label className="login-field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="workspace@local.aied-policy-atlas"
              type="email"
            />
          </label>

          <label className="login-field">
            <span>Institution</span>
            <input
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              placeholder="AI Education Policy Observatory Lab"
              type="text"
            />
          </label>

          <p className="login-helper">
            For local development, you can enter the dashboard immediately with a test workspace profile.
          </p>

          <div className="login-actions">
            <button type="button" className="landing-secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="landing-secondary-button" onClick={onSkipTesting}>
              Skip for testing
            </button>
            <button type="submit" className="landing-primary-button">
              Enter Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
