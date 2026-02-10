import React, { useEffect, useState } from "react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setUser);
  }, [token]);

  const requestOwner = async () => {
    const res = await fetch("http://127.0.0.1:8000/users/request-owner", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    alert(data.message);
    window.location.reload();
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">👤 Mój Profil</h1>

      <p><b>Email:</b> {user.email}</p>
      <p><b>Imię:</b> {user.first_name} {user.last_name}</p>
      <p><b>Rola:</b> {user.role}</p>

      {user.role === "user" && (
        <>
          {user.role_request === "pending" ? (
            <p className="text-yellow-600 mt-4 font-bold">
              ⏳ Wniosek oczekuje na rozpatrzenie
            </p>
          ) : (
            <button
              onClick={requestOwner}
              className="mt-6 bg-green-600 text-white px-4 py-2 rounded"
            >
              🍽️ Złóż wniosek o restauratora
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
