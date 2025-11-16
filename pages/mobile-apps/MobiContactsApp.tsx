import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import { Contact } from '../../types';
import AddContactModal from '../../components/AddContactModal';

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

const MobiContactsApp: React.FC = () => {
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
    
    const handleAddClick = () => {
        setContactToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (contact: Contact) => {
        setContactToEdit(contact);
        setIsModalOpen(true);
    };

    const handleSave = async (contactData: Omit<Contact, 'id' | 'owner'> & { id?: number }) => {
        if (contactData.id) {
            await database.updateContact({ ...contactData, owner: user!.username } as Contact);
        } else {
            await database.addContact(contactData);
        }
        fetchContacts();
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="p-4 text-center">Loading contacts...</div>;
        }
        return contacts.length > 0 ? (
            <ul>
                {contacts.map(contact => (
                    <li key={contact.id} className="border-b border-gray-200 dark:border-gray-700">
                        <button onClick={() => handleEditClick(contact)} className="w-full text-left p-4 flex items-center space-x-4">
                             <div className="w-12 h-12 bg-blue-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold">
                                {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold">{contact.name}</h3>
                                {contact.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{contact.phone}</p>}
                                {contact.email && <p className="text-sm text-blue-500 dark:text-blue-400 truncate max-w-[200px]">{contact.email}</p>}
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20 p-4">
                <p className="text-lg">No contacts yet.</p>
                <p>Tap the '+' button to add your first contact.</p>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
            <header className="p-4 flex-shrink-0 bg-white dark:bg-gray-900 shadow-md">
                <h1 className="text-2xl font-bold">My Contacts</h1>
            </header>
            <main className="flex-grow overflow-y-auto relative">
                {renderContent()}
                <button 
                    onClick={handleAddClick} 
                    className="absolute bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700"
                    aria-label="Add new contact"
                >
                    <PlusIcon />
                </button>
            </main>
             <AddContactModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                contactToEdit={contactToEdit}
            />
        </div>
    );
};

export default MobiContactsApp;