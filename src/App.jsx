import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import AttendanceDashboard from './components/AttendanceDashboard';
import Navbar from './components/Navbar';

const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<AttendanceDashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;