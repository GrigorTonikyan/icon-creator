import { type FC, useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NavBar } from "./components/NavBar";
import { SkipLink } from "./components/ui/SkipLink/SkipLink";
import { ThemeProvider } from "./contexts/ThemeContext";
import { APITester } from "./features/APITester/APITester";
import { IconCreator } from "./features/IconCreator/iconCreator";
import { Layout, LayoutRegion } from "./features/Layout";
import { type Section } from "./types/navBar";

import cn from "classnames";
import "./app.css";
import "./styles/_index.css";

export const App: FC = () => {
    const [currentSection, setCurrentSection] = useState<Section>("icon-creator");
    const [sidebarLeftHidden, setSidebarLeftHidden] = useState(false);

    const renderCurrentSection = () => {
        switch (currentSection) {
            case "icon-creator":
                return <IconCreator />;
            case "api-tester":
                return <APITester />;
            default:
                return <IconCreator />;
        }
    };

    const appRootCn = cn("app-root", {
        "aside-left-hidden": sidebarLeftHidden,
    });

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <div className={appRootCn}>
                    <SkipLink href="#main-content">Skip to main content</SkipLink>
                    <SkipLink href="#navigation">Skip to navigation</SkipLink>
                    <Layout>
                        <LayoutRegion name="navbar">
                            <ErrorBoundary fallback={<div>Navigation unavailable</div>}>
                                <div id="navigation">
                                    <NavBar currentSection={currentSection} onSectionChange={setCurrentSection} />
                                </div>
                            </ErrorBoundary>
                        </LayoutRegion>
                        <LayoutRegion name="main">
                            <ErrorBoundary fallback={<div>Content unavailable</div>}>
                                <div id="main-content">{renderCurrentSection()}</div>
                            </ErrorBoundary>
                        </LayoutRegion>
                    </Layout>
                </div>
            </ThemeProvider>
        </ErrorBoundary>
    );
};
