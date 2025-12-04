// Small hook that returns a debounced version of a value, updating only
// after the given delay has passed without further changes.
import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {

    const [debouncedValue, setDebouncedValue] = useState(value);
    
    // update debounced value after delay, clear timeout if value changes
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };

    }, [value, delay]);

    return debouncedValue;
}