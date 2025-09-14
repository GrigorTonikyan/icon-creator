import { type FC, useState } from "react";
import { NavBar } from "./components/NavBar";
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
        <ThemeProvider>
            <div className={appRootCn}>
                <Layout>
                    <LayoutRegion name="navbar">
                        <NavBar currentSection={currentSection} onSectionChange={setCurrentSection} />
                    </LayoutRegion>
                    <LayoutRegion name="main">{renderCurrentSection()}</LayoutRegion>
                </Layout>
            </div>
        </ThemeProvider>
    );
};
