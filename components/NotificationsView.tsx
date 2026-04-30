import React, { useState, useEffect } from 'react';
import { Send, Bell, Mail, Search, Loader2, CheckCircle, AlertCircle, X, Copy, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface Template {
  id: string;
  category: string;
  title: string;
  subject: string;
  message: string;
}

const NotificationsView: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await api.getNotificationTemplates();
        setTemplates(data.templates);
        setCategories(data.categories);
        setFilteredTemplates(data.templates);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Filter templates by category
  useEffect(() => {
    if (selectedCategory) {
      setFilteredTemplates(templates.filter(t => t.category === selectedCategory));
    } else {
      setFilteredTemplates(templates);
    }
  }, [selectedCategory, templates]);

  // Search users with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setSearching(true);
        try {
          const result = await api.searchUsers(searchQuery, 1, 10);
          setSearchResults(result.users);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleSelectTemplate = (template: Template) => {
    setTitle(template.title);
    setMessage(template.message);
    setEmailSubject(template.subject);
    setSendViaEmail(true);
    setShowTemplates(false);
  };

  const handleCopyTemplate = (template: Template) => {
    const templateText = `Title: ${template.title}\n\n${template.message}`;
    navigator.clipboard.writeText(templateText);
    alert('Template copied to clipboard!');
  };

  const handleSendNotifications = async () => {
    if (!message.trim()) {
      setErrorMessage('Message is required');
      return;
    }

    if (selectedUsers.length === 0) {
      setErrorMessage('Please select at least one user');
      return;
    }

    setSending(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const sendPromises = selectedUsers.map(user =>
        api.sendNotificationToUser(user.id, {
          message,
          title: title || 'Notification from Admin',
          type: 'system',
          sendEmail: sendViaEmail,
          emailSubject: emailSubject || title || 'Important Notification'
        })
      );

      await Promise.all(sendPromises);

      setSuccessMessage(`✓ Notification sent to ${selectedUsers.length} user(s)${sendViaEmail ? ' via app and email' : ' via app'}`);
      
      // Reset form
      setMessage('');
      setTitle('');
      setSelectedUsers([]);
      setSendViaEmail(false);
      setEmailSubject('');

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error sending notifications:', error);
      setErrorMessage('Failed to send notifications. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Selection and Message Composition */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Search */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Select Recipients</h2>
            
            <div className="relative mb-4">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-sm"
                />
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleAddUser(user)}
                        disabled={selectedUsers.some(u => u.id === user.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <p className="font-medium text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Selected: {selectedUsers.length} user(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 bg-white border border-green-300 rounded-full px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="ml-1 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message Composition */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Compose Message</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your notification message..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length} / 1000 characters
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Delivery Options and Templates */}
        <div className="space-y-6">
          {/* Templates Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronDown className={`w-5 h-5 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showTemplates && (
              <div className="space-y-3">
                {/* Category Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Filter by Category</label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Templates List */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {templatesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  ) : filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => (
                      <div key={template.id} className="border-b last:border-b-0 p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{template.title}</p>
                            <p className="text-xs text-gray-500">{template.category}</p>
                          </div>
                          <button
                            onClick={() => handleCopyTemplate(template)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Copy template"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{template.message}</p>
                        <button
                          onClick={() => handleSelectTemplate(template)}
                          className="w-full px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded transition-colors"
                        >
                          Use Template
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No templates in this category
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Delivery Options</h2>

            <div className="space-y-3">
              {/* App Notification */}
              <div className="flex items-center p-3 border border-green-300 bg-green-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-sm text-gray-900">In-App Notification</p>
                  <p className="text-xs text-gray-600">Always sent</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendViaEmail}
                  onChange={(e) => setSendViaEmail(e.target.checked)}
                  className="mt-1 mr-3 cursor-pointer"
                />
                <label htmlFor="sendEmail" className="flex-1 cursor-pointer">
                  <p className="font-medium text-sm text-gray-900">Also Send via Email</p>
                  <p className="text-xs text-gray-600">Users will receive an email notification</p>
                </label>
              </div>

              {/* Email Subject */}
              {sendViaEmail && (
                <div className="ml-6 mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={title || 'Notification from UniMart'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Recipients:</span>
                <span className="font-medium text-gray-900">{selectedUsers.length} user(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery:</span>
                <span className="font-medium text-gray-900">
                  {sendViaEmail ? 'App + Email' : 'App Only'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Message:</span>
                <span className="font-medium text-gray-900">
                  {message.length > 0 ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendNotifications}
            disabled={sending || selectedUsers.length === 0 || !message.trim()}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Notifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
