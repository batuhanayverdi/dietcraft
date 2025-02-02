import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/nav/Nav';
import Footer from './components/footer/Foot';
import Card from './components/card/Card';
import Signup from '../Signup';
import DietPlan from './components/DietPlan';
import AboutSlider from './components/AboutSlider';
import Login from '../Login';
import { UserProvider } from '../UserContext';

const App = () => {
  return (
    <UserProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <Routes>
            {/* Home page */}
            <Route path="/home" element={<Card />} />
            {/* Signup Page */}
            <Route
              path="/signup"
              element={
                <div>
                  <h2>Sign Up</h2>
                  {/*
                    Signup logic and structure is defined in the `Signup` component.
                    It will handle the form submission, validation, and navigation.
                  */}
                  <Signup />
                </div>
              }
            />
            {/* Login Page */}
            <Route path="/login" element={<Login />} />
            {/* Diet Plan */}
            <Route path="/diet-plan" element={<DietPlan />} />
            {/* About Slider */}
            <Route path="/about" element={<AboutSlider />} />
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </UserProvider>
  );
};

export default App;