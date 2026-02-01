import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { EditorPage } from "./Pages/EditorPage";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./Firebase/firebase";
// IMPORT THE HOOK
import { usePresence } from "./Hooks/usePresence";
// IMPORT THE NEW SKELETON COMPONENT
import { UploadSkeleton } from "./Components/UploadSkeleton";

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

        // CHECK PAYMENT STATUS
        if (orderDetails.orderStatus === "paid") {
          window.location.replace("https://gyftalala.com");
          return;
        }

        // USER SYNC LOGIC (Preserved Exactly)
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

  // --- CHANGED SECTION STARTS HERE ---
  // Replaced the 12 lines of "conversion-overlay" HTML with the Skeleton component
  if (loading) {
    return <UploadSkeleton />;
  }
  // --- CHANGED SECTION ENDS HERE ---

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
