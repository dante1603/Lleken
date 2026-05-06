import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PlantDataProvider } from './contexts/PlantDataContext';
import PrivateRoute from './components/PrivateRoute';

const loadLogin = () => import('./pages/Login');
const loadHome = () => import('./pages/Home');
const loadPlantsList = () => import('./pages/PlantsList');
const loadCalendar = () => import('./pages/Calendar');
const loadCamera = () => import('./pages/Camera');
const loadIdentifyPlant = () => import('./pages/IdentifyPlant');
const loadLocationInput = () => import('./pages/LocationInput');
const loadGeneratingProfile = () => import('./pages/GeneratingProfile');
const loadPlantProfile = () => import('./pages/PlantProfile');
const loadSpeciesEncyclopedia = () => import('./pages/SpeciesEncyclopedia');
const loadSpeciesMonitor = () => import('./pages/SpeciesMonitor');
const loadRefreshPlantPreview = () => import('./pages/RefreshPlantPreview');
const loadFollowUpCamera = () => import('./pages/FollowUpCamera');
const loadFollowUpIdentify = () => import('./pages/FollowUpIdentify');
const loadProfile = () => import('./pages/Profile');

const Login = lazy(loadLogin);
const Home = lazy(loadHome);
const PlantsList = lazy(loadPlantsList);
const Calendar = lazy(loadCalendar);
const Camera = lazy(loadCamera);
const IdentifyPlant = lazy(loadIdentifyPlant);
const LocationInput = lazy(loadLocationInput);
const GeneratingProfile = lazy(loadGeneratingProfile);
const PlantProfile = lazy(loadPlantProfile);
const SpeciesEncyclopedia = lazy(loadSpeciesEncyclopedia);
const SpeciesMonitor = lazy(loadSpeciesMonitor);
const RefreshPlantPreview = lazy(loadRefreshPlantPreview);
const FollowUpCamera = lazy(loadFollowUpCamera);
const FollowUpIdentify = lazy(loadFollowUpIdentify);
const Profile = lazy(loadProfile);

const LoadingFallback = () => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-white">
    <div className="flex flex-col items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-100 border-t-[#2e5c3a]" />
    </div>
  </div>
);

export default function App() {
  useEffect(() => {
    const preloadRoutes = () => {
      void Promise.all([
        loadHome(),
        loadPlantsList(),
        loadCalendar(),
        loadPlantProfile(),
        loadSpeciesEncyclopedia(),
        loadSpeciesMonitor(),
        loadProfile(),
        loadCamera(),
      ]);
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadRoutes, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(preloadRoutes, 700);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <PlantDataProvider>
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
              <Route path="/especie/:speciesKey" element={<PrivateRoute><SpeciesEncyclopedia /></PrivateRoute>} />
              <Route path="/dev/especies" element={<PrivateRoute><SpeciesMonitor /></PrivateRoute>} />
              <Route path="/planta/:id/actualizar-desde-foto" element={<PrivateRoute><RefreshPlantPreview /></PrivateRoute>} />
              <Route path="/planta/:id/seguimiento" element={<PrivateRoute><FollowUpCamera /></PrivateRoute>} />
              <Route path="/planta/:id/seguimiento/analizando" element={<PrivateRoute><FollowUpIdentify /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </PlantDataProvider>
      </AuthProvider>
    </Router>
  );
}
