import { firebaseConfig } from "@letscook/sdk";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

export const fetchFromFirebase = async (path: string) => {
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    const snapshot = await get(ref(database, path));
    return snapshot.val();
};