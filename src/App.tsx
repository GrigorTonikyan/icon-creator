import { type FC, useState } from "react";
import { Header } from "./components/Header/header";
import { ThemeProvider } from "./contexts/ThemeContext";
import { APITester } from "./features/APITester/APITester";
import { IconCreator } from "./features/IconCreator/iconCreator";
import type { Section } from "./types/header";

import "./app.css";
import "./styles/_index.css";

export const App: FC = () => {
    const [currentSection, setCurrentSection] = useState<Section>("icon-creator");

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

    return (
        <ThemeProvider>
            <div className="app-root">
                <Header currentSection={currentSection} onSectionChange={setCurrentSection} />
                <main className="App__main">{renderCurrentSection()}</main>
            </div>
        </ThemeProvider>
    );
};

export default App;
