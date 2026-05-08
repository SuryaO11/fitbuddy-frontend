import React, { useState } from 'react';
import { MessageSquare, Shield, HelpCircle, ChevronDown } from 'lucide-react';

const FeedbackWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);
  const [activeModal, setActiveModal] = useState<'feedback' | 'privacy' | 'help' | null>(null);

  const submitFeedback = async () => {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setActiveModal(null);
      setFeedback('');
    }, 2000);
  };

  const handleOptionClick = (option: 'feedback' | 'privacy' | 'help') => {
    setShowDropdown(false);
    setActiveModal(option);
  };

  const closeModal = () => {
    setActiveModal(null);
    setFeedback('');
    setSent(false);
  };

  return (
    <>
      {/* Main Button with Dropdown */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          <button
            className="bg-primary text-white rounded-full p-3 shadow-lg hover:bg-primary/90 flex items-center gap-2"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Support Options"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="hidden sm:inline">Support</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
              <div className="py-1">
                <button
                  onClick={() => handleOptionClick('feedback')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Feedback</span>
                </button>
                <button
                  onClick={() => handleOptionClick('privacy')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Privacy</span>
                </button>
                <button
                  onClick={() => handleOptionClick('help')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Help</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {activeModal === 'feedback' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl" 
              onClick={closeModal}
            >
              &times;
            </button>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Send Feedback</h3>
            </div>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Share your thoughts, suggestions, or report issues..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <button
              className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={submitFeedback}
              disabled={!feedback.trim()}
            >
              Submit Feedback
            </button>
            {sent && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-800 text-sm font-medium">Thank you for your feedback!</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl" 
              onClick={closeModal}
            >
              &times;
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Privacy Policy</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Collection</h4>
                <p>We collect only the information necessary to provide you with the best fitness tracking experience. This includes your workout data, progress metrics, and basic profile information.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Usage</h4>
                <p>Your data is used to personalize your workout recommendations, track your progress, and improve our services. We never sell or share your personal information with third parties.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Security</h4>
                <p>We implement industry-standard security measures to protect your data. All information is encrypted and stored securely.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Your Rights</h4>
                <p>You have the right to access, modify, or delete your data at any time. Contact us if you have any privacy concerns.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl" 
              onClick={closeModal}
            >
              &times;
            </button>
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Help & Support</h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Getting Started</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>1.</strong> Create your account and complete the onboarding process</p>
                  <p><strong>2.</strong> Set up your fitness goals and preferences</p>
                  <p><strong>3.</strong> Start tracking your workouts using the workout tracker</p>
                  <p><strong>4.</strong> Use the form check feature to analyze your exercise form</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Workout Tracker:</strong> Log your exercises, sets, and reps</p>
                  <p><strong>Form Check:</strong> Record videos to analyze your exercise form</p>
                  <p><strong>Progress Charts:</strong> View your fitness progress over time</p>
                  <p><strong>AI Recommendations:</strong> Get personalized workout suggestions</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Need More Help?</h4>
                <p className="text-sm text-gray-700">If you need additional assistance, please use the feedback form to contact our support team. We typically respond within 24 hours.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  );
};

export default FeedbackWidget; 