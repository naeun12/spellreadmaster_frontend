import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminDashboard/AdminLayout";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { db } from "../firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const STATUS_OPTIONS = ["Approved", "Pending", "Unverified"];

const AdminManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [retrieveModal, setRetrieveModal] = useState(null); // Renamed from editModal
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const teacherQuery = query(
        collection(db, "teachers"),
        orderBy("createdAt", "desc")
      );
      const studentQuery = query(
        collection(db, "students"),
        orderBy("createdAt", "desc")
      );

      const [teacherSnap, studentSnap] = await Promise.all([
        getDocs(teacherQuery),
        getDocs(studentQuery),
      ]);

      const teachers = teacherSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        userType: "Teacher",
        name: doc.data().fullName || doc.data().name || "No Name",
        email: doc.data().email,
        password: doc.data().password || "", // assuming stored in Firestore
        date: doc.data().createdAt
          ? new Date(
              doc.data().createdAt.seconds
                ? doc.data().createdAt.seconds * 1000
                : doc.data().createdAt
            )
          : null,
        displayId: doc.data().teacherId || doc.id,
      }));

      const students = studentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        userType: "Student",
        name: doc.data().name || doc.data().fullName || "No Name",
        email: doc.data().email || doc.data().parentEmail,
        password: doc.data().password || "", // assuming stored in Firestore
        date: doc.data().createdAt
          ? new Date(
              doc.data().createdAt.seconds
                ? doc.data().createdAt.seconds * 1000
                : doc.data().createdAt
            )
          : null,
        displayId: doc.data().studentId || doc.id,
      }));

      setUsers([...teachers, ...students]);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Open "Retrieve" modal with current user data
  const handleRetrieve = (user) => {
    setRetrieveModal({
      ...user,
      // Normalize fields to ensure consistency
      name: user.name || "",
      email: user.email || "",
      password: user.password || "",
      status: user.status || "Unverified",
    });
  };

  // Save changes to Firestore
  const saveRetrieve = async () => {
    if (!retrieveModal) return;

    const { id, userType, name, email, password, status } = retrieveModal;
    const collectionName = userType === "Teacher" ? "teachers" : "students";

    try {
      // Build update object (only include fields that exist in your schema)
      const updateData = {
        // For teachers: may use 'fullName'; for students: 'name'
        ...(userType === "Teacher" 
          ? { fullName: name } 
          : { name: name }),
        email: email,
        password: password, // ⚠️ Only if you store passwords in Firestore!
        status: status,
      };

      // Special case: if student uses parentEmail, keep original logic
      if (userType === "Student") {
        updateData.parentEmail = email; // if your student schema uses parentEmail
      }

      await updateDoc(doc(db, collectionName, id), updateData);

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                name,
                email,
                password,
                status,
                ...(userType === "Teacher" ? { fullName: name } : {}),
              }
            : u
        )
      );

      setRetrieveModal(null);
      alert("User updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user. Check console for details.");
    }
  };

  const handleDelete = (user) => {
    setDeleteModal(user);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      const collectionName = deleteModal.userType === "Teacher" ? "teachers" : "students";
      await deleteDoc(doc(db, collectionName, deleteModal.id));
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.id));
      setDeleteModal(null);
      alert("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      await updateDoc(doc(db, "teachers", user.id), { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      setEditingStatusId(null);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4 text-black">Manage Accounts</h1>
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-32 px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="w-48 px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="w-52 px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="w-28 px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Joined
                </th>
                <th className="w-24 px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="w-28 px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-24 px-3 py-3 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 text-sm">
                    <td className="px-3 py-3 font-semibold text-gray-900 truncate">
                      {user.displayId || user.id}
                    </td>
                    <td className="px-3 py-3 text-gray-900 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold mr-2 flex-shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <span className="truncate">{user.name}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 truncate">
                      {user.email}
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-xs">
                      {user.date
                        ? new Date(user.date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          user.userType === "Teacher"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.userType}
                      </span>
                    </td>
                    <td className="px-3 py-3 relative">
                      {user.userType === "Teacher" ? (
                        editingStatusId === user.id ? (
                          <select
                            className="px-2 py-1 border border-gray-300 rounded text-xs w-full bg-white text-gray-900"
                            value={user.status || "Unverified"}
                            onChange={(e) =>
                              handleStatusChange(user, e.target.value)
                            }
                            onBlur={() => setEditingStatusId(null)}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full focus:outline-none w-full justify-center ${
                              user.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : user.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                            onClick={() => setEditingStatusId(user.id)}
                            title="Click to change status"
                            type="button"
                          >
                            {user.status || "Unverified"}
                          </button>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Retrieve"
                        onClick={() => handleRetrieve(user)}
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                        onClick={() => handleDelete(user)}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retrieve Modal */}
      {retrieveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Retrieve</h2>
              <button
                onClick={() => setRetrieveModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={retrieveModal.name}
                  onChange={(e) =>
                    setRetrieveModal({ ...retrieveModal, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={retrieveModal.email}
                  onChange={(e) =>
                    setRetrieveModal({ ...retrieveModal, email: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={retrieveModal.password}
                  onChange={(e) =>
                    setRetrieveModal({ ...retrieveModal, password: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded text-black"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              {retrieveModal.userType === "Teacher" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={retrieveModal.status}
                    onChange={(e) =>
                      setRetrieveModal({ ...retrieveModal, status: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setRetrieveModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRetrieve}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteModal.name}</span>? This
                action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminManageAccounts;