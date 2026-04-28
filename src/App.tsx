import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import PlantsList from './pages/PlantsList';
import Calendar from './pages/Calendar';
import Camera from './pages/Camera';
import IdentifyPlant from './pages/IdentifyPlant';
import LocationInput from './pages/LocationInput';
import GeneratingProfile from './pages/GeneratingProfile';
import PlantProfile from './pages/PlantProfile';
import FollowUpCamera from './pages/FollowUpCamera';
import FollowUpIdentify from './pages/FollowUpIdentify';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Router>
      <AuthProvider>
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
          <Route path="/planta/:id/seguimiento" element={<PrivateRoute><FollowUpCamera /></PrivateRoute>} />
          <Route path="/planta/:id/seguimiento/analizando" element={<PrivateRoute><FollowUpIdentify /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
