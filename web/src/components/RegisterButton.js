import { useNavigate } from "react-router-dom";

export default function RegisterButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/register")}
      className="border w-64 py-2 hover:bg-gray-100"
    >
      Załóż konto
    </button>
  );
}