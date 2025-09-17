import React, { useState, useCallback, useMemo } from "react";
import cn from "classnames";
import type {
    AnimationTimeline,
    AnimationTrack,
    AnimationKeyframe,
    AnimationEasing,
    MotionPath,
} from "../../types/editor";
import { AnimationUtils } from "../../utils/animationUtils";
import { Icon } from "../ui";
import "./animationPanel.css";

export interface AnimationPanelProps {
    className?: string;
    timeline: AnimationTimeline | null;
    motionPaths: MotionPath[];
    showKeyframes: boolean;
    showPaths: boolean;
    playbackSpeed: number;
    isOpen: boolean;
    selectedObjectIds: string[];
    onCreateTimeline: (options: { name?: string; duration?: number; loop?: boolean }) => void;
    onUpdateTimeline: (updates: Partial<AnimationTimeline>) => void;
    onDeleteTimeline: () => void;
    onAddTrack: (objectId: string, property: string) => void;
    onUpdateTrack: (trackId: string, updates: Partial<AnimationTrack>) => void;
    onDeleteTrack: (trackId: string) => void;
    onAddKeyframe: (trackId: string, time: number, properties: Record<string, unknown>) => void;
    onUpdateKeyframe: (trackId: string, keyframeId: string, updates: Partial<AnimationKeyframe>) => void;
    onDeleteKeyframe: (trackId: string, keyframeId: string) => void;
    onAddMotionPath: (objectId: string, path: string, duration: number) => void;
    onUpdateMotionPath: (pathId: string, updates: Partial<MotionPath>) => void;
    onDeleteMotionPath: (pathId: string) => void;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
    onToggleKeyframes: (show: boolean) => void;
    onTogglePaths: (show: boolean) => void;
    onSetPlaybackSpeed: (speed: number) => void;
}

interface TimelineControls {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackSpeed: number;
}

