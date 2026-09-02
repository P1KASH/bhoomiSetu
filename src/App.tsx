import { RouterProvider, useRouter } from './router';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ExtractionScreen } from './screens/ExtractionScreen';
import { ValidationEngineScreen } from './screens/ValidationEngineScreen';
import { ExplainableScreen } from './screens/ExplainableScreen';
import { MapScreen } from './screens/MapScreen';
import { RecordDetailScreen } from './screens/RecordDetailScreen';
import { AuditScreen } from './screens/AuditScreen';

function CurrentScreen() {
  const { route } = useRouter();
  switch (route.name) {
    case 'login':
      return <LoginScreen />;
    case 'dashboard':
      return <DashboardScreen />;
    case 'upload':
      return <UploadScreen />;
    case 'extraction':
      return <ExtractionScreen />;
    case 'validation':
      return <ValidationEngineScreen />;
    case 'explainable':
      return <ExplainableScreen />;
    case 'map':
      return <MapScreen />;
    case 'record':
      return <RecordDetailScreen recordId={route.recordId} tab={route.tab} />;
    case 'audit':
      return <AuditScreen recordId={route.recordId} />;
    default:
      return <DashboardScreen />;
  }
}

export default function App() {
  return (
    <RouterProvider>
      <CurrentScreen />
    </RouterProvider>
  );
}
