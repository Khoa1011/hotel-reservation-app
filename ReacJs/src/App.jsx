import React, {useEffect} from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainLayout from './routes/MainLayout';
import { NotificationProvider } from './contexts/NotificationContext';


export default function App() {

  return (
    <NotificationProvider>
      <MainLayout />
    <ToastContainer 

    />
    </NotificationProvider>
  );
  
}
