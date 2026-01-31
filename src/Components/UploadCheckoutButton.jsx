import React, { useState } from "react";
import "./CheckoutButton.css";
import { MdOutlineFileUpload } from "react-icons/md";
import { CgArrowLongRight } from "react-icons/cg";
import { MdErrorOutline } from "react-icons/md"; // Added an icon for the warning state

export const UploadCheckoutButton = ({
  pages,
  uploadID,
  files,
  getRootProps,
  getInputProps,
}) => {
  const AreAllPicturesUploaded = files.every(
    (file) => file.uploadedUrl !== null,
  );

  const [checkingOut, setCheckingOut] = useState(false);
  const requiredPages = parseInt(pages); // stored in a variable for cleaner usage

  const initiateCheckout = async () => {
    setCheckingOut(true);
    window.location.href = `https://gyftalala.com/checkout?id=${uploadID}`;
    setCheckingOut(false);
  };

  return (
    <>
      {" "}
      {files.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "0px",
          }}
        >
          <div className="first-upload-btn" {...getRootProps()}>
            <MdOutlineFileUpload size={25} />
            <input {...getInputProps()} />
            <p style={{ fontWeight: "600" }}>
              Select only {requiredPages - files.length} Pictures
            </p>
          </div>
        </div>
      ) : requiredPages === files.length && AreAllPicturesUploaded ? (
        checkingOut ? (
          <div className="upload-container">
            <div className="checkout-btn" style={{ borderRadius: "20px" }}>
              <div className="loading">
                Checking out <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="checkout-btn" onClick={initiateCheckout}>
              <div>⚡️ Express checkout</div>
              <CgArrowLongRight size={20} />
            </div>
          </>
        )
      ) : requiredPages === files.length && !AreAllPicturesUploaded ? (
        <div className="checkout-btn" style={{ borderRadius: "20px" }}>
          <div className="loading">
            Finalising the pictures <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      ) : files.length > requiredPages ? (
        /* --- NEW LOGIC: TOO MANY PICTURES --- */
        <div
          className="checkout-btn"
          style={{
            borderRadius: "20px",
            cursor: "default",
            borderColor: "#ff4d4f",
            color: "#ff4d4f",
          }}
        >
          {/* We do NOT include getRootProps here, because we don't want them to upload more */}
          <MdErrorOutline size={25} />
          <p style={{}}>
            Remove {files.length - requiredPages} pictures to continue
          </p>
        </div>
      ) : (
        /* --- STANDARD LOGIC: UPLOAD MORE --- */
        <div className="checkout-btn" {...getRootProps()}>
          <MdOutlineFileUpload size={25} />
          <input {...getInputProps()} />
          <p style={{}}>Upload {requiredPages - files.length} more pictures</p>
        </div>
      )}
    </>
  );
};
