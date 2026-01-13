import * as React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: string;
}

export const Input: React.FC<InputProps>;
