import { useEffect, useRef } from "react";
import {
  getDatabase,
  ref,
  update,
  push,
  onDisconnect,
  serverTimestamp,
  get,
  set,
  remove,
} from "firebase/database";

const getStageOrder = (stage) => {
  const s = String(stage || "").trim();
  switch (s) {
    case "Landing":
      return 1;
    case "Upload":
      return 2;
    case "Checkout":
      return 3;
    case "Razorpay Checkout":
      return 4;
    default:
      return 0;
  }
};

export const usePresence = (uploadID, sessionID) => {
  const timerRef = useRef(null);
  const myConnectionRef = useRef(null);
  const lastActivityTime = useRef(Date.now());

  useEffect(() => {
    if (!uploadID || !sessionID) return;

    const db = getDatabase();
    const basePath = `presence/splashbook/${sessionID}`;
    const presenceRef = ref(db, basePath);
    const connectionsRef = ref(db, `${basePath}/connections`);
    const reachedTillRef = ref(db, `${basePath}/reachedTill`);

    const goOnline = () => {
      if (!myConnectionRef.current) {
        const newRef = push(connectionsRef);
        set(newRef, true);
        onDisconnect(newRef).remove();
        myConnectionRef.current = newRef;
      }

      update(presenceRef, {
        isLive: true,
        lastActivityAt: null,
        uploadID: uploadID,
        currentPage: "Upload",
      });
    };

    const goOffline = () => {
      if (myConnectionRef.current) {
        remove(myConnectionRef.current);
        myConnectionRef.current = null;
      }

      update(presenceRef, {
        isLive: false,
        lastActivityAt: serverTimestamp(),
      });
    };

    const resetIdleTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(
        () => {
          goOffline();
        },
        2 * 60 * 1000,
      );
    };

    const handleActivity = () => {
      const now = Date.now();

      if (now - lastActivityTime.current < 1000) return;
      lastActivityTime.current = now;

      if (!myConnectionRef.current) {
        goOnline();
      }

      resetIdleTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        goOffline();
        if (timerRef.current) clearTimeout(timerRef.current);
      } else {
        goOnline();
        resetIdleTimer();
      }
    };

    onDisconnect(presenceRef).update({
      isLive: false,
      lastActivityAt: serverTimestamp(),
    });

    get(reachedTillRef)
      .then((snapshot) => {
        const currentStage = snapshot.val() || "Landing";
        if (getStageOrder("Upload") > getStageOrder(currentStage)) {
          update(presenceRef, { reachedTill: "Upload" });
        }
      })
      .catch((err) => console.error("Error checking reachedTill:", err));

    goOnline();
    resetIdleTimer();

    const events = ["touchstart", "scroll", "click", "keydown", "touchmove"];

    events.forEach((evt) => window.addEventListener(evt, handleActivity));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (timerRef.current) clearTimeout(timerRef.current);

      goOffline();
    };
  }, [uploadID, sessionID]);
};
