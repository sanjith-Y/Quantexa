import React from 'react';
import { AppProvider, useApp } from './hooks/useAppState';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { IntersectionModal } from './components/network/IntersectionModal';
import { HackathonDemoModal } from './components/features/HackathonDemoModal';
import { PresentationView } from './components/presentation/PresentationView';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { CommandCenter } from './pages/CommandCenter';
import { LiveTraffic } from './pages/LiveTraffic';
import { QuantumOptimizer } from './pages/QuantumOptimizer';
import { EmergencyCorridor } from './pages/EmergencyCorridor';
import { DigitalTwin } from './pages/DigitalTwin';
import { Analytics } from './pages/Analytics';

function MainLayout() {
  const { state } = useApp();

  if (state.presentationMode) {
    return (
      <>
        <PresentationView />
        <IntersectionModal />
      </>
    );
  }

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 'command':
        return <DashboardPage />;
      case 'simulation':
      case 'quantum-sim':
      case 'quantum-sim-new':
        return <CommandCenter />;
      case 'live':
        return <LiveTraffic />;
      case 'quantum':
        return <QuantumOptimizer />;
      case 'emergency':
        return <EmergencyCorridor />;
      case 'digital-twin':
        return <DigitalTwin />;
      case 'analytics':
        return <Analytics />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <div className={`flex w-full max-w-full h-screen overflow-hidden bg-slate-50 text-slate-900 ${state.presentationMode ? 'presentation-mode' : ''}`}>
      {/* Navigation Sidebar */}
      {!state.presentationMode && <Sidebar />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F7F9FC]">
        <TopBar />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden w-full">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <IntersectionModal />
      <HackathonDemoModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
