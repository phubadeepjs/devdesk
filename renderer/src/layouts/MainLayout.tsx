import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/App.css';

const MainLayout: React.FC = () => {
  return (
    <div className="app">
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <div className="title-bar">
        <div className="title-bar-drag-region"></div>
      </div>
    </div>
  );
};

export default MainLayout;
