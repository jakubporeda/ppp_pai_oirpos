import { useNavigate } from "react-router-dom";

export default function LoginButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/login")}
      className="border w-64 py-2 hover:bg-gray-100"
    >
      Zaloguj
    </button>
  );
}