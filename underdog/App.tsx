import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store';
import { Onboarding } from './src/screens/Onboarding';
import { Feed } from './src/screens/Feed';
import { Settings } from './src/screens/Settings';

function Router() {
  const { screen, onboardingDone } = useApp();
  if (!onboardingDone) return <Onboarding />;
  if (screen === 'settings') return <Settings />;
  return <Feed />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <Router />
      </AppProvider>
    </SafeAreaProvider>
  );
}
