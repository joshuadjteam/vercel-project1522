import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import { Contact } from '../../types';
import AddContactModal from '../../components/AddContactModal';

const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const ContactsApp: React.FC = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);

    const fetchContacts = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const userContacts = await database.getContactsForUser(user.username);
        setContacts(userContacts);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);
    
    const handleAddContact = () => {
        setContactToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditContact = (contact: Contact) => {
        setContactToEdit(contact);
        setIsModalOpen(true);
    };

    const handleDeleteContact = async (contactId: number) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            await database.deleteContact(contactId);
            fetchContacts();
        }
    };

    const handleSaveContact = async (contactData: Omit<Contact, 'id' | 'owner'> & { id?: number }) => {
        if (!user) return;
        const payload = { ...contactData, owner: user.username };
        if (payload.id) {
            await database.updateContact(payload as Contact);
        } else {
            await database.addContact(payload);
        }
        fetchContacts();
    };

    return (
        <div className="w-full h-full p-8 bg-dark-bg text-light-text dark:text-white flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h1 className="text-4xl font-bold">Contacts</h1>
                <button onClick={handleAddContact} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2">
                    <UserPlusIcon />
                    <span>Add Contact</span>
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                {isLoading ? (
                    <p>Loading contacts...</p>
                ) : contacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contacts.map(contact => (
                            <div key={contact.id} className="bg-black/5 dark:bg-black/20 p-4 rounded-lg flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold">{contact.name}</h3>
                                    {contact.email && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 truncate">Email: {contact.email}</p>}
                                    {contact.phone && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Tel: {contact.phone}</p>}
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button onClick={() => handleEditContact(contact)} className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white" title="Edit Contact"><PencilIcon /></button>
                                    <button onClick={() => handleDeleteContact(contact.id)} className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white" title="Delete Contact"><TrashIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                        <p className="text-lg">Your contact list is empty.</p>
                        <p>Click "Add Contact" to get started.</p>
                    </div>
                )}
            </div>
            <AddContactModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveContact}
                contactToEdit={contactToEdit}
            />
        </div>
    );
};

export default ContactsApp;
