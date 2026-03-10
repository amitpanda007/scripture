import { Trash2 } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { addNotification } from "../utils/appStorage";

export function ProfilePage() {
  const { theme, toggleTheme } = useTheme();

  const clearPlayback = () => {
    localStorage.removeItem("scripture_playback");
    addNotification("Playback reset", "Saved playback state was cleared.");
  };

  return (
    <div className="px-6 pb-28 max-w-4xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-text-primary">Profile</h1>
        <p className="text-sm text-text-muted">Preferences and quick actions.</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
          <p className="text-sm font-medium text-text-primary">Theme</p>
          <p className="mb-3 text-xs text-text-muted">Current: {theme}</p>
          <button
            onClick={toggleTheme}
            className="rounded-full bg-accent px-4 py-2 text-sm text-white hover:bg-accent-dim"
          >
            Toggle theme
          </button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
          <p className="text-sm font-medium text-text-primary">Playback</p>
          <p className="mb-3 text-xs text-text-muted">Clear the saved resume point.</p>
          <button
            onClick={clearPlayback}
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <Trash2 size={14} />
            Clear saved playback
          </button>
        </div>
      </div>
    </div>
  );
}
