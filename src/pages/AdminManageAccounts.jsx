import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminDashboard/AdminLayout";
import { FiEdit, FiTrash2 } from "react-icons/fi";
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

const AdminManageAccount = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStatusId, setEditingStatusId] = useState(null);

  // Fetch first batch of users
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

  const handleEdit = (user) => {
    alert(`Edit user: ${user.name}`);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await deleteDoc(
          doc(
            db,
            user.userType === "Teacher" ? "teachers" : "students",
            user.id
          )
        );
        setUsers(users.filter((u) => u.id !== user.id));
        alert(`Deleted user: ${user.name}`);
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user.");
      }
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      await updateDoc(doc(db, "teachers", user.id), { status: newStatus });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
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
                      {user.displayId ? user.displayId : user.id}
                    </td>
                    <td className="px-3 py-3 text-gray-900 flex items-center">
                      {/* Avatar fallback */}
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
                    {/* Status column */}
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
                            autoFocus
                            style={{ position: 'relative', zIndex: 10 }}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status} className="text-gray-900 bg-white">
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
                        title="Edit"
                        onClick={() => handleEdit(user)}
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
    </AdminLayout>
  );
};

export default AdminManageAccount;