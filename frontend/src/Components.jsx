// ── Composants réutilisables ──

export function AuthBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="auth-btn">
      {children}
    </button>
  );
}
