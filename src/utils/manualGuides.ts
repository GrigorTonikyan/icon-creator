/**
 * Manual guide utilities for guide creation and snapping
 */

import { type ManualGuide, type Point } from "../types/editor";

export interface GuideSnapResult {
    x: number;
    y: number;
    snapped: boolean;
    snapType?: "guide-horizontal" | "guide-vertical";
    snappedGuides: ManualGuide[];
}

export interface GuideSnapOptions {
    enabled: boolean;
    threshold: number; // Distance within which snapping occurs
    snapToHorizontal: boolean;
    snapToVertical: boolean;
}

/**
 * Generate a unique ID for a guide
 */
export function generateGuideId(): string {
    return `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new manual guide
 */
export function createManualGuide(
    type: "horizontal" | "vertical",
    position: number,
    options?: {
        color?: string;
        locked?: boolean;
        visible?: boolean;
    }
): ManualGuide {
    return {
        id: generateGuideId(),
        type,
        position,
        locked: options?.locked ?? false,
        color: options?.color,
        visible: options?.visible ?? true,
    };
}

/**
 * Snap a point to manual guides
 */
export function snapToGuides(point: Point, guides: ManualGuide[], options: GuideSnapOptions): GuideSnapResult {
    if (!options.enabled) {
        return {
            x: point.x,
            y: point.y,
            snapped: false,
            snappedGuides: [],
        };
    }

    const threshold = options.threshold;
    let bestSnapX = point.x;
    let bestSnapY = point.y;
    let snapped = false;
    let snapType: GuideSnapResult["snapType"];
    const snappedGuides: ManualGuide[] = [];

    // Filter visible guides
    const visibleGuides = guides.filter((guide) => guide.visible);

    // Snap to vertical guides (affects X position)
    if (options.snapToVertical) {
        const verticalGuides = visibleGuides.filter((guide) => guide.type === "vertical");

        for (const guide of verticalGuides) {
            const distance = Math.abs(point.x - guide.position);
            if (distance <= threshold && distance < Math.abs(point.x - bestSnapX)) {
                bestSnapX = guide.position;
                snapType = "guide-vertical";
                snapped = true;
                snappedGuides.push(guide);
            }
        }
    }

    // Snap to horizontal guides (affects Y position)
    if (options.snapToHorizontal) {
        const horizontalGuides = visibleGuides.filter((guide) => guide.type === "horizontal");

        for (const guide of horizontalGuides) {
            const distance = Math.abs(point.y - guide.position);
            if (distance <= threshold && distance < Math.abs(point.y - bestSnapY)) {
                bestSnapY = guide.position;
                snapType = "guide-horizontal";
                snapped = true;
                snappedGuides.push(guide);
            }
        }
    }

    return {
        x: bestSnapX,
        y: bestSnapY,
        snapped,
        snapType,
        snappedGuides,
    };
}

/**
 * Snap a rectangle to manual guides
 */
export function snapRectangleToGuides(
    rect: { x: number; y: number; width: number; height: number },
    guides: ManualGuide[],
    options: GuideSnapOptions
): GuideSnapResult {
    if (!options.enabled) {
        return {
            x: rect.x,
            y: rect.y,
            snapped: false,
            snappedGuides: [],
        };
    }

    const threshold = options.threshold;
    let bestSnapX = rect.x;
    let bestSnapY = rect.y;
    let snapped = false;
    let snapType: GuideSnapResult["snapType"];
    const snappedGuides: ManualGuide[] = [];

    // Filter visible guides
    const visibleGuides = guides.filter((guide) => guide.visible);

    // Snap to vertical guides (affects X position)
    if (options.snapToVertical) {
        const verticalGuides = visibleGuides.filter((guide) => guide.type === "vertical");

        for (const guide of verticalGuides) {
            // Test snapping left edge, center, and right edge
            const snapCandidates = [
                { position: guide.position, targetX: guide.position }, // Left edge
                { position: guide.position, targetX: guide.position - rect.width / 2 }, // Center
                { position: guide.position, targetX: guide.position - rect.width }, // Right edge
            ];

            for (const candidate of snapCandidates) {
                const distance = Math.abs(rect.x - candidate.targetX);
                if (distance <= threshold && distance < Math.abs(rect.x - bestSnapX)) {
                    bestSnapX = candidate.targetX;
                    snapType = "guide-vertical";
                    snapped = true;
                    snappedGuides.push(guide);
                }
            }
        }
    }

    // Snap to horizontal guides (affects Y position)
    if (options.snapToHorizontal) {
        const horizontalGuides = visibleGuides.filter((guide) => guide.type === "horizontal");

        for (const guide of horizontalGuides) {
            // Test snapping top edge, center, and bottom edge
            const snapCandidates = [
                { position: guide.position, targetY: guide.position }, // Top edge
                { position: guide.position, targetY: guide.position - rect.height / 2 }, // Center
                { position: guide.position, targetY: guide.position - rect.height }, // Bottom edge
            ];

            for (const candidate of snapCandidates) {
                const distance = Math.abs(rect.y - candidate.targetY);
                if (distance <= threshold && distance < Math.abs(rect.y - bestSnapY)) {
                    bestSnapY = candidate.targetY;
                    snapType = "guide-horizontal";
                    snapped = true;
                    snappedGuides.push(guide);
                }
            }
        }
    }

    return {
        x: bestSnapX,
        y: bestSnapY,
        snapped,
        snapType,
        snappedGuides,
    };
}

/**
 * Snap a circle to manual guides
 */
export function snapCircleToGuides(
    circle: { x: number; y: number; radius: number },
    guides: ManualGuide[],
    options: GuideSnapOptions
): GuideSnapResult {
    // For circles, snap the center or edges
    return snapRectangleToGuides(
        {
            x: circle.x - circle.radius,
            y: circle.y - circle.radius,
            width: circle.radius * 2,
            height: circle.radius * 2,
        },
        guides,
        options
    );
}

/**
 * Check if a guide position conflicts with existing guides
 */
export function hasGuideConflict(
    type: "horizontal" | "vertical",
    position: number,
    existingGuides: ManualGuide[],
    tolerance: number = 1
): boolean {
    return existingGuides.some((guide) => guide.type === type && Math.abs(guide.position - position) < tolerance);
}

/**
 * Find the nearest guide to a position
 */
export function findNearestGuide(
    type: "horizontal" | "vertical",
    position: number,
    guides: ManualGuide[],
    maxDistance: number = Infinity
): ManualGuide | null {
    const filteredGuides = guides.filter((guide) => guide.type === type && guide.visible);

    let nearestGuide: ManualGuide | null = null;
    let nearestDistance = maxDistance;

    for (const guide of filteredGuides) {
        const distance = Math.abs(guide.position - position);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestGuide = guide;
        }
    }

    return nearestGuide;
}
