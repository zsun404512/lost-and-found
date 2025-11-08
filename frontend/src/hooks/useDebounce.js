import { useState, useEffect } from 'react';

// custom hook takes value and delay
export function useDebounce(value, delay) {
    // state to hold debounce value
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // timer to update debounced value after delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // if value changes, previous timer is cleared before starting a new one
        return () => {
            clearTimeout(handler);
        };

    }, [value, delay]);

    return debouncedValue;
}