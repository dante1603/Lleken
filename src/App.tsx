import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const PlantsList = lazy(() => import('./pages/PlantsList'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Camera = lazy(() => import('./pages/Camera'));
const IdentifyPlant = lazy(() => import('./pages/IdentifyPlant'));
const LocationInput = lazy(() => import('./pages/LocationInput'));
const GeneratingProfile = lazy(() => import('./pages/GeneratingProfile'));
const PlantProfile = lazy(() => import('./pages/PlantProfile'));
const RefreshPlantPreview = lazy(() => import('./pages/RefreshPlantPreview'));
const FollowUpCamera = lazy(() => import('./pages/FollowUpCamera'));
const FollowUpIdentify = lazy(() => import('./pages/FollowUpIdentify'));
const Profile = lazy(() => import('./pages/Profile'));

const LoadingFallback = () => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-white">
    <div className="flex flex-col items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-100 border-t-[#2e5c3a]" />
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/plants" element={<PrivateRoute><PlantsList /></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
            <Route path="/nueva-planta" element={<PrivateRoute><Camera /></PrivateRoute>} />
            <Route path="/nueva-planta/identificando" element={<PrivateRoute><IdentifyPlant /></PrivateRoute>} />
            <Route path="/nueva-planta/ubicacion" element={<PrivateRoute><LocationInput /></PrivateRoute>} />
            <Route path="/nueva-planta/generando" element={<PrivateRoute><GeneratingProfile /></PrivateRoute>} />
            <Route path="/planta/:id" element={<PrivateRoute><PlantProfile /></PrivateRoute>} />
            <Route path="/planta/:id/actualizar-desde-foto" element={<PrivateRoute><RefreshPlantPreview /></PrivateRoute>} />
            <Route path="/planta/:id/seguimiento" element={<PrivateRoute><FollowUpCamera /></PrivateRoute>} />
            <Route path="/planta/:id/seguimiento/analizando" element={<PrivateRoute><FollowUpIdentify /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}
