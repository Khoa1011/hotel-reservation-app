import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from '../pages/AuthPage';
import HomePage from '../pages/HotelHomePage';
import RoomTabs from '../components/RoomManagementTabs';

export default function MainLayout() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<AuthPage />} />
        <Route path="/homepage" element={<HomePage />} />

        {/* Router cho Quản lý phòng */}\
        <Route path="/room-management" element={<RoomTabs/>}/>
      </Routes>
    </BrowserRouter>
  );
}