import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/home.jsx';
import Celebration from './pages/celebration.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/celebration" 
        element={
          <Celebration 
            friendImageFilename="friend.JPG"
            friendName="Tushar Mahapure"
            personalMessage="Wishing you the happiest birthday filled with joy, laughter, and wonderful memories!"
            birthdaySongFilename="happy-birthday-155461.mp3"
          />
        } 
      />
    </Routes>
  );
}
