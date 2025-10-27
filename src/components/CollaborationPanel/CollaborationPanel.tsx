import React, { useState } from "react";
import cn from "classnames";
import { useEditor } from "../../contexts/EditorContext";
import { UserPresenceList, CollaborationStatus } from "../UserPresence";
import { ConflictList } from "../ConflictResolution";
import type { User } from "../../types/editor";
import "./CollaborationPanel.css";

interface CollaborationPanelProps {
    className?: string;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function CollaborationPanel({ className, isCollapsed = false, onToggleCollapse }: CollaborationPanelProps) {
    const { state, enableCollaboration, disableCollaboration, addUser } = useEditor();
    const [activeTab, setActiveTab] = useState<"users" | "conflicts" | "settings">("users");
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    const { collaboration } = state;
    const isCollaborationEnabled = collaboration.isEnabled;
    const hasConflicts = collaboration.conflicts.length > 0;

    const collaborationPanelCn = cn("CollaborationPanel", className, {
        collapsed: isCollapsed,
        enabled: isCollaborationEnabled,
        "has-conflicts": hasConflicts,
    });

    const handleEnableCollaboration = () => {
        const sessionId = `session_${Date.now()}`;
        const userName = prompt("Enter your name for collaboration:") || "Anonymous User";
        enableCollaboration(sessionId, userName);
    };

    const handleInviteUser = () => {
        if (!inviteEmail.trim()) return;

        const newUser: User = {
            id: `user_${Date.now()}`,
            name: inviteEmail.split("@")[0] || "New User",
            email: inviteEmail,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            role: "editor",
            isOnline: false,
            lastSeen: Date.now(),
        };

        addUser(newUser);
        setInviteEmail("");
        setIsInviteModalOpen(false);
    };

    if (isCollapsed) {
        return (
            <div className={collaborationPanelCn}>
                <button
                    className="CollaborationPanel__toggle"
                    onClick={onToggleCollapse}
                    title="Expand Collaboration Panel">
                    <span className="CollaborationPanel__toggle-icon">👥</span>
                    {hasConflicts && (
                        <span className="CollaborationPanel__notification-badge">{collaboration.conflicts.length}</span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className={collaborationPanelCn}>
            <div className="CollaborationPanel__header">
                <h3 className="CollaborationPanel__title">
                    Collaboration
                    {hasConflicts && (
                        <span className="CollaborationPanel__conflict-count">
                            ({collaboration.conflicts.length} conflicts)
                        </span>
                    )}
                </h3>

                <div className="CollaborationPanel__actions">
                    {!isCollaborationEnabled ? (
                        <button className="CollaborationPanel__enable-btn" onClick={handleEnableCollaboration}>
                            Start Collaboration
                        </button>
                    ) : (
                        <>
                            <button
                                className="CollaborationPanel__invite-btn"
                                onClick={() => setIsInviteModalOpen(true)}>
                                Invite
                            </button>
                            <button
                                className="CollaborationPanel__disable-btn"
                                onClick={disableCollaboration}
                                title="Stop Collaboration">
                                Stop
                            </button>
                        </>
                    )}

                    {onToggleCollapse && (
                        <button
                            className="CollaborationPanel__collapse-btn"
                            onClick={onToggleCollapse}
                            title="Collapse Panel">
                            ×
                        </button>
                    )}
                </div>
            </div>

            {isCollaborationEnabled && (
                <>
                    <CollaborationStatus
                        className="CollaborationPanel__status"
                        isConnected={collaboration.isConnected}
                        connectionStatus={collaboration.connectionStatus}
                        userCount={collaboration.session?.users.length || 0}
                        error={collaboration.connectionStatus === "error" ? "Connection failed" : undefined}
                    />

                    <div className="CollaborationPanel__tabs">
                        <button
                            className={cn("CollaborationPanel__tab", { active: activeTab === "users" })}
                            onClick={() => setActiveTab("users")}>
                            Users ({collaboration.session?.users.length || 0})
                        </button>
                        <button
                            className={cn("CollaborationPanel__tab", { active: activeTab === "conflicts" })}
                            onClick={() => setActiveTab("conflicts")}>
                            Conflicts ({collaboration.conflicts.length})
                            {hasConflicts && <span className="CollaborationPanel__tab-badge" />}
                        </button>
                        <button
                            className={cn("CollaborationPanel__tab", { active: activeTab === "settings" })}
                            onClick={() => setActiveTab("settings")}>
                            Settings
                        </button>
                    </div>

                    <div className="CollaborationPanel__content">
                        {activeTab === "users" && (
                            <div className="CollaborationPanel__users">
                                <UserPresenceList
                                    presenceList={collaboration.session?.activePresence || []}
                                    users={
                                        collaboration.session?.users.reduce(
                                            (acc, user) => ({
                                                ...acc,
                                                [user.id]: user,
                                            }),
                                            {} as Record<string, User>
                                        ) || {}
                                    }
                                />
                            </div>
                        )}

                        {activeTab === "conflicts" && (
                            <div className="CollaborationPanel__conflicts">
                                {collaboration.conflicts.length > 0 ? (
                                    <ConflictList
                                        conflicts={collaboration.conflicts}
                                        users={
                                            collaboration.session?.users.reduce(
                                                (acc, user) => ({
                                                    ...acc,
                                                    [user.id]: user,
                                                }),
                                                {} as Record<string, User>
                                            ) || {}
                                        }
                                        onSelectConflict={(conflict) => {
                                            // Handle conflict selection - could open a detailed dialog
                                            console.log("Selected conflict:", conflict);
                                        }}
                                    />
                                ) : (
                                    <div className="CollaborationPanel__no-conflicts">
                                        <span className="CollaborationPanel__no-conflicts-icon">✅</span>
                                        <p>No conflicts detected</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="CollaborationPanel__settings">
                                <div className="CollaborationPanel__setting">
                                    <label className="CollaborationPanel__setting-label">
                                        <input
                                            type="checkbox"
                                            checked={collaboration.session?.settings.allowAnonymous || false}
                                            readOnly
                                        />
                                        Allow anonymous users
                                    </label>
                                </div>

                                <div className="CollaborationPanel__setting">
                                    <label className="CollaborationPanel__setting-label">
                                        <input
                                            type="checkbox"
                                            checked={collaboration.session?.settings.requireApproval || false}
                                            readOnly
                                        />
                                        Require approval for new users
                                    </label>
                                </div>

                                <div className="CollaborationPanel__setting">
                                    <label className="CollaborationPanel__setting-label">
                                        Conflict resolution:
                                        <select
                                            value={collaboration.session?.settings.conflictResolution || "manual"}
                                            disabled>
                                            <option value="auto">Automatic</option>
                                            <option value="manual">Manual</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!isCollaborationEnabled && (
                <div className="CollaborationPanel__empty">
                    <div className="CollaborationPanel__empty-icon">👥</div>
                    <h4>Real-time Collaboration</h4>
                    <p>Work together with others in real-time. Share your project and see changes as they happen.</p>
                    <button className="CollaborationPanel__get-started-btn" onClick={handleEnableCollaboration}>
                        Get Started
                    </button>
                </div>
            )}

            {/* Invite User Modal */}
            {isInviteModalOpen && (
                <div className="CollaborationPanel__modal-overlay">
                    <div className="CollaborationPanel__modal">
                        <div className="CollaborationPanel__modal-header">
                            <h4>Invite User to Collaborate</h4>
                            <button
                                className="CollaborationPanel__modal-close"
                                onClick={() => setIsInviteModalOpen(false)}>
                                ×
                            </button>
                        </div>

                        <div className="CollaborationPanel__modal-content">
                            <label className="CollaborationPanel__modal-label">
                                Email address:
                                <input
                                    type="email"
                                    className="CollaborationPanel__modal-input"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    onKeyPress={(e) => e.key === "Enter" && handleInviteUser()}
                                />
                            </label>
                        </div>

                        <div className="CollaborationPanel__modal-actions">
                            <button
                                className="CollaborationPanel__modal-cancel"
                                onClick={() => setIsInviteModalOpen(false)}>
                                Cancel
                            </button>
                            <button
                                className="CollaborationPanel__modal-invite"
                                onClick={handleInviteUser}
                                disabled={!inviteEmail.trim()}>
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
