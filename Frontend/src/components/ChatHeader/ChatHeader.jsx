
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  UserRound,
  Settings,
  X,
  Camera,
  Trash2,
  LogOut,
} from "lucide-react";
import styles from "./ChatHeader.module.css";

export default function ChatHeader() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem("authUser") || "null");

  const [name, setName] = useState(
    localStorage.getItem("profileName") || savedUser?.name || "ChatGPT User",
  );

  const [editingName, setEditingName] = useState(name);

  const [profilePicture, setProfilePicture] = useState(
    localStorage.getItem("profilePicture") || "",
  );

  const fileInputRef = useRef(null);

  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handlePictureChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      try {
        localStorage.setItem("profilePicture", imageData);
        setProfilePicture(imageData);
      } catch {
        alert("Unable to save this picture. Please choose a smaller image.");
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removePicture = () => {
    localStorage.removeItem("profilePicture");
    setProfilePicture("");
  };

  const saveProfile = () => {
    const updatedName = editingName.trim();

    if (!updatedName) {
      alert("Please enter a display name.");
      return;
    }

    setName(updatedName);
    localStorage.setItem("profileName", updatedName);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("profileName");

    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span>ChatGPT</span>
        <ChevronDown size={16} />
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.avatar}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open profile menu"
          aria-expanded={menuOpen}
        >
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" />
          ) : (
            initials || "U"
          )}
        </button>

        {menuOpen && (
          <div className={styles.profileMenu}>
            <div className={styles.menuUser}>
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className={styles.menuAvatarImage}
                />
              ) : (
                <div className={styles.menuAvatar}>{initials || "U"}</div>
              )}

              <div className={styles.menuUserInfo}>
                <span>{name}</span>
                <small>{savedUser?.email || ""}</small>
              </div>
            </div>

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setEditingName(name);
                setProfileOpen(true);
                setMenuOpen(false);
              }}
            >
              <UserRound size={17} />
              Profile
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setSettingsOpen(true);
                setMenuOpen(false);
              }}
            >
              <Settings size={17} />
              Settings
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={handleLogout}
            >
              <LogOut size={17} />
              Log out
            </button>
          </div>
        )}
      </div>

      {profileOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setProfileOpen(false)}
        >
          <div
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setProfileOpen(false)}
              aria-label="Close profile"
            >
              <X size={20} />
            </button>

            <h2>My Profile</h2>

            <div className={styles.pictureSection}>
              <div className={styles.largeAvatar}>
                {profilePicture ? (
                  <img src={profilePicture} alt="Your profile" />
                ) : (
                  initials || "U"
                )}
              </div>

              <button
                type="button"
                className={styles.pictureButton}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={16} />
                Change picture
              </button>

              {profilePicture && (
                <button
                  type="button"
                  className={styles.removePictureButton}
                  onClick={removePicture}
                >
                  <Trash2 size={15} />
                  Remove picture
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={handlePictureChange}
              />

              <p className={styles.pictureHint}>
                Choose an image up to 2 MB.
              </p>
            </div>

            <label htmlFor="profile-name">Display name</label>

            <input
              id="profile-name"
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
              maxLength={40}
              placeholder="Enter your name"
            />

            <button
              type="button"
              className={styles.saveButton}
              onClick={saveProfile}
            >
              Save changes
            </button>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setSettingsOpen(false)}
              aria-label="Close settings"
            >
              <X size={20} />
            </button>

            <h2>Settings</h2>
            <p>Your profile name and picture are saved in this browser.</p>
            <p>More preferences can be added here later.</p>
          </div>
        </div>
      )}
    </header>
  );
}