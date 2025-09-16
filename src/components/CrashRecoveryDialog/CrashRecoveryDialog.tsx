import { useEffect, useState } from "react";
import { useEditor } from "../../contexts/EditorContext";
import { formatDistanceToNow } from "../../utils/dateUtils";
import { Button } from "../ui/Button/Button";
import "./crashRecoveryDialog.css";

interface CrashRecoveryDialogProps {
    onRestore?: () => void;
    onDismiss?: () => void;
}

export function CrashRecoveryDialog({ onRestore, onDismiss }: CrashRecoveryDialogProps) {
    const { checkAutoSavedProject, loadAutoSavedProjectData, clearAutoSave, getAutoSaveSettings, loadProject } =
        useEditor();

    const [isVisible, setIsVisible] = useState(false);
    const [autoSaveData, setAutoSaveData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const settings = getAutoSaveSettings();

        // Only show if auto-save is enabled, recovery prompts are enabled, and there's an auto-saved project
        if (settings.enabled && settings.showRecoveryPrompt && checkAutoSavedProject()) {
            loadAutoSavedData();
        }
    }, []);

    const loadAutoSavedData = async () => {
        try {
            const data = await loadAutoSavedProjectData();
            if (data) {
                setAutoSaveData(data);
                setIsVisible(true);
            }
        } catch (error) {
            console.error("Failed to load auto-saved project:", error);
        }
    };

    const handleRestore = async () => {
        if (!autoSaveData) return;

        setIsLoading(true);
        try {
            loadProject(autoSaveData);
            clearAutoSave();
            setIsVisible(false);
            onRestore?.();
        } catch (error) {
            console.error("Failed to restore project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = () => {
        clearAutoSave();
        setIsVisible(false);
        onDismiss?.();
    };

    const formatLastModified = () => {
        if (!autoSaveData?.metadata?.lastModified) return "Unknown time";

        try {
            const date = new Date(autoSaveData.metadata.lastModified);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return "Unknown time";
        }
    };

    if (!isVisible || !autoSaveData) {
        return null;
    }

    return (
        <div className="CrashRecoveryDialog-overlay">
            <div className="CrashRecoveryDialog">
                <div className="recovery-header">
                    <h2>Unsaved Work Found</h2>
                    <p>We found an auto-saved version of your project that wasn't properly saved.</p>
                </div>

                <div className="recovery-content">
                    <div className="project-info">
                        <div className="info-row">
                            <span className="info-label">Project:</span>
                            <span className="info-value">{autoSaveData.metadata?.name || "Untitled Project"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Last Modified:</span>
                            <span className="info-value">{formatLastModified()}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Objects:</span>
                            <span className="info-value">
                                {Object.keys(autoSaveData.editorState?.objects || {}).length} objects
                            </span>
                        </div>
                    </div>

                    <div className="recovery-actions">
                        <Button
                            variant="primary"
                            onClick={handleRestore}
                            disabled={isLoading}
                            className="restore-button">
                            {isLoading ? "Restoring..." : "Restore Project"}
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={handleDismiss}
                            disabled={isLoading}
                            className="dismiss-button">
                            Start Fresh
                        </Button>
                    </div>

                    <div className="recovery-note">
                        <p>
                            <strong>Restore Project:</strong> Load the auto-saved version and continue working.
                        </p>
                        <p>
                            <strong>Start Fresh:</strong> Discard the auto-saved version and start with a new project.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
