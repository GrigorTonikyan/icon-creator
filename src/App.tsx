import { APITester } from "./features/APITester/APITester";

import logo from "./assets/logo.svg";
import reactLogo from "./assets/react.svg";
import "./styles/_index.css";

export function App() {
    return (
        <div className="app-root">
            <div className="logo-container">
                <img src={logo} alt="Bun Logo" className="logo bun" />
                <img src={reactLogo} alt="React Logo" className="logo react" />
            </div>

            <h1>Bun + React</h1>
            <p>
                Edit <code>src/App.tsx</code> and save to test HMR
            </p>
            <APITester className={"mi-ban"} />
        </div>
    );
}

export default App;
