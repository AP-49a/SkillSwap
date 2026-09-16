import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Bookings from './pages/Bookings.jsx';
import Credits from './pages/Credits.jsx';
import Messages from './pages/Messages.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import Achievements from './pages/Achievements.jsx';
import UserProfile from './pages/UserProfile.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import CourseDetails from './pages/CourseDetails.jsx';
import MyCourses from './pages/MyCourses.jsx';
import CoursePlayer from './pages/CoursePlayer.jsx';
import TeacherStudio, { TeacherCourseCreate, TeacherCourseEdit } from './pages/TeacherStudio.jsx';
import About from './pages/static/About.jsx';
import Contact from './pages/static/Contact.jsx';
import FAQ from './pages/static/FAQ.jsx';
import PrivacyPolicy from './pages/static/Privacy.jsx';
import Terms from './pages/static/Terms.jsx';
import NotFound from './pages/static/NotFound.jsx';

const AppLayout = () => (
  <>
    <Navbar />
    <main className="container">
      <Outlet />
    </main>
    <Footer />
  </>
);

const PublicLayout = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
      <Route path="/about" element={<><Navbar /><main className="container"><About /></main><Footer /></>} />
      <Route path="/contact" element={<><Navbar /><main className="container"><Contact /></main><Footer /></>} />
      <Route path="/faq" element={<><Navbar /><main className="container"><FAQ /></main><Footer /></>} />
      <Route path="/privacy" element={<><Navbar /><main className="container"><PrivacyPolicy /></main><Footer /></>} />
      <Route path="/terms" element={<><Navbar /><main className="container"><Terms /></main><Footer /></>} />
      <Route path="/courses/:id" element={<><Navbar /><main className="container"><CourseDetails /></main><Footer /></>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Home />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/courses/:id/learn" element={<CoursePlayer />} />
        <Route path="/teacher/studio" element={<TeacherStudio />} />
        <Route path="/teacher/studio/courses/new" element={<TeacherCourseCreate />} />
        <Route path="/teacher/studio/courses/:id/edit" element={<TeacherCourseEdit />} />
        <Route path="/profile" element={<ProfileSetup />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/skills" element={<Search />} />
        <Route path="/search" element={<Search />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/wallet" element={<Credits />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/u/:username" element={<UserProfile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;