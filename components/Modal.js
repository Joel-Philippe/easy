import React from "react";
import { Box } from "@chakra-ui/react";

const Modal = ({ children, onClose }) => (
  <Box
    position="relative"
    top="0"
    left="0"
    width="100%"
    height="100%"
    bg="bisque"
    display="flex"
    justifyContent="center"
    alignItems="center"
    zIndex="1000"
  >
    <Box bg="white" p={6} borderRadius="md" width="400px" maxWidth="90%">
      <button
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "none",
          border: "none",
          fontSize: "1.5rem",
          cursor: "pointer",
        }}
        onClick={onClose}
      >
        ×
      </button>
      {children}
    </Box>
  </Box>
);

export default Modal;
