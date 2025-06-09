import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from '../pages/AuthPage';
import HomePage from '../pages/HotelHomePage';


export default function MainLayout() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<AuthPage />} />
        <Route path="/homepage" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}