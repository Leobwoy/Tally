/**
 * BibleStudyInput.jsx
 * Input for adding bible study contact names.
 * Features autocomplete from saved contacts and tag-pill display.
 *
 * Props:
 *   value     {string[]}  — current list of names for today's entry
 *   onChange  {function}  — called with updated names array
 */

import React, { useState, useEffect, useRef } from "react";
import { searchContacts } from "@/db/db";
import styles from "./BibleStudyInput.module.css";

export default function BibleStudyInput({ value = [], onChange }) {
  const [inputVal,     setInputVal]     = useState("");
  const [suggestions,  setSuggestions]  = useState([]);
  const [showSuggest,  setShowSuggest]  = useState(false);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  /* Search contacts whenever input changes */
  useEffect(() => {
    if (!inputVal.trim()) {
      setSuggestions([]);
      return;
    }
    searchContacts(inputVal).then((results) => {
      /* Filter out names already added */
      setSuggestions(results.filter((n) => !value.includes(n)));
    });
  }, [inputVal, value]);

  /* Close suggestions when clicking outside */
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /** Add a name to the list */
  function addName(name) {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputVal("");
    setSuggestions([]);
    setShowSuggest(false);
    inputRef.current?.focus();
  }

  /** Remove a name from the list */
  function removeName(name) {
    onChange(value.filter((n) => n !== name));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && inputVal.trim()) {
      e.preventDefault();
      addName(inputVal);
    }
    /* Backspace on empty input removes last name */
    if (e.key === "Backspace" && !inputVal && value.length > 0) {
      removeName(value[value.length - 1]);
    }
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      {/* Text input + add button */}
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add a name..."
          className={styles.input}
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          className={styles.addBtn}
          onClick={() => addName(inputVal)}
          disabled={!inputVal.trim()}
          aria-label="Add name"
        >
          +
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {showSuggest && suggestions.length > 0 && (
        <ul className={styles.suggestions} role="listbox">
          {suggestions.map((name) => (
            <li
              key={name}
              className={styles.suggestion}
              role="option"
              onMouseDown={(e) => { e.preventDefault(); addName(name); }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}

      {/* Added name pills */}
      {value.length > 0 && (
        <div className={styles.pills}>
          {value.map((name) => (
            <div key={name} className={styles.pill}>
              {name}
              <button
                className={styles.pillRemove}
                onClick={() => removeName(name)}
                aria-label={`Remove ${name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
