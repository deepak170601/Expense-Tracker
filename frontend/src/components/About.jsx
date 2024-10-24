import React from 'react';
import './styles/About.css';
const About = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">About Expense Tracker</h1>
      
      <p>
        Expense Tracker is a simple web application that helps you keep track of your expenses. 
        It allows you to add, edit, and delete expenses, providing a clear overview of your spending habits.
      </p>
      
      <h2 className="about-subtitle">Features</h2>
      <ul className="about-list">
        <li><b>User-Friendly Interface</b>: Easy navigation with a clean and intuitive design.</li>
        <li><b>Expense Management</b>: Effortlessly add, edit, and delete expenses as needed.</li>
        <li><b>Categorization</b>: Organize expenses into categories like Food, Transport, Entertainment, and more.</li>
        <li><b>Payment Mode Tracking</b>: Keep track of how you paid (Cash, Debit Card, Credit Card).</li>
        <li><b>Overview of Spending</b>: Visualize your spending habits to identify areas for improvement.</li>
      </ul>

      <h2 className="about-subtitle">Benefits</h2>
      <p>Using Expense Tracker can help you:</p>
      <ul className="about-list">
        <li><b>Gain Insight</b>: Understand where your money goes and how to budget more effectively.</li>
        <li><b>Set Goals</b>: Create spending goals and monitor your progress over time.</li>
        <li><b>Reduce Stress</b>: Keep your finances organized and make informed decisions.</li>
      </ul>
      
      <h2 className="about-subtitle">Why Track Expenses?</h2>
      <p>
        Keeping track of your expenses is a vital step towards achieving financial stability. 
        By monitoring your spending habits, you can make more informed decisions, prioritize your needs, and work towards saving for your future. 
        Whether you're planning for a vacation, saving for a major purchase, or simply trying to live within your means, Expense Tracker is here to assist you on your journey.
      </p>

      <h2 className="about-subtitle">Get Started!</h2>
      <p>
        Feel free to explore the different features of Expense Tracker and start taking control of your expenses today! 
        Remember, every small step counts towards a healthier financial future. 
        Happy tracking!
      </p>
      
      <h2 className="about-subtitle">Contact Us</h2>
      <p className="about-contact">
        If you have any questions or feedback, we’d love to hear from you! 
        Please reach out to us at <a href="mailto:deepakchekurthi@gmail.com">support@expensetracker.com</a>.
      </p>
    </div>
  );
};

export default About;
