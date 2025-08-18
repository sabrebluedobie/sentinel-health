import React from 'react';
export const Card = ({className='', children}) => <div className={`rounded-xl border bg-white ${className}`}>{children}</div>;
export const CardHeader = ({className='', children}) => <div className={`p-4 ${className}`}>{children}</div>;
export const CardTitle = ({className='', children}) => <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
export const CardContent = ({className='', children}) => <div className={`p-4 ${className}`}>{children}</div>;
export const CardDescription = ({className='', children}) => <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;