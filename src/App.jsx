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
            friendImageFilename="912A6071.JPG"
            friendName="Birthday Person"
            personalMessage="Wishing you the happiest birthday filled with joy, laughter, and wonderful memories!"
            birthdaySongFilename="birthday_song.mp3"
          />
        } 
      />
    </Routes>
  );
}
