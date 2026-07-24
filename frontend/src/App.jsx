import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import KambanPage from './kamban/KambanPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/kamban" element={<KambanPage />} />
    </Routes>
  );
}
