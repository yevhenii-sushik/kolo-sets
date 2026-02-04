import React, { useEffect, useState } from "react";

/**
 * NDA / Beta modal
 * Показывается один раз (localStorage)
 */
export default function BetaNdaModal() {
  const STORAGE_KEY = "betaNdaAccepted";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) setOpen(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h3 style={titleStyle}><strong>⚠️ Beta Access / NDA</strong></h3>

        <p style={textStyle}>
          Данная версия <strong></strong> находится на этапе закрытого
          тестирования. Доступ предоставлен ограниченному кругу лиц.
        </p>

        <p style={textStyle}>
          Вы обязуетесь <strong>не передавать доступ</strong> третьим лицам и не
          распространять ссылку без согласования.
        </p>

        <p style={{ ...textStyle, fontStyle: "italic" }}>
          Прогресс может быть сброшен при обновлении системных модулей.
        </p>

        <button style={buttonStyle} onClick={handleAccept}>
          Понятно, продолжаем
        </button>
      </div>
    </div>
  );
}

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  background: "#fff3cd",
  color: "#856404",
  padding: "38px",
  borderRadius: "24px",
  maxWidth: "620px",
  width: "90%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};

const titleStyle = {  
  marginBottom: "12px",
  fontSize: "1.3rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const textStyle = {
  fontSize: "1.2rem",
  lineHeight: 1.6,
  marginBottom: "10px",
};

const buttonStyle = {
  marginTop: "16px",
  width: "100%",
  padding: "12px",
  borderRadius: "14px",
  border: "none",
  background: "#0d6efd",
  color: "#fff",
  fontSize: "0.95rem",
  cursor: "pointer",
};