import React from "react";
import { UserPresence as UserPresenceType, User } from "../../types/editor";
import cn from "classnames";
import "./userPresence.css";

interface UserPresenceProps {
    presence: UserPresenceType;
    user: User;
    className?: string;
}

/**
 * User cursor presence indicator
 */
export const UserCursor: React.FC<UserPresenceProps> = ({ presence, user, className }) => {
    if (!presence.cursor) return null;

    const cursorCn = cn("UserCursor", className, {
        active: presence.isActive,
    });

    return (
        <div
            className={cursorCn}
            style={{
                left: presence.cursor.x,
                top: presence.cursor.y,
                color: user.color,
            }}>
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M0 0L16 6L6 10L0 20V0Z" fill="currentColor" stroke="white" strokeWidth="1" />
            </svg>

            {user.name && <div className="UserCursor__label">{user.name}</div>}
        </div>
    );
};

interface UserSelectionProps {
    presence: UserPresenceType;
    user: User;
    objects: Record<string, any>; // Canvas objects
    className?: string;
}

/**
 * User selection indicators
 */
export const UserSelection: React.FC<UserSelectionProps> = ({ presence, user, objects, className }) => {
    if (!presence.selection.length) return null;

    const selectionCn = cn("UserSelection", className);

    return (
        <div className={selectionCn}>
            {presence.selection.map((objectId) => {
                const obj = objects[objectId];
                if (!obj) return null;

                return (
                    <div
                        key={objectId}
                        className="UserSelection__indicator"
                        style={{
                            left: obj.transform.x,
                            top: obj.transform.y,
                            width: obj.width || 100,
                            height: obj.height || 100,
                            borderColor: user.color,
                        }}>
                        <div className="UserSelection__label">{user.name}</div>
                    </div>
                );
            })}
        </div>
    );
};

interface UserPresenceListProps {
    presenceList: UserPresenceType[];
    users: Record<string, User>;
    className?: string;
}

/**
 * List of active users in the session
 */
export const UserPresenceList: React.FC<UserPresenceListProps> = ({ presenceList, users, className }) => {
    const listCn = cn("UserPresenceList", className);

    const activeUsers = presenceList
        .filter((p) => p.isActive && users[p.userId])
        .sort((a, b) => b.lastActivity - a.lastActivity);

    return (
        <div className={listCn}>
            <div className="UserPresenceList__header">
                <span className="UserPresenceList__count">
                    {activeUsers.length} user{activeUsers.length !== 1 ? "s" : ""} online
                </span>
            </div>

            <div className="UserPresenceList__users">
                {activeUsers.map((presence) => {
                    const user = users[presence.userId];
                    if (!user) return null;

                    return (
                        <div key={presence.userId} className="UserPresenceList__user">
                            <div className="UserPresenceList__avatar" style={{ backgroundColor: user.color }}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} />
                                ) : (
                                    <span>{user.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>

                            <div className="UserPresenceList__info">
                                <div className="UserPresenceList__name">{user.name}</div>
                                <div className="UserPresenceList__role">{user.role}</div>
                                {presence.tool && <div className="UserPresenceList__tool">Using {presence.tool}</div>}
                            </div>

                            <div className="UserPresenceList__status" data-active={presence.isActive} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface CollaborationStatusProps {
    isConnected: boolean;
    connectionStatus: "disconnected" | "connecting" | "connected" | "error";
    userCount: number;
    error?: string;
    className?: string;
}

/**
 * Collaboration connection status indicator
 */
export const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
    isConnected,
    connectionStatus,
    userCount,
    error,
    className,
}) => {
    const statusCn = cn("CollaborationStatus", className, connectionStatus);

    const getStatusText = () => {
        switch (connectionStatus) {
            case "connecting":
                return "Connecting...";
            case "connected":
                return `Connected (${userCount} user${userCount !== 1 ? "s" : ""})`;
            case "error":
                return error || "Connection error";
            case "disconnected":
            default:
                return "Disconnected";
        }
    };

    const getStatusIcon = () => {
        switch (connectionStatus) {
            case "connecting":
                return "🔄";
            case "connected":
                return "🟢";
            case "error":
                return "🔴";
            case "disconnected":
            default:
                return "⚫";
        }
    };

    return (
        <div className={statusCn} title={getStatusText()}>
            <span className="CollaborationStatus__icon">{getStatusIcon()}</span>
            <span className="CollaborationStatus__text">{getStatusText()}</span>
        </div>
    );
};

interface PresenceOverlayProps {
    presenceList: UserPresenceType[];
    users: Record<string, User>;
    objects: Record<string, any>;
    showCursors: boolean;
    showSelections: boolean;
    className?: string;
}

/**
 * Main presence overlay that shows all user indicators
 */
export const PresenceOverlay: React.FC<PresenceOverlayProps> = ({
    presenceList,
    users,
    objects,
    showCursors,
    showSelections,
    className,
}) => {
    const overlayCn = cn("PresenceOverlay", className);

    return (
        <div className={overlayCn}>
            {presenceList.map((presence) => {
                const user = users[presence.userId];
                if (!user || !presence.isActive) return null;

                return (
                    <React.Fragment key={presence.userId}>
                        {showCursors && <UserCursor presence={presence} user={user} />}
                        {showSelections && <UserSelection presence={presence} user={user} objects={objects} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
