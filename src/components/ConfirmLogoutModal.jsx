// ConfirmLogoutModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';

const ConfirmLogoutModal = ({ onConfirm, onCancel }) => {
  return ReactDOM.createPortal(
    <>
      {/* Background blur overlay */}
      <div
        className="fixed inset-0 backdrop-blur-sm z-40"
        onClick={onCancel}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96 transform transition-all animate-fade-in-down">
          <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to log out? You will need to sign in again to access your account.
          </p>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded transition"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body // Render the modal directly in the <body> tag
  );
};

export default ConfirmLogoutModal;