import { useEffect } from "react";
import { useDispatch } from "react-redux";
import "./App.css";

import Home from "./pages/Home";
import getCurrentUser from "./features/getCurrentUser.js";
import { setUserdata } from "./redux/userSlice.js";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const getUser=async()=>{
      const data=await getCurrentUser();
      dispatch(setUserdata(data));
    };
    getUser();
  }, []);
  return (
    <>
      <Home />
    </>
  );
}

export default App;