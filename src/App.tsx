import { type FC, useState, useEffect } from "react";
import { AlignmentControls } from "./components/AlignmentControls";
import { AnalyticsSettings } from "./components/AnalyticsSettings";
import { ComponentLibraryPanel } from "./components/ComponentLibraryPanel";
import { CrashRecoveryDialog } from "./components/CrashRecoveryDialog";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorRecoveryProvider } from "./components/ErrorRecoveryProvider";
import { GridControls } from "./components/GridControls";
import { GuideControls } from "./components/GuideControls";
import { HistoryPanel } from "./components/HistoryPanel";
import { LayerPanel } from "./components/LayerPanel";
import { NavBar } from "./components/NavBar";
import { PrecisionInputs } from "./components/PrecisionInputs";
import { PropertyPanel } from "./components/PropertyPanel";
import { RulerControls } from "./components/RulerControls";
import { SnapSettings } from "./components/SnapSettings";
import { ThemeSettings } from "./components/ThemeSettings";
import { SkipLink } from "./components/ui/SkipLink/SkipLink";
import { TourGuide } from "./components/TourGuide/TourGuide";
import { EditorProvider } from "./contexts/EditorContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { APITester } from "./features/APITester/APITester";
import { IconCreator } from "./features/IconCreator/iconCreator";
import { Layout, LayoutRegion } from "./features/Layout";
import { VisualEditor } from "./features/VisualEditor";
import { type Section } from "./types/navBar";
import { OnboardingManager } from "./utils/onboarding";
import { analytics, trackFeatureUsage } from "./utils/analytics";

import cn from "classnames";
import "./app.css";
import "./styles/_index.css";

export const App: FC = () => {
    const [currentSection, setCurrentSection] = useState<Section>("visual-editor");
    const [sidebarLeftHidden, setSidebarLeftHidden] = useState(false);

    // Initialize onboarding for new users
    useEffect(() => {
        const onboardingManager = OnboardingManager.getInstance();

        // Check if user is new and should see onboarding
        if (onboardingManager.shouldShowOnboarding()) {
            // Delay tour start to ensure app is fully loaded
            setTimeout(() => {
                onboardingManager.startTour("welcome");
            }, 1000);
        }

        // Track app initialization
        trackFeatureUsage("app", "initialize", {
            initialSection: currentSection,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
        });
    }, []);

    // Track section changes
    useEffect(() => {
        trackFeatureUsage("navigation", "section_change", {
            section: currentSection,
            timestamp: Date.now(),
        });
    }, [currentSection]);

    const handleSectionChange = (section: Section) => {
        trackFeatureUsage("navigation", "manual_section_change", {
            from: currentSection,
            to: section,
            timestamp: Date.now(),
        });
        setCurrentSection(section);
    };

    const renderCurrentSection = () => {
        switch (currentSection) {
            case "icon-creator":
                return <IconCreator />;
            case "visual-editor":
                return <VisualEditor />;
            case "api-tester":
                return <APITester />;
            default:
                return <IconCreator />;
        }
    };

    const renderLeftSidebar = () => {
        if (currentSection === "visual-editor") {
            return (
                <aside className="visual-editor__left-panel">
                    <LayerPanel />
                </aside>
            );
        }
        return null;
    };

    const renderRightSidebar = () => {
        if (currentSection === "visual-editor") {
            return (
                <aside className="visual-editor__right-panel">
                    <div className="visual-editor__right-panel-content">
                        <div className="visual-editor__grid-section">
                            <GridControls />
                        </div>
                        <div className="visual-editor__guide-section">
                            <GuideControls />
                        </div>
                        <div className="visual-editor__ruler-section">
                            <RulerControls />
                        </div>
                        <div className="visual-editor__snap-section">
                            <SnapSettings />
                        </div>
                        <div className="visual-editor__alignment-section">
                            <AlignmentControls />
                        </div>
                        <div className="visual-editor__precision-section">
                            <PrecisionInputs />
                        </div>
                        <div className="visual-editor__properties-section">
                            <PropertyPanel />
                        </div>
                        <div className="visual-editor__component-library-section">
                            <ComponentLibraryPanel />
                        </div>
                        <div className="visual-editor__history-section">
                            <HistoryPanel />
                        </div>
                        <div className="visual-editor__analytics-section">
                            <AnalyticsSettings />
                        </div>
                        <div className="visual-editor__theme-section">
                            <ThemeSettings />
                        </div>
                    </div>
                </aside>
            );
        }
        return null;
    };

    const appRootCn = cn("app-root", {
        "aside-left-hidden": sidebarLeftHidden,
    });

    const layoutContent = (
        <Layout>
            <LayoutRegion name="navbar">
                <ErrorBoundary fallback={<div>Navigation unavailable</div>}>
                    <div id="navigation">
                        <NavBar currentSection={currentSection} onSectionChange={handleSectionChange} />
                    </div>
                </ErrorBoundary>
            </LayoutRegion>

            <LayoutRegion name="aside-l">
                <ErrorBoundary fallback={<div>Left sidebar unavailable</div>}>{renderLeftSidebar()}</ErrorBoundary>
            </LayoutRegion>

            <LayoutRegion name="main">
                <ErrorBoundary fallback={<div>Content unavailable</div>}>
                    <div id="main-content">{renderCurrentSection()}</div>
                </ErrorBoundary>
            </LayoutRegion>

            <LayoutRegion name="aside-r">
                <ErrorBoundary fallback={<div>Right sidebar unavailable</div>}>{renderRightSidebar()}</ErrorBoundary>
            </LayoutRegion>
        </Layout>
    );

    return (
        <ErrorRecoveryProvider autoSaveInterval={30000}>
            <ThemeProvider>
                <div className={appRootCn}>
                    <SkipLink href="#main-content">Skip to main content</SkipLink>
                    <SkipLink href="#navigation">Skip to navigation</SkipLink>
                    {currentSection === "visual-editor" ? (
                        <EditorProvider>
                            {layoutContent}
                            <CrashRecoveryDialog />
                            <TourGuide />
                        </EditorProvider>
                    ) : (
                        <>
                            {layoutContent}
                            <TourGuide />
                        </>
                    )}
                </div>
            </ThemeProvider>
        </ErrorRecoveryProvider>
    );
};
