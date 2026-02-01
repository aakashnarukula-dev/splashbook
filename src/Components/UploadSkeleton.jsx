import React from "react";

export const UploadSkeleton = () => {
  // Create an array of 6 items to fill the screen
  const items = Array.from({ length: 6 });

  return (
    // 1. FIXED POSITION: Breaks out of #root padding constraints
    <div
      style={{
        paddingLeft: "10px",
        paddingRight: "10px",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      {/* Header Skeleton */}
      <div
        className="header-skeleton"
        style={{
          height: "70px",
          width: "100%",
          backgroundColor: "white",
          marginBottom: "20px",
          borderBottom: "1px solid #eee",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            padding: "0 10px",
            gap: "10px",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          <div
            className="sk-shimmer"
            style={{ width: "30px", height: "30px", borderRadius: "50%" }}
          ></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div
              className="sk-shimmer"
              style={{ width: "120px", height: "14px", borderRadius: "4px" }}
            ></div>
            <div
              className="sk-shimmer"
              style={{ width: "80px", height: "10px", borderRadius: "4px" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div
        className="container skeleton-view"
        style={{
          paddingTop: "20px",
          paddingLeft: "10px",
          paddingRight: "10px",
          maxWidth: "500px",
          margin: "0 auto",
          width: "100%", // Ensures it takes full available width
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%" }}>
          {items.map((_, index) => (
            <div
              key={index}
              className="item-wrapper skeleton-wrapper"
              style={{
                marginBottom: "10px",
                position: "relative",
                paddingTop: "24px",
              }}
            >
              {/* Fake Page Counter */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "5px",
                  width: "50px",
                  height: "12px",
                  backgroundColor: "#eee",
                  borderRadius: "4px",
                }}
              ></div>

              <div
                className="each-item-container skeleton-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px",
                  borderRadius: "10px",
                  boxShadow: "0px 0px 3px rgba(0, 0, 0, 0.2)",
                  backgroundColor: "white",
                  height: "auto",
                }}
              >
                {/* Drag Handle Mock */}
                <div
                  style={{
                    padding: "0 5px",
                    color: "#eee",
                    width: "20px",
                    textAlign: "center",
                  }}
                >
                  ≡
                </div>

                {/* Image Placeholder */}
                <div
                  className="image-container sk-shimmer"
                  style={{
                    width: "80px",
                    height: "100px",
                    borderRadius: "8px",
                    flexShrink: 0,
                  }}
                ></div>

                {/* Caption Placeholder */}
                <div
                  className="quote-wrapper"
                  style={{
                    flex: 1,
                    display: "flex",
                    backgroundColor: "#fcfcfc",
                    border: "1px solid #e1e1e1",
                    borderRadius: "8px",
                    minHeight: "100px",
                    overflow: "hidden",
                    padding: "8px",
                    gap: "5px",
                  }}
                >
                  <div className="quote-box" style={{ flex: 1, width: "100%" }}>
                    <div
                      className="quote-skeleton"
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <div
                        className="sk-line sk-shimmer"
                        style={{
                          height: "10px",
                          borderRadius: "4px",
                          background: "#eee",
                          width: "100%",
                        }}
                      ></div>
                      <div
                        className="sk-line sk-shimmer"
                        style={{
                          height: "10px",
                          borderRadius: "4px",
                          background: "#eee",
                          width: "100%",
                        }}
                      ></div>
                      <div
                        className="sk-line short sk-shimmer"
                        style={{
                          height: "10px",
                          borderRadius: "4px",
                          background: "#eee",
                          width: "60%",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div
                    className="item-actions"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    <div
                      className="action-btn-sk"
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: "#eee",
                      }}
                    ></div>
                    <div
                      className="action-btn-sk"
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: "#eee",
                      }}
                    ></div>
                  </div>
                </div>

                {/* Delete Icon Mock */}
                <div style={{ padding: "0 5px", color: "#eee" }}>🗑</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
