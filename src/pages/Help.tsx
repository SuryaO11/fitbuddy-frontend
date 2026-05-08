import React from 'react';

const faqs = [
  {
    q: 'How do I log a workout?',
    a: 'Go to the workout tracker, enter your sets, reps, and weight, then save your workout.'
  },
  {
    q: 'How do I join a challenge?',
    a: 'Visit the Challenges page and click Join on any available challenge.'
  },
  {
    q: 'How do I export my data?',
    a: 'Go to Privacy settings and click Export My Data.'
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Privacy settings and click Request Account Deletion.'
  },
  {
    q: 'Who can see my workouts?',
    a: 'Only you and your approved friends/coaches can see your detailed workouts. You can opt out of leaderboards in Privacy settings.'
  },
  {
    q: 'I found a bug or need help!',
    a: 'Contact support via the Help page or email support@fitbuddy.com.'
  },
];

const Help: React.FC = () => (
  <div className="p-2 sm:p-8 max-w-2xl mx-auto">
    <h2 className="text-xl sm:text-2xl font-bold mb-4">Help & FAQ</h2>
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <div key={i} className="p-4 rounded border bg-muted">
          <div className="font-bold text-base sm:text-lg mb-1">Q: {faq.q}</div>
          <div className="text-xs sm:text-base text-muted-foreground">A: {faq.a}</div>
        </div>
      ))}
    </div>
    <p className="mt-4 text-xs text-muted-foreground">For more help, contact support@fitbuddy.com</p>
  </div>
);

export default Help; 