import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainLayout from './routes/MainLayout';


export default function App() {
  return (
    <>
    <ToastContainer />
      <MainLayout />
      
    </>
  );
  
}
