import React, { useRef, useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { MdDragIndicator, MdDelete, MdEdit } from "react-icons/md";
import { IoIosCloseCircle } from "react-icons/io";
import { storage } from "../Firebase/firebase";
import { ref, deleteObject } from "firebase/storage";
import "./SortableItem.css";
import ConfirmationModal from "./ConfirmationModal";

export const SortableItem = ({ fileObj, caption, onDelete, updateQuote }) => {
  // Defensive check
  if (!fileObj || !fileObj.id) {
    console.error("SortableItem: fileObj or fileObj.id is missing", fileObj);
    return null;
  }

  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  const [editedQuote, setEditedQuote] = useState(caption);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveQuoteModal, setShowRemoveQuoteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Focus logic for Edit Modal
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleEditClick = () => {
    setEditedQuote(caption); // Ensure we start with current caption
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateQuote(editedQuote);
    setIsEditing(false);
  };

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: fileObj.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setShowDeleteModal(false); // Close modal immediately
    try {
      if (fileObj.uploadedUrl) {
        const fileRef = ref(storage, fileObj.uploadedUrl);
        await deleteObject(fileRef);
      }
      onDelete();
    } catch (error) {
      console.error("Error deleting the file:", error);
      alert("Failed to delete image."); // Optional: user feedback
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRemoveQuote = () => {
    updateQuote("");
    setShowRemoveQuoteModal(false);
  };

  return (
    <>
      {/* 1. Full-page deletion overlay (Restored) */}
      {isDeleting && (
        <div className="full-page-deleting-overlay">
          <div className="deleting-content">
            <div className="spinner"></div>
            <p style={{ fontSize: "12px" }}>Deleting the image...</p>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          message="Are you sure you want to remove this image?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* 3. Remove Caption Confirmation Modal */}
      {showRemoveQuoteModal && (
        <ConfirmationModal
          message="Are you sure you want to remove this caption?"
          onConfirm={confirmRemoveQuote}
          onCancel={() => setShowRemoveQuoteModal(false)}
        />
      )}

      {/* 4. Edit Caption Modal (Popup) */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div
            className="confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="textarea-container">
              <textarea
                ref={inputRef}
                value={editedQuote}
                onChange={(e) => {
                  // Prevent typing beyond limit
                  if (e.target.value.length <= 130) {
                    setEditedQuote(e.target.value);
                  }
                }}
                rows="4"
                placeholder="Edit your text here..."
                maxLength={130}
              />
              <span className="char-count">{`${editedQuote.length}/130`}</span>
            </div>
            <p style={{ fontSize: "12px", color: "#666", margin: "0px" }}>
              If you don't want the caption on this page, just remove the text
              and save it.
            </p>

            <div className="button-group">
              <button
                className="modal-cancel"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button className="modal-confirm" onClick={handleSaveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Item Card */}
      <div className="each-item-container" ref={setNodeRef} style={style}>
        <div className="drag-handle" {...attributes} {...listeners}>
          <MdDragIndicator size={20} />
        </div>

        <div className="image-container">
          <img
            className="each-item-image"
            src={fileObj.preview}
            alt="upload-preview"
          />
          {fileObj.progress < 100 && (
            <div className="progress-overlay">
              <CircularProgressbar
                className="each-item-image-progress-bar"
                value={fileObj.progress}
                text={`${fileObj.progress}%`}
                styles={buildStyles({
                  textSize: "25px",
                  textColor: "#fff",
                  pathColor: "#4caf50",
                  trailColor: "rgba(255,255,255,0.2)",
                })}
              />
            </div>
          )}
        </div>

        {/* --- NEW STRUCTURE (Matches splashbook UI) --- */}
        <div className="quote-wrapper">
          <div
            className={`quote-box ${
              !fileObj.uploadedUrl || caption === "" ? "is-placeholder" : ""
            }`}
            onClick={
              fileObj.uploadedUrl && caption === ""
                ? handleEditClick
                : undefined
            }
          >
            {fileObj.uploadedUrl ? (
              caption !== "" ? (
                // Display Caption
                caption
              ) : (
                // Display Placeholder Text
                "Write a caption (Optional)"
              )
            ) : (
              // Display Skeleton while uploading/generating
              <div className="skeleton-card">
                <div className="skeleton-header">
                  <p>Generating Caption...</p>
                </div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            )}
          </div>

          {/* Action Buttons (Stacked Vertically) */}
          {caption !== "" && fileObj.uploadedUrl && (
            <div className="item-actions">
              <div
                className="action-btn btn-edit"
                onClick={handleEditClick}
                title="Edit Caption"
              >
                <MdEdit />
              </div>
              <div
                className="action-btn btn-clear"
                onClick={() => setShowRemoveQuoteModal(true)}
                title="Remove Caption"
              >
                <IoIosCloseCircle />
              </div>
            </div>
          )}
        </div>

        {/* Global Delete Button */}
        <div>
          <MdDelete
            className="each-item-delete-icon"
            onClick={() => setShowDeleteModal(true)}
            title="Delete Image"
          />
        </div>
      </div>
    </>
  );
};
