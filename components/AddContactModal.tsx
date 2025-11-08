
import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { XMarkIcon } from '@heroicons/react/24/solid';


interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contact: Omit<Contact, 'id' | 'owner'> & { id?: number }) => void;
    contactToEdit?: Contact | null;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onSave, contactToEdit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (contactToEdit) {
            setName(contactToEdit.name);
            setEmail(contactToEdit.email || '');
            setPhone(contactToEdit.phone || '');
        } else {
            setName('');
            setEmail('');
            setPhone('');
        }
    }, [contactToEdit, isOpen]);

    const handleSave = () => {
        if (!name) return; // Name is required
        const contactData: Omit<Contact, 'id' | 'owner'> & { id?: number } = {
            name,
            email,
            phone,
        };
        if (contactToEdit) {
            contactData.id = contactToEdit.id;
        }
        onSave(contactData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md text-light-text dark:text-white">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold">{contactToEdit ? 'Edit Contact' : 'Add Contact'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                         <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <input type="text" placeholder="Name (required)" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end p-4 bg-gray-50 dark:bg-slate-900/50 rounded-b-lg space-x-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
};

export default AddContactModal;
