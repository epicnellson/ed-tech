import { useState, useEffect } from 'react';

export default function SelectWithOther({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = 'Select...',
  otherLabel = 'Other...',
  otherPlaceholder = 'Please specify',
  className = '',
  inputClassName = '',
}) {
  const [showOther, setShowOther] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  useEffect(() => {
    const isOtherValue = value && !options.some(opt => opt.value === value);
    if (isOtherValue && value !== otherLabel) {
      setShowOther(true);
      setOtherValue(value);
    }
  }, [value, options, otherLabel]);

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === '__other__') {
      setShowOther(true);
      onChange({ target: { name, value: otherValue } });
    } else {
      setShowOther(false);
      setOtherValue('');
      onChange(e);
    }
  };

  const handleOtherInputChange = (e) => {
    const inputValue = e.target.value;
    setOtherValue(inputValue);
    onChange({ target: { name, value: inputValue } });
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        name={name}
        value={showOther ? '__other__' : value}
        onChange={handleSelectChange}
        className="input"
        required={required && !showOther}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value="__other__">{otherLabel}</option>
      </select>

      {showOther && (
        <div className="mt-2">
          <input
            type="text"
            value={otherValue}
            onChange={handleOtherInputChange}
            placeholder={otherPlaceholder}
            className={inputClassName || "input"}
            required={required}
          />
        </div>
      )}
    </div>
  );
}
