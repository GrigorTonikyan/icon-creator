/**
 * User onboarding and tutorial system
 * Provides guided tours, tooltips, and interactive help for new users
 */

export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    target: string; // CSS selector for the target element
    placement: "top" | "bottom" | "left" | "right";
    action?: "click" | "hover" | "none";
    allowSkip?: boolean;
    showPrevious?: boolean;
    content?: React.ReactNode;
    beforeShow?: () => void;
    afterShow?: () => void;
}

export interface OnboardingTour {
    id: string;
    name: string;
    description: string;
    steps: OnboardingStep[];
    autoStart?: boolean;
    prerequisites?: string[];
}

export interface UserProgress {
    completedTours: string[];
    skippedTours: string[];
    currentStep?: string;
    showHelp: boolean;
    firstTime: boolean;
    lastTourDate?: Date;
}

export interface OnboardingPreferences {
    showTours: boolean;
    autoStartTours: boolean;
    showTooltips: boolean;
    showHints: boolean;
    helpPosition: "floating" | "sidebar" | "modal";
    animationSpeed: "slow" | "normal" | "fast";
}

// Onboarding management class
export class OnboardingManager {
    private static instance: OnboardingManager;
    private tours: Map<string, OnboardingTour> = new Map();
    private userProgress: UserProgress;
    private preferences: OnboardingPreferences;
    private currentTour: OnboardingTour | null = null;
    private currentStepIndex: number = 0;
    private listeners: Set<(event: OnboardingEvent) => void> = new Set();

    private constructor() {
        this.userProgress = this.loadUserProgress();
        this.preferences = this.loadPreferences();
        this.registerDefaultTours();
    }

    public static getInstance(): OnboardingManager {
        if (!OnboardingManager.instance) {
            OnboardingManager.instance = new OnboardingManager();
        }
        return OnboardingManager.instance;
    }

    private loadUserProgress(): UserProgress {
        const stored = localStorage.getItem("onboarding-progress");
        if (stored) {
            try {
                const progress = JSON.parse(stored);
                return {
                    completedTours: [],
                    skippedTours: [],
                    showHelp: true,
                    firstTime: true,
                    ...progress,
                    lastTourDate: progress.lastTourDate ? new Date(progress.lastTourDate) : undefined,
                };
            } catch (error) {
                console.warn("Failed to parse onboarding progress:", error);
            }
        }
        return {
            completedTours: [],
            skippedTours: [],
            showHelp: true,
            firstTime: true,
        };
    }

    private loadPreferences(): OnboardingPreferences {
        const stored = localStorage.getItem("onboarding-preferences");
        if (stored) {
            try {
                return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
            } catch (error) {
                console.warn("Failed to parse onboarding preferences:", error);
            }
        }
        return this.getDefaultPreferences();
    }

    private getDefaultPreferences(): OnboardingPreferences {
        return {
            showTours: true,
            autoStartTours: true,
            showTooltips: true,
            showHints: true,
            helpPosition: "floating",
            animationSpeed: "normal",
        };
    }

    private saveUserProgress(): void {
        try {
            localStorage.setItem("onboarding-progress", JSON.stringify(this.userProgress));
        } catch (error) {
            console.warn("Failed to save onboarding progress:", error);
        }
    }

    private savePreferences(): void {
        try {
            localStorage.setItem("onboarding-preferences", JSON.stringify(this.preferences));
        } catch (error) {
            console.warn("Failed to save onboarding preferences:", error);
        }
    }

    public registerTour(tour: OnboardingTour): void {
        this.tours.set(tour.id, tour);
    }

    public startTour(tourId: string): boolean {
        const tour = this.tours.get(tourId);
        if (!tour) {
            console.warn(`Tour '${tourId}' not found`);
            return false;
        }

        // Check prerequisites
        if (tour.prerequisites) {
            const unmetPrereqs = tour.prerequisites.filter(
                (prereq) => !this.userProgress.completedTours.includes(prereq)
            );
            if (unmetPrereqs.length > 0) {
                console.warn(`Tour '${tourId}' has unmet prerequisites:`, unmetPrereqs);
                return false;
            }
        }

        this.currentTour = tour;
        this.currentStepIndex = 0;

        this.notifyListeners({
            type: "tour-started",
            tourId: tour.id,
            stepIndex: 0,
        });

        this.showCurrentStep();
        return true;
    }

    public nextStep(): boolean {
        if (!this.currentTour) return false;

        this.currentStepIndex++;
        if (this.currentStepIndex >= this.currentTour.steps.length) {
            this.completeTour();
            return false;
        }

        this.showCurrentStep();
        return true;
    }

