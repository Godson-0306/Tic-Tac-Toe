import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AiGame } from "./pages/AiGame";
import { Home } from "./pages/Home";
import { LocalGame } from "./pages/LocalGame";
import { OnlineGame } from "./pages/OnlineGame";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/local" element={<LocalGame />} />
        <Route path="/ai" element={<AiGame />} />
        <Route path="/online" element={<OnlineGame />} />
      </Routes>
    </BrowserRouter>
  );
}
