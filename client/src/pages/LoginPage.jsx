// client/src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      login(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed', err);
      alert('Invalid Credentials');
    }
  };
  
  // Return the same JSX form from Day 1, but add onChange and onSubmit handlers
  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-dark">
      <div className="w-full max-w-md p-8 space-y-8 bg-brand-mid rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-brand-text">ConvoSphere AI</h2>
          <p className="mt-2 text-center text-brand-text-muted">Login to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} id="email-address" name="email" type="email" required className="relative block w-full px-3 py-2 text-white bg-brand-light border border-transparent rounded-md placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} id="password" name="password" type="password" required className="relative block w-full px-3 py-2 text-white bg-brand-light border border-transparent rounded-md placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Password" />
            </div>
          </div>
          <div>
            <button type="submit" className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md group hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;