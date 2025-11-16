import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { database } from '../services/database';
import AddUserModal from '../components/AddUserModal';
import AppContainer from '../components/AppContainer';

const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const AdminPortal: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [stats, setStats] = useState({ messages: 0, mails: 0, contacts: 0 });


    const fetchUsers = useCallback(async () => {
        const userList = await database.getUsers();
        setUsers(userList);
    }, []);

    const fetchStats = useCallback(async () => {
        const adminStats = await database.getAdminStats();
        setStats(adminStats);
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, [fetchUsers, fetchStats]);

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

    return (
        <AppContainer className="w-full max-w-7xl h-[85vh] p-8 text-light-text dark:text-white flex flex-col overflow-y-auto">
            <div className='flex-shrink-0'>
                <h1 className="text-4xl font-bold">Admin Portal</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">System overview and user management.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 flex-shrink-0">
                <StatCard title="Total Users" value={users.length} />
                <StatCard title="Chat Messages" value={stats.messages} />
                <StatCard title="Local Mails" value={stats.mails} />
                <StatCard title="Saved Contacts" value={stats.contacts} />
            </div>

            <div className="bg-black/5 dark:bg-black/20 p-6 rounded-lg flex-grow flex flex-col overflow-hidden mb-8">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-semibold">User Management</h2>
                    <button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2">
                        <UserPlusIcon />
                        <span>Add User</span>
                    </button>
                </div>
                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-300 dark:border-slate-600">
                            <tr>
                                <th className="p-2">Username</th>
                                <th className="p-2">Email</th>
                                <th className="p-2">Plan Name</th>
                                <th className="p-2">Role</th>
                                <th className="p-2 text-center">Chat</th>
                                <th className="p-2 text-center">Mail</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-100/50 dark:hover:bg-slate-800/50">
                                    <td className="p-2 font-medium">{user.username}</td>
                                    <td className="p-2">{user.email}</td>
                                    <td className="p-2">{user.plan_name || 'N/A'}</td>
                                    <td className="p-2">{user.role}</td>
                                    <td className="p-2 text-center"><FeatureIndicator enabled={user.features.chat} /></td>
                                    <td className="p-2 text-center"><FeatureIndicator enabled={user.features.mail} /></td>
                                    <td className="p-2">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleEditUser(user)} className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white" title="Edit User"><PencilIcon /></button>
                                            <button onClick={() => handleDeleteUser(user)} className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white" title="Delete User"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
        </AppContainer>
    );
};

export default AdminPortal;