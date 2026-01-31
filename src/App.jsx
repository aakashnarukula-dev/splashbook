import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { PageWrapper } from "./PageWrapper";

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PageWrapper />} />
      </Routes>
    </Router>
  );
};
