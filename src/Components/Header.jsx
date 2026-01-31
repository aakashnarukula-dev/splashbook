import React, { useState } from "react";
import { MdDragIndicator } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import "./Header.css";
import ConfirmationModal from "./ConfirmationModal";
import { auth } from "../Firebase/firebase";

export const Header = ({
  product,
  theme,
  pages,
  type,
  files,
  user,
  onLoginClick,
}) => {
  const [showExitModal, setShowExitModal] = useState(false);

  const handleAuthClick = () => {
    if (user) {
      auth.signOut(); // Sign out if user is logged in
    } else {
      onLoginClick(); // Open login modal if not logged in
    }
  };

  const confirmExit = async () => {
    window.history.back();
  };

  const handleBack = () => {
    if (files.length !== 0) {
      setShowExitModal(true);
    } else {
      confirmExit();
    }
  };

  return (
    <>
      {/*Confirmation Modal */}
      {showExitModal && (
        <ConfirmationModal
          message="Are you sure you want to exit?"
          onConfirm={confirmExit}
          onCancel={() => setShowExitModal(false)}
        />
      )}
      <div className="header-container">
        <header className="header">
          <div onClick={handleBack} aria-label="Go back" className="back-icon">
            <IoArrowBack size={25} />
          </div>
          <div className="header-text">
            <span className="header-title">
              {theme.charAt(0).toUpperCase() + theme.slice(1)}{" "}
              {product.charAt(0).toUpperCase() + product.slice(1)}
            </span>

            <span className="sub-heading">
              {type} | {pages} pages
            </span>
          </div>
        </header>
        {/* <hr className="header-divider" /> */}
        {files.length !== 0 && (
          <div className="sub-header">
            Drag using this icon <MdDragIndicator size={18} /> to rearrange the
            page order
          </div>
        )}
      </div>
    </>
  );
};
