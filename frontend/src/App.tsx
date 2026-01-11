import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import BeansList from './pages/BeansList';
import BeanDetail from './pages/BeanDetail';
import AddRecord from './pages/AddRecord';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/beans"
                element={
                  <PrivateRoute>
                    <BeansList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/beans/:id"
                element={
                  <PrivateRoute>
                    <BeanDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/beans/:id/add-record"
                element={
                  <PrivateRoute>
                    <AddRecord />
                  </PrivateRoute>
                }
              />
              <Route
                path="/beans/:id/edit-record/:recordId"
                element={
                  <PrivateRoute>
                    <AddRecord />
                  </PrivateRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <PrivateRoute>
                    <Search />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/beans" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
