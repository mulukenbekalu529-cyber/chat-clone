import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "https://chat-clone-mlrm.onrender.com/api";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        setError(
          error.response?.data?.message || "Unable to load your profile.",
        );

        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          navigate("/login", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Profile unavailable</h1>
          <p className="auth-error">{error}</p>
          <Link to="/login">Return to login</Link>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Your Profile</h1>
        <p>Your account information</p>

        <div className="profile-details">
          <p>
            <strong>Name:</strong> {user.name}
          </p>

          <p>
            <strong>Email:</strong> {user.email}
          </p>

          {user.created_at && (
            <p>
              <strong>Member since:</strong>{" "}
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <button type="button" onClick={() => navigate("/")}>
          Go to Chat
        </button>

        <button type="button" className="profile-logout" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}

export default Profile;
