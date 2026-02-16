import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Slides from "./pages/Slides";
import NotFound from './pages/404.tsx'
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="*" element={<NotFound />} />
        <Route index element={<Landing />} />
        <Route path="chat" element={<Chat />} />
        <Route path="slides" element={<Slides />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
