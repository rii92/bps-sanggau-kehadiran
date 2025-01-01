import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import AttendanceDashboard from './components/AttendanceDashboard';

const App = () => {
  return (
    <Router basename="/bps-sanggau-kehadiran" >
      <div>
        <Routes>
          <Route path="/" element={<AttendanceDashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;