import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

const Navbar = () => {

  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  let bd_overview = "";
  let bd_model = "";
  let bd_history = "";

  if (location.pathname === "/") {
    bd_overview = "border-mainRed";
  } else if (location.pathname === "/model" || location.pathname === "/correction") {
    bd_model = "border-mainRed";
  } else {
    bd_history = "border-mainRed";

  }

  return (
    <div className="text-lg m-auto flex justify-center gap-5">

            <Link className={`text-xl pb-1 cursor-pointer border-b-2 ${bd_overview} hover:border-mainRed`} to="/">
                Overview
            </Link>

            <Link className={`text-xl pb-1 cursor-pointer border-b-2 ${bd_model} hover:border-mainRed`} to="/model">
                Uji Model
            </Link>

            {location.pathname === '/model' || location.pathname === "/correction" ? (
              <Link className={`text-xl pb-1 cursor-pointer border-b-2 ${bd_history} hover:border-mainRed`} to="/history">
                  Riwayat
              </Link>
            ) : (
              <></>
            )}

            <button
              onClick={toggleTheme}
              className="fixed top-4 right-4 z-50 btn btn-circle btn-ghost btn-sm"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined">
                {theme === "light" ? "dark_mode" : "light_mode"}
              </span>
            </button>
        
        </div>
  );
}

export default Navbar; 