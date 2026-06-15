'use client';

export default function FeedbackFooterButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open-feedback'));
  };

  return (
    <button
      onClick={handleClick}
      className="hover:text-brand-600 transition-colors"
    >
      Feedback
    </button>
  );
}
