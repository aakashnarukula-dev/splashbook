import React, { useState, useEffect } from "react";
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
} from "firebase/auth";
import { auth } from "../Firebase/firebase"; // Removed 'db'
// Removed doc, updateDoc imports
import "./LoginModal.css";

// Added onLoginSuccess prop
export const LoginModal = ({ onClose, onLoginSuccess }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sheetVisible) {
      document.body.classList.add("body-no-scroll");
    } else {
      document.body.classList.remove("body-no-scroll");
    }
    return () => {
      document.body.classList.remove("body-no-scroll");
    };
  }, [sheetVisible]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0 && isOtpSent) {
      timer = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer, isOtpSent]);

  useEffect(() => {
    setSheetVisible(true);
    return () => setSheetVisible(false);
  }, []);

  const Recaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            console.log("Recaptcha verified");
          },
          "expired-callback": () => {
            console.error("Recaptcha expired");
          },
        },
      );
    }
  };

  const closeModal = () => {
    setSheetVisible(false);
    setTimeout(onClose, 500);
  };

  const handleSendOtp = () => {
    if (!name) {
      setErrorMessage("Please enter the name");
      return;
    }
    if (phoneNumber.length === 0) {
      setErrorMessage("Please enter the WhatsApp number");
      return;
    }
    if (phoneNumber.length !== 10) {
      setErrorMessage("WhatsApp number must be 10 digits.");
      return;
    }

    setErrorMessage("");
    setLoading(true);
    Recaptcha();
    const fullPhoneNumber = `+91${phoneNumber}`;
    sendOTP(fullPhoneNumber)
      .then(() => {
        setIsOtpSent(true);
        setResendTimer(30);
      })
      .catch(() => {
        window.recaptchaVerifier = null;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const sendOTP = async (fullPhoneNumber) => {
    const appVerifier = window.recaptchaVerifier;
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        appVerifier,
      );
      window.confirmationResult = confirmationResult;
    } catch (error) {
      setErrorMessage("Error sending OTP. Please try again.");
      throw error;
    }
  };

  const verifyOTP = () => {
    if (otp.length !== 6) {
      setErrorMessage("OTP must be 6 digits.");
      return;
    }

    setLoading(true);
    return window.confirmationResult
      .confirm(otp)
      .then((result) => {
        return updateProfile(result.user, {
          displayName: name,
        });
      })
      .then(() => {
        // REMOVED: createFirestoreDocument();

        // NEW: Pass data back to parent
        if (onLoginSuccess) {
          onLoginSuccess({ name, phoneNumber });
        }
        closeModal();
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage("Incorrect OTP. Please enter valid OTP.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // REMOVED: createFirestoreDocument function entirely

  const handleResendOtp = () => {
    if (resendTimer === 0) {
      setResendTimer(30);
      setOtp("");
      setErrorMessage("");
      handleSendOtp();
    }
  };

  const handleNumberChange = (e) => {
    const value = e.target.value;
    if (value.length <= 10 && /^[0-9]*$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (value.length <= 6 && /^[0-9]*$/.test(value)) {
      setOtp(value);
    }
  };

  const handleChangeMobile = () => {
    setPhoneNumber("");
    setIsOtpSent(false);
    setOtp("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isOtpSent) {
      verifyOTP();
    } else {
      handleSendOtp();
    }
  };

  return (
    // ... (JSX remains exactly the same, no changes to UI structure)
    <div className="bottom-sheet-container">
      <div id="copy-toast" className="copy-toast">
        Coupon code copied!
      </div>
      <div className={`backdrop ${sheetVisible ? "visible" : ""}`} />
      <div className={`bottom-sheet ${sheetVisible ? "visible" : ""}`}>
        <div className="sheet-content">
          <img
            src="https://cdn.shopify.com/s/files/1/0727/2775/7107/files/Logo.svg"
            width={50}
            alt="Logo"
          />

          <>
            <h1 style={{ marginBottom: "6px " }}>
              Login to continue uploading
            </h1>
            <p style={{ maxWidth: "330px", margin: "0px auto" }}>
              Simply log in to save your uploaded photo progress — so if you
              ever pause, you can continue right where you left off.
            </p>

            <div id="recaptcha-container"></div>
            {errorMessage && <div className="error-popup">{errorMessage}</div>}
            <form onSubmit={handleSubmit}>
              {!isOtpSent ? (
                <div>
                  <div className="phone-input-section">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      style={{ color: "black" }}
                    />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={handleNumberChange}
                      placeholder="WhatsApp Number"
                      style={{ color: "black" }}
                    />
                    <button
                      className="otp-button"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <span>Sending OTP</span>
                          <span className="loader" />
                        </span>
                      ) : (
                        "Get OTP"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="phone-input-section">
                  <h3
                    style={{
                      margin: "0px",
                      fontWeight: "700",
                      color: "#00675E",
                    }}
                  >
                    OTP Verification
                  </h3>
                  {/* ... Rest of JSX ... */}
                  <p
                    style={{
                      margin: "0px",
                      color: "#00675E",
                      fontSize: "12px",
                    }}
                  >
                    We have sent the OTP to
                    <span
                      style={{
                        fontWeight: "600",
                        fontSize: "16px",
                        margin: "0px",
                      }}
                    >
                      <br />
                      <span
                        style={{
                          display: "flex",
                          marginBottom: "15px",
                          justifyContent: "center",
                          fontWeight: "600",
                        }}
                      >
                        {phoneNumber}
                        <span
                          style={{
                            backgroundColor: "white",
                            color: "green",
                            borderRadius: "20px",
                            padding: "1px 10px",
                            marginLeft: "10px",
                            border: "2px solid green",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                          onClick={handleChangeMobile}
                        >
                          Edit
                        </span>
                      </span>
                    </span>
                  </p>

                  <input
                    type="text"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="Enter OTP"
                  />
                  <button
                    className="otp-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <span>Verifying OTP</span>
                        <span className="loader" />
                      </span>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                  <div className="otp-options">
                    {resendTimer > 0 ? (
                      <p
                        style={{
                          color: "gray",
                          textDecoration: "none",
                          cursor: "default",
                        }}
                      >
                        Resend OTP in {resendTimer} seconds
                      </p>
                    ) : (
                      <p
                        onClick={handleResendOtp}
                        style={{
                          color: "#00675E",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Resend OTP
                      </p>
                    )}
                  </div>
                </div>
              )}
            </form>
          </>
        </div>
      </div>
    </div>
  );
};