    public previousStep(): boolean {
        if (!this.currentTour || this.currentStepIndex <= 0) return false;

        this.currentStepIndex--;
        this.showCurrentStep();
        return true;
    }

    public skipTour(): void {
        if (!this.currentTour) return;

        const tourId = this.currentTour.id;
        this.userProgress.skippedTours.push(tourId);
        this.saveUserProgress();

        this.notifyListeners({
            type: "tour-skipped",
            tourId,
        });

        this.endCurrentTour();
    }

    public completeTour(): void {
        if (!this.currentTour) return;

        const tourId = this.currentTour.id;
        this.userProgress.completedTours.push(tourId);
        this.userProgress.lastTourDate = new Date();
        this.saveUserProgress();

        this.notifyListeners({
            type: "tour-completed",
            tourId,
        });

        this.endCurrentTour();
    }

    private endCurrentTour(): void {
        if (this.currentTour) {
            this.notifyListeners({
                type: "tour-ended",
                tourId: this.currentTour.id,
            });
        }

        this.currentTour = null;
        this.currentStepIndex = 0;
    }

    private showCurrentStep(): void {
        if (!this.currentTour) return;

        const step = this.currentTour.steps[this.currentStepIndex];
        if (!step) return;

        // Execute beforeShow callback
        if (step.beforeShow) {
            step.beforeShow();
        }

        this.notifyListeners({
            type: "step-shown",
            tourId: this.currentTour.id,
            stepIndex: this.currentStepIndex,
            step,
        });

        // Execute afterShow callback
        if (step.afterShow) {
            step.afterShow();
        }
    }

    public getCurrentTour(): OnboardingTour | null {
        return this.currentTour;
    }

    public getCurrentStep(): OnboardingStep | null {
        if (!this.currentTour) return null;
        return this.currentTour.steps[this.currentStepIndex] || null;
    }

    public getCurrentStepIndex(): number {
        return this.currentStepIndex;
    }

    public getTourProgress(): { current: number; total: number } {
        if (!this.currentTour) return { current: 0, total: 0 };
        return {
            current: this.currentStepIndex + 1,
            total: this.currentTour.steps.length,
        };
    }

    public getAvailableTours(): OnboardingTour[] {
        return Array.from(this.tours.values()).filter((tour) => {
            // Filter out completed tours unless they're repeatable
            if (this.userProgress.completedTours.includes(tour.id)) {
                return false;
            }

            // Check prerequisites
            if (tour.prerequisites) {
                return tour.prerequisites.every((prereq) => this.userProgress.completedTours.includes(prereq));
            }

            return true;
        });
    }

    public shouldAutoStartTours(): boolean {
        return this.preferences.autoStartTours && this.userProgress.firstTime;
    }

    public markFirstTimeComplete(): void {
        this.userProgress.firstTime = false;
        this.saveUserProgress();
    }

    public updatePreferences(updates: Partial<OnboardingPreferences>): void {
        this.preferences = { ...this.preferences, ...updates };
        this.savePreferences();
    }

    public getPreferences(): OnboardingPreferences {
        return { ...this.preferences };
    }

    public getUserProgress(): UserProgress {
        return { ...this.userProgress };
    }

    public resetProgress(): void {
        this.userProgress = {
            completedTours: [],
            skippedTours: [],
            showHelp: true,
            firstTime: true,
        };
        this.saveUserProgress();
    }

    public addListener(listener: (event: OnboardingEvent) => void): void {
        this.listeners.add(listener);
    }

    public removeListener(listener: (event: OnboardingEvent) => void): void {
        this.listeners.delete(listener);
    }

    private notifyListeners(event: OnboardingEvent): void {
        this.listeners.forEach((listener) => listener(event));
    }

