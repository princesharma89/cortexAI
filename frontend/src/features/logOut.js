import { signOut } from "firebase/auth";
import api from '../../utils/axios'
import { auth } from '../../utils/firebase.js';

async function logOut() {
  await api.get("/api/auth/logout");
  await signOut(auth);
}

export default logOut