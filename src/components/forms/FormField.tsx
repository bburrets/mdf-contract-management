import React, { forwardRef } from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  error?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const FormField = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, FormFieldProps>(
  ({ label, type = 'text', error, required, children, className = '', ...props }, ref) => {
    const baseInputClasses = `
      w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-100 disabled:cursor-not-allowed
      ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
      ${className}
    `.trim();

    const renderInput = () => {
      if (type === 'select') {
        return (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            className={baseInputClasses}
            aria-invalid={error ? 'true' : 'false'}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {children}
          </select>
        );
      }
      
      if (type === 'textarea') {
        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`${baseInputClasses} min-h-[100px] resize-vertical`}
            aria-invalid={error ? 'true' : 'false'}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        );
      }

      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type={type}
          className={baseInputClasses}
          aria-invalid={error ? 'true' : 'false'}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      );
    };

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderInput()}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;