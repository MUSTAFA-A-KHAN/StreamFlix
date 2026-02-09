import { useState } from 'react';

const AgeGate = ({ onVerified }) => {
  const [showDenial, setShowDenial] = useState(false);

  const handleYes = () => {
    localStorage.setItem('ageVerified', 'true');
    onVerified();
  };

  const handleNo = () => {
    setShowDenial(true);
  };

  if (showDenial) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md mx-4">
          <h1 className="text-4xl font-bold text-red-500 mb-4">18+</h1>
          <p className="text-white text-lg mb-6">
            Sorry, you must be 18 or older to access this content.
          </p>
          <button
            onClick={() => setShowDenial(false)}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md mx-4">
        <h1 className="text-6xl font-bold text-red-500 mb-6">18+</h1>
        <p className="text-white text-xl mb-8">
          Are you above 18 years old?
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleYes}
            className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={handleNo}
            className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeGate;
