import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { userAPI } from '../services/api.js';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.avatar || null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
      setProfileImage(user.avatar);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload to backend
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        setIsLoading(true);
        const response = await userAPI.uploadProfileImage(formData);
        
        // Update with server URL
        setProfileImage(response.data.avatar);
        updateUser({ avatar: response.data.avatar });
        
        alert('Profile image updated successfully!');
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        // Revert to original image on error
        setProfileImage(user?.avatar);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        avatar: profileImage
      };

      // Update user profile via API
      const response = await userAPI.updateProfile(updateData);
      
      // Update user context
      updateUser(response.data || response);
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    });
    setProfileImage(user?.avatar);
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1 className="page-title">Edit Profile</h1>
      </div>

      {/* Profile Image Section */}
      <div className="profile-image-section">
        <div className="profile-image-container">
          <img 
            src="/default-profile.svg" 
            alt="Profile" 
            className="profile-image"
          />
          {isEditing && (
            <label className="edit-image-btn">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <span className="edit-icon">✏️</span>
            </label>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="profile-form">
        <div className="form-group">
          <label className="form-label">FULL NAME</label>
          {isEditing ? (
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your full name"
            />
          ) : (
            <div className="form-display">{formData.fullName || 'Not provided'}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">EMAIL</label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your email"
            />
          ) : (
            <div className="form-display">{formData.email || 'Not provided'}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">PHONE NUMBER</label>
          {isEditing ? (
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your phone number"
            />
          ) : (
            <div className="form-display">{formData.phone || 'Not provided'}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">BIO</label>
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Tell us about yourself"
              rows="3"
            />
          ) : (
            <div className="form-display">{formData.bio || 'Not provided'}</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="profile-actions">
        {isEditing ? (
          <div className="edit-actions">
            <button 
              className="cancel-btn" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="save-btn" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'SAVE'}
            </button>
          </div>
        ) : (
          <button 
            className="edit-profile-btn" 
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Logout Button */}
      <div className="logout-section">
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
