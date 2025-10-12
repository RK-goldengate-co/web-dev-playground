import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data from API
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1);
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>

        <Switch>
          <Route path="/" exact>
            <Home count={count} onIncrement={handleIncrement} data={data} />
          </Route>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/contact">
            <Contact />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function Home({ count, onIncrement, data }) {
  return (
    <main className="home">
      <h1>React JSX Application</h1>

      <div className="counter">
        <h2>Counter: {count}</h2>
        <button onClick={onIncrement} className="btn btn-primary">
          Increment
        </button>
      </div>

      <div className="data-section">
        <h2>Data from API:</h2>
        {data.length > 0 ? (
          <ul className="data-list">
            {data.map((item, index) => (
              <li key={index} className="data-item">
                {item.name}: {item.value}
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading data...</p>
        )}
      </div>
    </main>
  );
}

function About() {
  return (
    <div className="about">
      <h1>About Page</h1>
      <p>This is a React application built with JSX and modern JavaScript.</p>

      <div className="features">
        <div className="feature">
          <h3>Component-Based</h3>
          <p>Built using reusable React components</p>
        </div>
        <div className="feature">
          <h3>Responsive Design</h3>
          <p>Works perfectly on all devices</p>
        </div>
        <div className="feature">
          <h3>Modern JavaScript</h3>
          <p>Using ES6+ features and hooks</p>
        </div>
      </div>
    </div>
  );
}

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <div className="contact">
      <h1>Contact Us</h1>

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="5"
            className="form-textarea"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Send Message
        </button>
      </form>
    </div>
  );
}

export default App;