export const AnimationPanel: React.FC<AnimationPanelProps> = ({
    className,
    timeline,
    motionPaths,
    showKeyframes,
    showPaths,
    playbackSpeed,
    isOpen,
    selectedObjectIds,
    onCreateTimeline,
    onUpdateTimeline,
    onDeleteTimeline,
    onAddTrack,
    onUpdateTrack,
    onDeleteTrack,
    onAddKeyframe,
    onUpdateKeyframe,
    onDeleteKeyframe,
    onAddMotionPath,
    onUpdateMotionPath,
    onDeleteMotionPath,
    onPlay,
    onPause,
    onStop,
    onSeek,
    onToggleKeyframes,
    onTogglePaths,
    onSetPlaybackSpeed,
}) => {
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    // Timeline controls state
    const timelineControls: TimelineControls = useMemo(
        () => ({
            isPlaying: timeline?.isPlaying || false,
            currentTime: timeline?.currentTime || 0,
            duration: timeline?.duration || 5,
            playbackSpeed,
        }),
        [timeline, playbackSpeed]
    );

    // Handle timeline creation
    const handleCreateTimeline = useCallback(
        (options: { name?: string; duration?: number; loop?: boolean }) => {
            onCreateTimeline(options);
            setShowCreateDialog(false);
        },
        [onCreateTimeline]
    );

    // Handle adding track for selected objects
    const handleAddTrack = useCallback(
        (property: string) => {
            if (selectedObjectIds.length > 0) {
                const objectId = selectedObjectIds[0]; // Use first selected object
                onAddTrack(objectId, property);
            }
        },
        [selectedObjectIds, onAddTrack]
    );

    // Handle keyframe addition at current time
    const handleAddKeyframe = useCallback(
        (trackId: string) => {
            const currentTime = timeline?.currentTime || 0;
            // Get current property value from the track
            const track = timeline?.tracks.find((t) => t.id === trackId);
            if (track) {
                const currentValue = AnimationUtils.getAnimatedValue(track, currentTime);
                onAddKeyframe(trackId, currentTime, { [track.property]: currentValue });
            }
        },
        [timeline, onAddKeyframe]
    );

    // Handle timeline scrubbing
    const handleTimelineSeek = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (!timeline) return;

            const rect = event.currentTarget.getBoundingClientRect();
            const progress = (event.clientX - rect.left) / rect.width;
            const newTime = progress * timeline.duration;
            onSeek(Math.max(0, Math.min(newTime, timeline.duration)));
        },
        [timeline, onSeek]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <div className={cn("animation-panel", className)}>
            {/* Header */}
            <div className="animation-panel__header">
                <h3 className="animation-panel__title">Animation</h3>

                {!timeline ? (
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="animation-panel__create-button"
                        title="Create timeline">
                        <Icon name="plus" />
                        Create Timeline
                    </button>
                ) : (
                    <div className="animation-panel__timeline-controls">
                        <button
                            onClick={timelineControls.isPlaying ? onPause : onPlay}
                            className="animation-panel__play-button"
                            disabled={!timeline}
                            title={timelineControls.isPlaying ? "Pause" : "Play"}>
                            <Icon name={timelineControls.isPlaying ? "circle" : "chevron-right"} />
                        </button>

                        <button
                            onClick={onStop}
                            className="animation-panel__stop-button"
                            disabled={!timeline}
                            title="Stop">
                            <Icon name="circle" />
                        </button>

                        <span className="animation-panel__time">
                            {timelineControls.currentTime.toFixed(2)}s / {timelineControls.duration.toFixed(2)}s
                        </span>

                        <select
                            value={playbackSpeed}
                            onChange={(e) => onSetPlaybackSpeed(Number(e.target.value))}
                            className="animation-panel__speed-select"
                            title="Playback speed">
                            <option value={0.25}>0.25x</option>
                            <option value={0.5}>0.5x</option>
                            <option value={1}>1x</option>
                            <option value={1.5}>1.5x</option>
                            <option value={2}>2x</option>
                        </select>
                    </div>
                )}
            </div>

            {timeline && (
                <>
                    {/* Timeline Scrubber */}
                    <div className="animation-panel__timeline">
                        <div className="animation-panel__timeline-track" onClick={handleTimelineSeek}>
                            <div className="animation-panel__timeline-background" />
                            <div
                                className="animation-panel__timeline-progress"
                                style={{
                                    width: `${(timelineControls.currentTime / timelineControls.duration) * 100}%`,
                                }}
                            />
                            <div
                                className="animation-panel__timeline-handle"
                                style={{ left: `${(timelineControls.currentTime / timelineControls.duration) * 100}%` }}
                            />
                        </div>

                        <div className="animation-panel__timeline-labels">
                            <span>0s</span>
                            <span>{timelineControls.duration}s</span>
                        </div>
                    </div>

                    {/* Tracks Section */}
                    <div className="animation-panel__section">
                        <div className="animation-panel__section-header">
                            <h4>Animation Tracks</h4>
                            <div className="animation-panel__section-controls">
                                <select
                                    onChange={(e) => handleAddTrack(e.target.value)}
                                    value=""
                                    className="animation-panel__add-track-select"
                                    disabled={selectedObjectIds.length === 0}>
                                    <option value="">Add Track...</option>
                                    <option value="transform.x">Position X</option>
                                    <option value="transform.y">Position Y</option>
                                    <option value="transform.rotation">Rotation</option>
                                    <option value="transform.scaleX">Scale X</option>
                                    <option value="transform.scaleY">Scale Y</option>
                                    <option value="style.fill">Fill</option>
                                    <option value="style.stroke">Stroke</option>
                                    <option value="opacity">Opacity</option>
                                </select>
                            </div>
                        </div>

                        <div className="animation-panel__tracks">
                            {timeline.tracks.length === 0 ? (
                                <div className="animation-panel__empty">
                                    <Icon name="activity" />
                                    <p>No animation tracks yet</p>
                                    <p>Select an object and add a track to start animating</p>
                                </div>
                            ) : (
                                timeline.tracks.map((track) => (
                                    <TrackItem
                                        key={track.id}
                                        track={track}
                                        timeline={timeline}
                                        isSelected={selectedTrackId === track.id}
                                        selectedKeyframeId={selectedKeyframeId}
                                        onSelect={() => setSelectedTrackId(track.id)}
                                        onUpdate={(updates) => onUpdateTrack(track.id, updates)}
                                        onDelete={() => onDeleteTrack(track.id)}
                                        onAddKeyframe={() => handleAddKeyframe(track.id)}
                                        onUpdateKeyframe={onUpdateKeyframe}
                                        onDeleteKeyframe={onDeleteKeyframe}
                                        onSelectKeyframe={setSelectedKeyframeId}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Motion Paths Section */}
                    <div className="animation-panel__section">
                        <div className="animation-panel__section-header">
                            <h4>Motion Paths</h4>
                            <button
                                onClick={() => {
                                    if (selectedObjectIds.length > 0) {
                                        onAddMotionPath(selectedObjectIds[0], "M 0 0 L 100 100", 3);
                                    }
                                }}
                                className="animation-panel__add-button"
                                disabled={selectedObjectIds.length === 0}
                                title="Add motion path">
                                <Icon name="plus" />
                            </button>
                        </div>

                        <div className="animation-panel__motion-paths">
                            {motionPaths.length === 0 ? (
                                <div className="animation-panel__empty">
                                    <Icon name="move" />
                                    <p>No motion paths yet</p>
                                    <p>Add a motion path to animate object movement</p>
                                </div>
                            ) : (
                                motionPaths.map((motionPath) => (
                                    <MotionPathItem
                                        key={motionPath.id}
                                        motionPath={motionPath}
                                        onUpdate={(updates) => onUpdateMotionPath(motionPath.id, updates)}
                                        onDelete={() => onDeleteMotionPath(motionPath.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Display Options */}
                    <div className="animation-panel__options">
                        <label className="animation-panel__option">
                            <input
                                type="checkbox"
                                checked={showKeyframes}
                                onChange={(e) => onToggleKeyframes(e.target.checked)}
                            />
                            Show keyframes on canvas
                        </label>

                        <label className="animation-panel__option">
                            <input
                                type="checkbox"
                                checked={showPaths}
                                onChange={(e) => onTogglePaths(e.target.checked)}
                            />
                            Show motion paths on canvas
                        </label>
                    </div>
                </>
            )}

            {/* Create Timeline Dialog */}
            {showCreateDialog && (
                <CreateTimelineDialog onClose={() => setShowCreateDialog(false)} onCreate={handleCreateTimeline} />
            )}
        </div>
    );
};

// Track Item Component
interface TrackItemProps {
    track: AnimationTrack;
    timeline: AnimationTimeline;
    isSelected: boolean;
    selectedKeyframeId: string | null;
    onSelect: () => void;
    onUpdate: (updates: Partial<AnimationTrack>) => void;
    onDelete: () => void;
    onAddKeyframe: () => void;
    onUpdateKeyframe: (trackId: string, keyframeId: string, updates: Partial<AnimationKeyframe>) => void;
    onDeleteKeyframe: (trackId: string, keyframeId: string) => void;
    onSelectKeyframe: (keyframeId: string | null) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({
    track,
    timeline,
    isSelected,
    selectedKeyframeId,
    onSelect,
    onUpdate,
    onDelete,
    onAddKeyframe,
    onUpdateKeyframe,
    onDeleteKeyframe,
    onSelectKeyframe,
}) => {
    return (
        <div
            className={cn("animation-panel__track", {
                "animation-panel__track--selected": isSelected,
                "animation-panel__track--disabled": !track.enabled,
            })}
            onClick={onSelect}>
            <div className="animation-panel__track-header">
                <div className="animation-panel__track-info">
                    <input
                        type="checkbox"
                        checked={track.enabled}
                        onChange={(e) => onUpdate({ enabled: e.target.checked })}
                        className="animation-panel__track-enabled"
                    />
                    <span className="animation-panel__track-name">{track.objectId.slice(0, 8)}...</span>
                    <span className="animation-panel__track-property">{track.property}</span>
                </div>

                <div className="animation-panel__track-controls">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddKeyframe();
                        }}
                        className="animation-panel__track-button"
                        title="Add keyframe at current time">
                        <Icon name="plus" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="animation-panel__track-button"
                        title="Delete track">
                        <Icon name="trash" />
                    </button>
                </div>
            </div>

            {/* Keyframes Timeline */}
            <div className="animation-panel__keyframes">
                {track.keyframes.map((keyframe) => (
                    <div
                        key={keyframe.id}
                        className={cn("animation-panel__keyframe", {
                            "animation-panel__keyframe--selected": selectedKeyframeId === keyframe.id,
                        })}
                        style={{ left: `${(keyframe.time / timeline.duration) * 100}%` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectKeyframe(keyframe.id);
                        }}
                        title={`Keyframe at ${keyframe.time.toFixed(2)}s`}>
                        <div className="animation-panel__keyframe-handle" />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Motion Path Item Component
interface MotionPathItemProps {
    motionPath: MotionPath;
    onUpdate: (updates: Partial<MotionPath>) => void;
    onDelete: () => void;
}

const MotionPathItem: React.FC<MotionPathItemProps> = ({ motionPath, onUpdate, onDelete }) => {
    return (
        <div className="animation-panel__motion-path">
            <div className="animation-panel__motion-path-header">
                <span className="animation-panel__motion-path-name">{motionPath.objectId.slice(0, 8)}...</span>

                <div className="animation-panel__motion-path-controls">
                    <label className="animation-panel__motion-path-field">
                        Duration:
                        <input
                            type="number"
                            value={motionPath.duration}
                            onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
                            min={0.1}
                            max={60}
                            step={0.1}
                            className="animation-panel__motion-path-input"
                        />
                        s
                    </label>

                    <label className="animation-panel__motion-path-checkbox">
                        <input
                            type="checkbox"
                            checked={motionPath.rotate}
                            onChange={(e) => onUpdate({ rotate: e.target.checked })}
                        />
                        Rotate
                    </label>

                    <button
                        onClick={onDelete}
                        className="animation-panel__motion-path-button"
                        title="Delete motion path">
                        <Icon name="trash" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Create Timeline Dialog Component
interface CreateTimelineDialogProps {
    onClose: () => void;
    onCreate: (options: { name?: string; duration?: number; loop?: boolean }) => void;
}

const CreateTimelineDialog: React.FC<CreateTimelineDialogProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState("New Timeline");
    const [duration, setDuration] = useState(5);
    const [loop, setLoop] = useState(false);

    const handleSubmit = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault();
            onCreate({ name: name.trim(), duration, loop });
        },
        [name, duration, loop, onCreate]
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Create Animation Timeline</h3>
                    <button onClick={onClose} className="modal-close">
                        <Icon name="x" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-field">
                        <label htmlFor="timeline-name">Name</label>
                        <input
                            id="timeline-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Timeline name"
                            autoFocus
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="timeline-duration">Duration (seconds)</label>
                        <input
                            id="timeline-duration"
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            min={0.1}
                            max={300}
                            step={0.1}
                        />
                    </div>

                    <div className="form-field">
                        <label className="form-checkbox">
                            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
                            Loop animation
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="button button--secondary">
                            Cancel
                        </button>
                        <button type="submit" className="button button--primary">
                            Create Timeline
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
