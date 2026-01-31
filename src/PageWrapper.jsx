import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { EditorPage } from "./Pages/EditorPage";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./Firebase/firebase";
// IMPORT THE HOOK
import { usePresence } from "./Hooks/usePresence";

export const PageWrapper = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  const [editorProps, setEditorProps] = useState({
    uploadID: null,
    product: "splashbook",
    pages: 30,
    theme: "",
    type: "",
  });

  const params = new URLSearchParams(location.search);
  const uploadID = params.get("uploadID");
  // 1. GET SESSION ID
  const sessionID = params.get("sessionID");

  // 2. ACTIVATE TRACKING
  // This will handle isLive, connections, and reachedTill logic automatically
  usePresence(uploadID, sessionID);

  const syncUserToFirestore = async (uid, details) => {
    try {
      const docRef = doc(db, "leads", uid);
      await updateDoc(docRef, {
        userDetails: details,
      });
      console.log("Synced userDetails to Firestore");
    } catch (err) {
      console.error("Failed to sync user to Firestore", err);
    }
  };

  useEffect(() => {
    // ... (Rest of your existing useEffect logic remains unchanged) ...
    if (!uploadID) {
      window.location.replace("https://gyftalala.com");
      return;
    }

    const docRef = doc(db, "leads", uploadID);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          window.location.replace("https://gyftalala.com");
          return;
        }

        const data = docSnap.data();
        const orderDetails = data.orderDetails || {};
        if (orderDetails.orderStatus === "paid") {
          window.location.replace("https://gyftalala.com");
          return;
        }

        const lsUser = localStorage.getItem("userDetails");
        const dbUser = data.userDetails;
        let activeUser = null;

        if (lsUser) {
          activeUser = JSON.parse(lsUser);
          setUserDetails(activeUser);

          if (!dbUser || dbUser.phoneNumber !== activeUser.phoneNumber) {
            syncUserToFirestore(uploadID, activeUser);
          }
        } else if (dbUser) {
          activeUser = dbUser;
          setUserDetails(activeUser);
          localStorage.setItem("userDetails", JSON.stringify(activeUser));
        }

        const pDetails = data.productDetails || {};
        const sInput = data.shippingInput || {};

        setEditorProps({
          uploadID: uploadID,
          product: pDetails.product,
          pages: pDetails.pages,
          theme: pDetails.theme,
          type: pDetails.type,
          shippingMethod: sInput.shippingMethod,
          pincode: sInput.pincode,
        });

        setLoading(false);
      },
      (err) => {
        console.error("Error fetching lead data:", err);
        window.location.replace("https://gyftalala.com");
      },
    );

    return () => unsubscribe();
  }, [uploadID]);

  const handleLoginSuccess = async (newDetails) => {
    if (!uploadID) return;
    setUserDetails(newDetails);
    localStorage.setItem("userDetails", JSON.stringify(newDetails));
    await syncUserToFirestore(uploadID, newDetails);
  };

  if (!uploadID) return null;

  if (loading) {
    return (
      <div className="conversion-overlay">
        <div className="spinner"></div>
        <p
          style={{
            color: "black",
            marginTop: "10px",
            textAlign: "center",
            fontSize: "12px",
          }}
        >
          Loading your project...
        </p>
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <div>
      <EditorPage
        {...editorProps}
        userDetails={userDetails}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};
