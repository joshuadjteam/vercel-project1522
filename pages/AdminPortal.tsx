import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { database } from '../services/database';
import AddUserModal from '../components/AddUserModal';
import { useAuth } from '../hooks/useAuth';

const AdminPortal: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [stats, setStats] = useState({ messages: 0, mails: 0, contacts: 0 });

    const fetchUsers = useCallback(async () => {
        const userList = await database.getUsers();
        setUsers(userList);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            const adminStats = await database.getAdminStats();
            if (adminStats) {
                setStats(adminStats);
            }
        };

        if (user?.auth_id) {
            fetchStats();
            fetchUsers();
        }
    }, [fetchUsers, user]);

    const handleAddUser = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };
    
    const handleDeleteUser = async (user: User) => {
        if(window.confirm(`Are you sure you want to delete this user: ${user.username}? This action is irreversible.`)) {
            const { error } = await database.deleteUser(user);
            if (error) {
                alert(`Failed to delete user: ${error}`);
            } else {
                fetchUsers();
            }
        }
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        fetchUsers();
    };

    const StatCard: React.FC<{ title: string, value: string | number }> = ({ title, value }) => (
        <div className="bg-gray-100 dark:bg-teal-700/50 p-4 rounded-lg">
            <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{title}</p>
                <p className="text-3xl font-bold">{value}</p>
            </div>
        </div>
    );
    
    const FeatureIndicator: React.FC<{ enabled: boolean }> = ({ enabled }) => (
         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${enabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>
            {enabled ? 'On' : 'Off'}
        </span>
    );

    // Disable portal for local admin as they don't have a Supabase session
    if (user && !user.auth_id) {
        return (
             <div className="w-full max-w-4xl bg-light-card/80 dark:bg-red-900/50 backdrop-blur-sm border border-gray-300 dark:border-red-700/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white">
                <h1 className="text-3xl font-bold text-center mb-4">User Management Disabled</h1>
                <p className="text-center text-red-200">
                    You are logged in as a local administrator. This account does not have the necessary permissions to manage users because it is not authenticated with the backend service.
                </p>
                <p className="text-center mt-2 text-gray-300">
                    Please sign out and use an account created via the 'Add User' feature to access the admin portal.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl bg-light-card/80 dark:bg-teal-900/50 backdrop-blur-sm border border-gray-300 dark:border-teal-700/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white">
            <h1 className="text-4xl font-bold">Admin Portal</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">System overview and user management.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Users" value={users.length} />
                <StatCard title="Chat Messages" value={stats.messages} />
                <StatCard title="Local Mails" value={stats.mails} />
                <StatCard title="Saved Contacts" value={stats.contacts} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-black/5 dark:bg-black/20 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold mb-4">System Broadcast</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Send a direct message to all users.</p>
                    <textarea 
                        placeholder="Type your message here..."
                        className="w-full h-32 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    ></textarea>
                    <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Broadcast
                    </button>
                </div>
                <div className="lg:col-span-2 bg-black/5 dark:bg-black/20 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">User Management</h2>
                        <button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Add User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-300 dark:border-slate-600">
                                <tr>
                                    <th className="p-2">Username</th>
                                    <th className="p-2">Role</th>
                                    <th className="p-2 text-center">Chat</th>
                                    <th className="p-2 text-center">AI</th>
                                    <th className="p-2 text-center">Mail</th>
                                    <th className="p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-100/50 dark:hover:bg-slate-800/50">
                                        <td className="p-2 font-medium">{user.username}</td>
                                        <td className="p-2">{user.role}</td>
                                        <td className="p-2 text-center"><FeatureIndicator enabled={user.features.chat} /></td>
                                        <td className="p-2 text-center"><FeatureIndicator enabled={user.features.ai} /></td>
                                        <td className="p-2 text-center"><FeatureIndicator enabled={user.features.mail} /></td>
                                        <td className="p-2">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleEditUser(user)} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white">Edit</button>
                                                <button onClick={() => handleDeleteUser(user)} className="px-3 py-1 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <AddUserModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSaveSuccess={handleSaveSuccess} 
                    userToEdit={userToEdit} 
                />
            )}
        </div>
    );
};

export default AdminPortal;