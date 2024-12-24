import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import AttendanceDashboard from './components/AttendanceDashboard';
import Navbar from './components/Navbar';
import PopulationDashboard from './components/dashboard';

const App = () => {
  return (
    <Router basename="/bps-sanggau-kehadiran" >
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<AttendanceDashboard />} />
          <Route path="/strategis" element={<PopulationDashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;