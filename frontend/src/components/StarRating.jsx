import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, onRatingChange, readOnly = false, size = 20 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isFilled = starValue <= displayRating;

        if (readOnly) {
          return (
            <Star
              key={starValue}
              size={size}
              fill={isFilled ? 'var(--secondary)' : 'none'}
              color={isFilled ? 'var(--secondary)' : 'var(--text-muted)'}
              style={{ flexShrink: 0 }}
            />
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={rating === starValue}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            onClick={() => onRatingChange && onRatingChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s ease',
            }}
          >
            <Star
              size={size}
              fill={isFilled ? 'var(--secondary)' : 'none'}
              color={isFilled ? 'var(--secondary)' : 'var(--text-muted)'}
              style={{
                transition: 'fill 0.15s ease, color 0.15s ease',
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
