import React, { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const GoogleLoginButton: React.FC = () => {
  const [error, setError] = useState("");
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSuccessLogin = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError("Google sign-in failed");
      return;
    }
    setError("");
    try {
      await googleLogin(credentialResponse.credential);
      navigate("/");
    } catch {
      setError("Google sign-in failed");
    }
  };

  const handleErrorLogin = () => {
    setError("Google sign-in failed");
  };

  return (
    <>
      {error && <p className="error">{error}</p>}
      <GoogleLogin onSuccess={handleSuccessLogin} onError={handleErrorLogin} />
    </>
  );
};

export default GoogleLoginButton;
