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
  // Defensive check to ensure fileObj and fileObj.id exist
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

  // Focus and cursor positioning logic
  useEffect(() => {
    if (isEditing && inputRef.current) {
      const textarea = inputRef.current;
      textarea.focus();
      // Set cursor to end of text
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedQuote(caption);
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
    try {
      if (fileObj.uploadedUrl) {
        const fileRef = ref(storage, fileObj.uploadedUrl);
        await deleteObject(fileRef);
      }
      onDelete();
    } catch (error) {
      console.error("Error deleting the file:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const confirmRemoveQuote = () => {
    updateQuote(""); // Remove the caption
    setShowRemoveQuoteModal(false);
  };

  return (
    <>
      {/* Full-page deletion overlay */}
      {isDeleting && (
        <div className="full-page-deleting-overlay">
          <div className="deleting-content">
            <div className="spinner"></div>
            <p>Deleting the image...</p>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          message="Are you sure you want to remove this image?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Remove Caption Confirmation Modal */}
      {showRemoveQuoteModal && (
        <ConfirmationModal
          message="Are you sure you want to remove this caption?"
          onConfirm={confirmRemoveQuote}
          onCancel={() => setShowRemoveQuoteModal(false)}
        />
      )}

      {/* Edit Caption Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div
            className="confirmation-modal"
            style={{ width: "400px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="textarea-container">
              <textarea
                ref={inputRef}
                value={editedQuote}
                onChange={(e) => setEditedQuote(e.target.value)}
                rows="4"
                placeholder="Edit your text here..."
                maxLength={130}
              />
              <span className="char-count">{`${editedQuote.length}/130`}</span>
            </div>
            <p style={{ fontSize: "12px" }}>
              If you don't want the caption on this page. Just remove the text
              and save it
            </p>
            <br />
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

      <div className="each-item-container" ref={setNodeRef} style={style}>
        <MdDragIndicator
          className="drag-handle"
          size={32}
          style={{ touchAction: "none" }}
          {...listeners}
          {...attributes}
        />
        <div className="image-container">
          <img
            className="each-item-image"
            src={fileObj.uploadedUrl || fileObj.preview}
            alt=""
          />
          {!fileObj.uploadedUrl && (
            <div className="progress-overlay">
              <CircularProgressbar
                className="each-item-image-progress-bar"
                value={fileObj.progress}
                text={`${fileObj.progress}%`}
                styles={buildStyles({
                  pathColor: `rgba(255, 255, 255, ${fileObj.progress / 100})`,
                  textColor: "#fff",
                  trailColor: "transparent",
                })}
              />
            </div>
          )}
        </div>

        <div className="quote-container">
          {fileObj.uploadedUrl ? (
            <>
              {caption !== "" ? (
                <p className="quote">{caption}</p>
              ) : (
                <p
                  onClick={handleEditClick}
                  style={{ cursor: "pointer", color: "#9f9f9f" }}
                  className="quote"
                >
                  Write a caption (Optional)
                </p>
              )}
            </>
          ) : (
            <div className="skeleton-card">
              <div className="skeleton-header">Generating Caption...</div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          )}

          {caption !== "" && fileObj.uploadedUrl && (
            <div>
              <MdEdit className="quote-edit-icon" onClick={handleEditClick} />
              <IoIosCloseCircle
                className="quote-edit-icon"
                onClick={() => setShowRemoveQuoteModal(true)}
              />
            </div>
          )}
        </div>

        <div>
          <MdDelete
            className="each-item-delete-icon"
            onClick={() => setShowDeleteModal(true)}
          />
        </div>
      </div>
    </>
  );
};
