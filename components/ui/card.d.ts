import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps>;
export const CardHeader: React.FC<CardProps>;
export const CardTitle: React.FC<CardProps>;
export const CardDescription: React.FC<CardProps>;
export const CardContent: React.FC<CardProps>;
export const CardFooter: React.FC<CardProps>;
export const CardAction: React.FC<CardProps>;
