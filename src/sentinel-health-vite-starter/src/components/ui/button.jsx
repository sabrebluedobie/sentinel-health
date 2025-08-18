import React from 'react';
export const Button = ({asChild, className='', ...props}) => {
  const Cmp = asChild ? 'span' : 'button';
  return <Cmp className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${className}`} {...props} />;
};