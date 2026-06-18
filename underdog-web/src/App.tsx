import { AppProvider, useApp } from './store';
import { Onboarding } from './components/Onboarding';
import { Feed } from './components/Feed';
import { Settings } from './components/Settings';
import './App.css';

function Router() {
  const { screen, onboardingDone } = useApp();
  if (!onboardingDone) return <Onboarding />;
  if (screen === 'settings') return <Settings />;
  return <Feed />;
}

export default function App() {
  return (
    <div className="app">
      <AppProvider>
        <Router />
      </AppProvider>
    </div>
  );
}
