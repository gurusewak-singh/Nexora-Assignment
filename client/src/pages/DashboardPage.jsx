// // client/src/pages/DashboardPage.jsx
// import React from 'react';

// // Dummy data for now
// const upcomingSessions = [
//   { id: 1, title: 'Q3 Project Kickoff', date: '2024-07-25T10:00:00' },
//   { id: 2, title: 'Marketing Sync', date: '2024-07-26T14:30:00' },
// ];
// const pastSessions = [
//   { id: 3, title: 'UI/UX Design Review', date: '2024-07-22T11:00:00' },
// ];

// const DashboardPage = () => {
//   return (
//     <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-brand-dark">
//       <header className="flex items-center justify-between mb-8">
//         <h1 className="text-3xl font-bold text-brand-text">Dashboard</h1>
//         <button className="px-4 py-2 font-semibold text-white transition-colors duration-200 bg-brand-primary rounded-md hover:bg-opacity-90">
//           + Schedule New Session
//         </button>
//       </header>
      
//       <main className="grid grid-cols-1 gap-8 lg:grid-cols-2">
//         {/* Upcoming Sessions */}
//         <section>
//           <h2 className="mb-4 text-2xl font-semibold text-brand-text">Upcoming Sessions</h2>
//           <div className="space-y-4">
//             {upcomingSessions.map(session => (
//               <div key={session.id} className="flex items-center justify-between p-4 bg-brand-mid rounded-lg shadow">
//                 <div>
//                   <h3 className="font-semibold text-brand-text">{session.title}</h3>
//                   <p className="text-sm text-brand-text-muted">{new Date(session.date).toLocaleString()}</p>
//                 </div>
//                 <button className="px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 border border-brand-primary text-brand-primary rounded-md hover:bg-brand-primary hover:text-brand-dark">
//                   Join
//                 </button>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* Past Sessions */}
//         <section>
//           <h2 className="mb-4 text-2xl font-semibold text-brand-text">Past Sessions</h2>
//           <div className="space-y-4">
//             {pastSessions.map(session => (
//               <div key={session.id} className="flex items-center justify-between p-4 bg-brand-mid rounded-lg shadow">
//                 <div>
//                   <h3 className="font-semibold text-brand-text">{session.title}</h3>
//                   <p className="text-sm text-brand-text-muted">{new Date(session.date).toLocaleString()}</p>
//                 </div>
//                 <button className="px-4 py-2 text-sm font-semibold transition-colors duration-200 bg-brand-light text-brand-text-muted rounded-md hover:bg-brand-light/70">
//                   View Analysis
//                 </button>
//               </div>
//             ))}
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// };

// export default DashboardPage;

// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const [sessions, setSessions] = useState([]);
    const [title, setTitle] = useState('');
    const { token, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSessions = async () => {
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get('http://localhost:5001/api/sessions', config);
            setSessions(res.data);
        };
        if (token) fetchSessions();
    }, [token]);

    const handleSchedule = async (e) => {
        e.preventDefault();
        const config = { headers: { 'x-auth-token': token, 'Content-Type': 'application/json' } };
        const body = { title, scheduledFor: new Date() }; // For simplicity, schedule for now
        const res = await axios.post('http://localhost:5001/api/sessions', body, config);
        setSessions([res.data, ...sessions]);
        setTitle('');
    };

    const upcomingSessions = sessions.filter(s => s.status === 'Scheduled');
    const pastSessions = sessions.filter(s => s.status !== 'Scheduled');

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-brand-dark">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-brand-text">Dashboard</h1>
                <button onClick={logout} className="text-brand-text-muted hover:text-brand-primary">Logout</button>
            </header>

            <form onSubmit={handleSchedule} className="flex gap-4 mb-8">
                <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    placeholder="New Session Title"
                    className="flex-grow px-3 py-2 text-white bg-brand-light border border-transparent rounded-md placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button type="submit" className="px-4 py-2 font-semibold text-white transition-colors duration-200 bg-brand-primary rounded-md hover:bg-opacity-90">
                    + Schedule Now
                </button>
            </form>
            
            <main className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <section>
                    <h2 className="mb-4 text-2xl font-semibold text-brand-text">Upcoming Sessions</h2>
                    <div className="space-y-4">
                        {upcomingSessions.map(session => (
                            <div key={session._id} className="flex items-center justify-between p-4 bg-brand-mid rounded-lg shadow">
                                <div>
                                    <h3 className="font-semibold text-brand-text">{session.title}</h3>
                                    <p className="text-sm text-brand-text-muted">{new Date(session.scheduledFor).toLocaleString()}</p>
                                </div>
                                <button onClick={() => navigate(`/session/${session._id}`)} className="px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 border border-brand-primary text-brand-primary rounded-md hover:bg-brand-primary hover:text-brand-dark">
                                    Join
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                          <h2 className="mb-4 text-2xl font-semibold text-brand-text">Past Sessions</h2>
                          <div className="space-y-4">
                            {pastSessions.map(session => (
                              <div key={session.id} className="flex items-center justify-between p-4 bg-brand-mid rounded-lg shadow">
                                <div>
                                  <h3 className="font-semibold text-brand-text">{session.title}</h3>
                                  <p className="text-sm text-brand-text-muted">{new Date(session.date).toLocaleString()}</p>
                                </div>
                                <button className="px-4 py-2 text-sm font-semibold transition-colors duration-200 bg-brand-light text-brand-text-muted rounded-md hover:bg-brand-light/70">
                                  View Analysis
                                </button>
                              </div>
            ))}
          </div>
        </section>
                
            </main>
        </div>
    );
};

export default DashboardPage;