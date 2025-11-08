
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabaseService } from '../../services/supabaseService';
import { Contact } from '../../types';
import AddContactModal from '../../components/AddContactModal';
import { PhoneIcon } from '@heroicons/react/24/solid';

const ContactsApp: React.FC = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);

    const fetchContacts = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const userContacts = await supabaseService.getContactsForUser(user.username);
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
            await supabaseService.deleteContact(contactId);
            fetchContacts();
        }
    };

    const handleSaveContact = async (contactData: Omit<Contact, 'id' | 'owner'> & { id?: number }) => {
        if (!user) return;
        const payload = { ...contactData, owner: user.username };
        if (payload.id) {
            await supabaseService.updateContact(payload as Contact);
        } else {
            await supabaseService.addContact(payload);
        }
        fetchContacts();
    };

    return (
        <div className="w-full max-w-5xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Contacts</h1>
                <button onClick={handleAddContact} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Add Contact
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
                                    {contact.phone && <p className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mt-1"><PhoneIcon className="h-4 w-4 shrink-0"/> <span>{contact.phone}</span></p>}
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button onClick={() => handleEditContact(contact)} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white">Edit</button>
                                    <button onClick={() => handleDeleteContact(contact.id)} className="px-3 py-1 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white">Delete</button>
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