    private registerDefaultTours(): void {
        // Basic navigation tour
        this.registerTour({
            id: "basic-navigation",
            name: "Getting Started",
            description: "Learn the basics of navigating the icon editor",
            autoStart: true,
            steps: [
                {
                    id: "welcome",
                    title: "Welcome to Icon Creator!",
                    description: "Let's take a quick tour to get you started with creating amazing icons.",
                    target: ".visual-editor",
                    placement: "bottom",
                },
                {
                    id: "toolbar",
                    title: "Drawing Tools",
                    description: "These are your drawing tools. Click on different tools to create shapes.",
                    target: ".Toolbar",
                    placement: "right",
                },
                {
                    id: "canvas",
                    title: "Canvas Area",
                    description:
                        "This is your canvas where you create and edit your icons. Click and drag to create shapes.",
                    target: ".Canvas",
                    placement: "top",
                },
                {
                    id: "layers",
                    title: "Layer Panel",
                    description: "Manage your objects with layers. Reorder, group, and organize your design elements.",
                    target: ".LayerPanel",
                    placement: "right",
                },
                {
                    id: "properties",
                    title: "Property Panel",
                    description: "Customize selected objects here. Change colors, sizes, and other properties.",
                    target: ".PropertyPanel",
                    placement: "left",
                },
            ],
        });

        // Shape creation tour
        this.registerTour({
            id: "shape-creation",
            name: "Creating Shapes",
            description: "Learn how to create and manipulate basic shapes",
            prerequisites: ["basic-navigation"],
            steps: [
                {
                    id: "select-rectangle",
                    title: "Select Rectangle Tool",
                    description: "Click on the rectangle tool to start creating rectangles.",
                    target: '[aria-label*="Rectangle tool"]',
                    placement: "right",
                    action: "click",
                },
                {
                    id: "draw-rectangle",
                    title: "Draw a Rectangle",
                    description: "Click and drag on the canvas to create a rectangle.",
                    target: ".Canvas",
                    placement: "top",
                },
                {
                    id: "select-circle",
                    title: "Select Circle Tool",
                    description: "Now try the circle tool.",
                    target: '[aria-label*="Circle tool"]',
                    placement: "right",
                    action: "click",
                },
                {
                    id: "draw-circle",
                    title: "Draw a Circle",
                    description: "Click and drag to create a circle.",
                    target: ".Canvas",
                    placement: "top",
                },
            ],
        });

        // Properties and styling tour
        this.registerTour({
            id: "styling-objects",
            name: "Styling Objects",
            description: "Learn how to customize colors and properties",
            prerequisites: ["shape-creation"],
            steps: [
                {
                    id: "select-object",
                    title: "Select an Object",
                    description: "Click on an object to select it and see its properties.",
                    target: ".Canvas",
                    placement: "top",
                },
                {
                    id: "change-fill",
                    title: "Change Fill Color",
                    description: "Use the fill color picker to change the object's color.",
                    target: '.PropertyPanel [label="Fill"]',
                    placement: "left",
                },
                {
                    id: "change-stroke",
                    title: "Add Stroke",
                    description: "Add a border by enabling stroke and choosing a color.",
                    target: '.PropertyPanel [label="Stroke"]',
                    placement: "left",
                },
                {
                    id: "precision-inputs",
                    title: "Precise Positioning",
                    description: "Use these inputs for exact positioning and sizing.",
                    target: ".PrecisionInputs",
                    placement: "left",
                },
            ],
        });

        // Advanced features tour
        this.registerTour({
            id: "advanced-features",
            name: "Advanced Features",
            description: "Discover powerful features for professional design",
            prerequisites: ["styling-objects"],
            steps: [
                {
                    id: "grid-toggle",
                    title: "Grid System",
                    description: "Toggle the grid to help with alignment.",
                    target: ".GridControls",
                    placement: "left",
                },
                {
                    id: "smart-guides",
                    title: "Smart Guides",
                    description: "Smart guides automatically appear to help align objects.",
                    target: ".SnapSettings",
                    placement: "left",
                },
                {
                    id: "alignment-tools",
                    title: "Alignment Tools",
                    description: "Use these tools to align multiple objects perfectly.",
                    target: ".AlignmentControls",
                    placement: "left",
                },
                {
                    id: "export-options",
                    title: "Export Your Icon",
                    description: "Export your finished icon in various formats.",
                    target: ".ExportControls",
                    placement: "left",
                },
            ],
        });
    }

    /**
     * Check if the user should see onboarding tours
     */
    public shouldShowOnboarding(): boolean {
        // Check if user is first time user
        if (this.userProgress.firstTime) {
            return true;
        }

        // Check if user preferences allow auto-start tours
        if (!this.preferences.autoStartTours) {
            return false;
        }

        // Check if there are recommended tours available
        const availableTours = this.getAvailableTours();
        return availableTours.length > 0;
    }
}

// Event types for onboarding system
export type OnboardingEvent =
    | { type: "tour-started"; tourId: string; stepIndex: number }
    | { type: "tour-ended"; tourId: string }
    | { type: "tour-completed"; tourId: string }
    | { type: "tour-skipped"; tourId: string }
    | { type: "step-shown"; tourId: string; stepIndex: number; step: OnboardingStep };

// Utility functions
export function isFirstTimeUser(): boolean {
    const manager = OnboardingManager.getInstance();
    return manager.getUserProgress().firstTime;
}

export function shouldShowHelp(): boolean {
    const manager = OnboardingManager.getInstance();
    return manager.getUserProgress().showHelp;
}

export function getRecommendedTour(): OnboardingTour | null {
    const manager = OnboardingManager.getInstance();
    const available = manager.getAvailableTours();
    return available.length > 0 ? available[0] ?? null : null;
}
