// EditorPage.jsx
import React, { useCallback, useState, useEffect, useRef } from "react";
import Compressor from "compressorjs";
import heic2any from "heic2any";
import { db, storage } from "../Firebase/firebase"; // removed 'auth'
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { Header } from "../Components/Header";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "../Components/SortableItem";
import { LoginModal } from "../Components/LoginModal";
import "../Pages/EditorPage.css";
// Removed onAuthStateChanged import

import { UploadCheckoutButton } from "../Components/UploadCheckoutButton";

// ADDED: userDetails and onLoginSuccess to props
export const EditorPage = ({
  uploadID,
  product,
  pages,
  theme,
  type,
  userDetails,
  onLoginSuccess,
}) => {
  const [files, setFiles] = useState([]);
  const [defaultQuotes, setDefaultQuotes] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const uploadTasksRef = useRef([]);
  const filesRef = useRef(files);
  const showedLoginModalRef = useRef(false);

  // --- Handle Parameter Changes ---
  // (This useEffect remains EXACTLY the same as your original code)
  useEffect(() => {
    const handleParameterChanges = async () => {
      if (!uploadID) return;
      try {
        const docRef = doc(db, "leads", uploadID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const currentData = docSnap.data();
          const pDetails = currentData.productDetails || {};
          const currentTheme = pDetails.theme || "";
          const currentPages = parseInt(pDetails.pages) || 0;
          const newPages = parseInt(pages) || 0;
          const currentProduct = pDetails.product || "";
          const currentType = pDetails.type || "";

          if (currentTheme !== theme) {
            await setDoc(
              docRef,
              {
                productDetails: { ...pDetails, theme: theme, pages: newPages },
                uploads: [],
                updatedAt: new Date().toISOString(),
              },
              { merge: true },
            );
            setFiles([]);
          } else if (currentPages !== newPages) {
            if (newPages < currentPages) {
              const currentUploads = currentData.uploads || [];
              if (currentUploads.length > newPages) {
                const newUploads = currentUploads.slice(0, newPages);
                await updateDoc(docRef, {
                  uploads: newUploads,
                  "productDetails.pages": newPages,
                  updatedAt: new Date().toISOString(),
                });
                setFiles((prev) => prev.slice(0, newPages));
              }
            } else {
              await updateDoc(docRef, {
                "productDetails.pages": newPages,
                updatedAt: new Date().toISOString(),
              });
            }
          }
          if (currentProduct !== product || currentType !== type) {
            await updateDoc(docRef, {
              "productDetails.product": product,
              "productDetails.type": type,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("Parameter update error:", error);
      }
    };
    handleParameterChanges();
  }, [product, pages, theme, type, uploadID]);

  // --- Sync Refs ---
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((file) => {
        if (file.preview && file.preview.startsWith("blob:")) {
          URL.revokeObjectURL(file.preview);
        }
      });
      uploadTasksRef.current.forEach((task) => task.cancel && task.cancel());
      uploadTasksRef.current = [];
    };
  }, []);

  // --- Load Existing Files ---
  // (This useEffect remains EXACTLY the same)
  useEffect(() => {
    const loadExistingFiles = async () => {
      if (!uploadID) return;
      setIsFetching(true);
      try {
        const docRef = doc(db, "leads", uploadID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const storedUploads = data.uploads || [];
          const mappedFiles = storedUploads.map((item) => ({
            id: item.id,
            file: null,
            preview: item.url,
            uploadedUrl: item.url,
            progress: 100,
            caption: item.caption || "",
          }));
          setFiles(mappedFiles);
        }
      } catch (error) {
        console.error("Error loading existing files:", error);
      } finally {
        setIsFetching(false);
      }
    };
    loadExistingFiles();
  }, [uploadID]);

  // --- Load Quotes ---
  useEffect(() => {
    const abortController = new AbortController();
    fetch(`/quotes/${theme}.json`, { signal: abortController.signal })
      .then((response) => response.json())
      .then((data) => setDefaultQuotes(data))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => abortController.abort();
  }, [theme]);

  // --- UPDATED AUTH CHECK ---
  // If files exist, but we have no userDetails, trigger login
  useEffect(() => {
    if (files.length > 0 && !userDetails && !showedLoginModalRef.current) {
      setShowLoginModal(true);
      showedLoginModalRef.current = true;
    }
    // If userDetails arrived, reset the ref so we don't block future checks (optional)
    if (userDetails) {
      showedLoginModalRef.current = false;
      setShowLoginModal(false); // Close it if it was open
    }
  }, [files.length, userDetails]);

  // --- Update Firestore ---
  const updateFirestoreData = async (currentFiles) => {
    if (!uploadID) return;
    try {
      const docRef = doc(db, "leads", uploadID);
      const uploadsArray = currentFiles
        .filter((f) => f.uploadedUrl)
        .map((f) => ({
          id: f.id,
          url: f.uploadedUrl,
          caption: f.caption || "",
        }));

      await updateDoc(docRef, {
        uploads: uploadsArray,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating Firestore data:", error);
    }
  };

  // --- Drag & Drop Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFiles((prevFiles) => {
      const oldIndex = prevFiles.findIndex((file) => file.id === active.id);
      const newIndex = prevFiles.findIndex((file) => file.id === over.id);
      const updatedFiles = arrayMove(prevFiles, oldIndex, newIndex);
      updateFirestoreData(updatedFiles);
      return updatedFiles;
    });
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      setLoading(true);
      setIsConverting(true);
      const maxAllowed = parseInt(pages) - files.length;
      if (maxAllowed <= 0) {
        setLoading(false);
        setIsConverting(false);
        return;
      }
      acceptedFiles = acceptedFiles.slice(0, maxAllowed);
      (async () => {
        try {
          for (const eachAcceptedFile of acceptedFiles) {
            let fileToProcess = eachAcceptedFile;
            if (
              fileToProcess.type === "image/heic" ||
              fileToProcess.name.toLowerCase().endsWith(".heic")
            ) {
              const convertedBlob = await heic2any({
                blob: eachAcceptedFile,
                toType: "image/jpeg",
                quality: 0.9,
              });
              fileToProcess = new File(
                [convertedBlob],
                eachAcceptedFile.name.replace(/\.heic$/i, ".jpg"),
                { type: "image/jpeg", lastModified: Date.now() },
              );
            }
            await new Promise((resolve) => {
              new Compressor(fileToProcess, {
                quality: 0.9,
                maxWidth: 1920,
                success: (compressedFile) => {
                  const uniqueFilename = `${Date.now()}_${compressedFile.name.replace(/\s+/g, "_")}`;
                  const newFileObj = {
                    id: uniqueFilename,
                    file: compressedFile,
                    preview: URL.createObjectURL(compressedFile),
                    progress: 0,
                    uploadedUrl: null,
                    caption: "",
                  };
                  setFiles((prev) => {
                    const currentIndex = prev.length;
                    const assignedCaption = defaultQuotes[currentIndex] || "";
                    const fileWithCaption = {
                      ...newFileObj,
                      caption: assignedCaption,
                    };
                    return [...prev, fileWithCaption];
                  });
                  uploadFile(compressedFile, newFileObj, uniqueFilename);
                  resolve();
                },
                error: (error) => {
                  console.error("Compression failed:", error);
                  setLoading(false);
                  resolve();
                },
              });
            });
          }
        } catch (error) {
          console.error("File processing failed:", error);
        } finally {
          setLoading(false);
          setIsConverting(false);
        }
      })();
    },
    [files, pages, uploadID, defaultQuotes],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    maxSize: 50 * 1024 * 1024,
  });

  const updateQuote = (fileId, newQuote) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.map((f) =>
        f.id === fileId ? { ...f, caption: newQuote } : f,
      );
      updateFirestoreData(updatedFiles);
      return updatedFiles;
    });
  };

  const handleDelete = (fileId) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((file) => file.id !== fileId);
      updateFirestoreData(updatedFiles);
      return updatedFiles;
    });
  };

  const uploadFile = (file, fileObj, uniqueFilename) => {
    const storageRef = ref(storage, `leads/${uploadID}/${uniqueFilename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTasksRef.current.push(uploadTask);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileObj.id ? { ...f, progress: Math.round(progress) } : f,
          ),
        );
      },
      (error) => {
        console.error("Upload failed:", error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFiles((prevFiles) => {
          const updatedFiles = prevFiles.map((f) =>
            f.id === fileObj.id ? { ...f, uploadedUrl: downloadURL } : f,
          );
          updateFirestoreData(updatedFiles);
          return updatedFiles;
        });
        uploadTasksRef.current = uploadTasksRef.current.filter(
          (task) => task !== uploadTask,
        );
      },
    );
  };

  const [loading, setLoading] = useState(false); // Helper for drag drop loading state

  return (
    <>
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={onLoginSuccess} // Pass the handler here
        />
      )}

      {/* ... Rest of JSX remains the same ... */}

      {isConverting && (
        <div className="conversion-overlay">
          <div className="spinner"></div>
          <p
            style={{
              color: "#fff",
              marginTop: "10px",
              textAlign: "center",
              fontSize: "12px",
            }}
          >
            Please wait, loading images...
            <br />
            It takes 5 to 10 seconds, depending on the size of the pictures.
          </p>
        </div>
      )}

      <div className="root-app">
        <Header
          product={product}
          theme={theme}
          pages={pages}
          type={type}
          files={files}
          user={userDetails} // Pass userDetails instead of auth user object
          onLoginClick={() => setShowLoginModal(true)}
        />

        <div className={`container ${files.length > 0 ? "with-padding" : ""}`}>
          <div className="items-list">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={files}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {files.map((fileObj, index) => (
                    <React.Fragment key={fileObj.id}>
                      {index === 0 ? (
                        <p style={{ marginBottom: "5px", fontSize: "12px" }}>
                          Front Cover
                        </p>
                      ) : index === parseInt(pages) - 1 ? (
                        <p style={{ marginBottom: "5px", fontSize: "12px" }}>
                          Back Cover
                        </p>
                      ) : (
                        <p style={{ marginBottom: "5px", fontSize: "12px" }}>
                          Page {index + 1}
                        </p>
                      )}
                      <SortableItem
                        key={fileObj.id}
                        fileObj={fileObj}
                        caption={fileObj.caption || ""}
                        onDelete={() => handleDelete(fileObj.id)}
                        updateQuote={(newQuote) =>
                          updateQuote(fileObj.id, newQuote)
                        }
                      />
                    </React.Fragment>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          {isFetching && (
            <div className="conversion-overlay">
              <div className="spinner"></div>
              <p
                style={{
                  color: "#fff",
                  marginTop: "10px",
                  textAlign: "center",
                  fontSize: "12px",
                }}
              >
                Please wait, Loading the page
              </p>
            </div>
          )}

          <UploadCheckoutButton
            pages={pages}
            uploadID={uploadID}
            files={files}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
          />
        </div>
      </div>
    </>
  );
};
