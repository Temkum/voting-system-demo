import * as React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export const Alert: React.FC<AlertProps>;
export const AlertTitle: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>>;
