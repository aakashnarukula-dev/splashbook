import React, { useState } from "react";
import "./UploadCheckoutButton.css";
import { MdOutlineFileUpload } from "react-icons/md";
import { CgArrowLongRight } from "react-icons/cg";
import { MdErrorOutline } from "react-icons/md";

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
  const requiredPages = parseInt(pages);

  const initiateCheckout = async () => {
    setCheckingOut(true);
    window.location.href = `https://gyftalala.com/checkout?id=${uploadID}`;
    setCheckingOut(false);
  };

  return (
    <>
      {" "}
      {files.length === 0 ? (
        <div>
          <div className="first-upload-btn" {...getRootProps()}>
            <MdOutlineFileUpload size={25} />
            <input {...getInputProps()} />
            <p style={{ fontWeight: "600", margin: 0 }}>
              Select only {requiredPages - files.length} Pictures
            </p>
          </div>
        </div>
      ) : requiredPages === files.length && AreAllPicturesUploaded ? (
        checkingOut ? (
          <div className="upload-container">
            <div className="checkout-btn">
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
        <div className="checkout-btn">
          <div className="loading">
            Finalising the pictures <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      ) : files.length > requiredPages ? (
        <div
          className="checkout-btn"
          style={{
            cursor: "default",
            borderColor: "#ff4d4f",
            color: "#ff4d4f",
          }}
        >
          <MdErrorOutline size={25} />
          <p>Remove {files.length - requiredPages} pictures to continue</p>
        </div>
      ) : (
        <>
          <div className="checkout-btn" {...getRootProps()}>
            <MdOutlineFileUpload size={25} />
            <input {...getInputProps()} />
            <p>Upload {requiredPages - files.length} more pictures</p>
          </div>
        </>
      )}
    </>
  );
};
